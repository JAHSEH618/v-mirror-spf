import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { webhookResponse } from "../utils/responses.server";

export const action = async ({ request }) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    if (!admin) {
        // The invalid signature error is handled by the authenticate.webhook method.
        // So this really only happens if the webhook is not an admin webhook.
        throw new Response();
    }

    // P1 FIX: Webhook idempotency check
    // Shopify may retry webhooks, so we track processed webhookIds to prevent duplicate handling
    const webhookId = request.headers.get("X-Shopify-Webhook-Id");
    if (webhookId) {
        try {
            // Use upsert to atomically check and record
            const existing = await prisma.webhookEvent.findUnique({ where: { webhookId } });
            if (existing) {
                console.log(`[Webhook] Duplicate ${topic} webhook ${webhookId} for ${shop}, skipping`);
                return webhookResponse('duplicate');
            }
            // Record this webhook as being processed
            await prisma.webhookEvent.create({
                data: { webhookId, topic, shop }
            });
        } catch (idempotencyError) {
            // If unique constraint violation, another process already handled it
            if (idempotencyError.code === 'P2002') {
                console.log(`[Webhook] Race condition on ${topic} webhook ${webhookId}, skipping`);
                return webhookResponse('duplicate');
            }
            console.error("[Webhook] Idempotency check error:", idempotencyError.message);
            // Continue processing if idempotency check fails (better than dropping webhook)
        }
    }

    // The topics handled here are:
    // APP_SUBSCRIPTIONS_UPDATE

    console.log(`Received ${topic} webhook for ${shop}`);

    if (topic === "APP_SUBSCRIPTIONS_UPDATE") {
        const subscription = payload.app_subscription;
        const planName = subscription.name;
        const status = subscription.status;

        console.log(`Handling subscription update for ${shop}: ${planName} -> ${status}`);

        let dbStatus = "ACTIVE";
        let dbPlanName = "Free Plan";
        let dbLimit = 2; // Default free limit

        // Map Shopify status to internal status/plan
        // Shopify statuses: ACTIVE, DECLINED, EXPIRED, FROZEN, CANCELLED, PENDING
        switch (status) {
            case "ACTIVE":
                dbStatus = "ACTIVE";
                // Determine plan based on subscription name
                if (planName.includes("Enterprise")) {
                    dbPlanName = "Enterprise Plan";
                    dbLimit = 10000;
                } else if (planName.includes("Professional")) {
                    dbPlanName = "Professional Plan";
                    dbLimit = 1000;
                } else {
                    // Unknown paid plan - default to professional limits
                    dbPlanName = planName;
                    dbLimit = 1000;
                }
                break;

            case "FROZEN":
                // Merchant's billing is frozen - keep plan but mark status
                // They should retain access until unfrozen or cancelled
                dbStatus = "FROZEN";
                if (planName.includes("Enterprise")) {
                    dbPlanName = "Enterprise Plan";
                    dbLimit = 10000;
                } else if (planName.includes("Professional")) {
                    dbPlanName = "Professional Plan";
                    dbLimit = 1000;
                }
                break;

            case "PENDING":
                // Subscription is pending approval - preserve current plan/limits
                // Query existing billing to not reset their current state
                dbStatus = "PENDING";
                const existingSub = await prisma.shopSubscription.findUnique({ where: { shopId: shop } });
                if (existingSub) {
                    dbPlanName = existingSub.planName;
                    dbLimit = existingSub.usageLimit;
                }
                break;

            case "CANCELLED":
            case "EXPIRED":
            case "DECLINED":
            default:
                // Downgrade to Free for all terminal states
                dbStatus = status === "CANCELLED" ? "CANCELLED" : status === "EXPIRED" ? "EXPIRED" : "DECLINED";
                dbPlanName = "Free Plan";
                dbLimit = 2;
                break;
        }

        // Update DB (ShopSubscription)
        try {
            // Ensure shop exists
            await prisma.shop.upsert({
                where: { id: shop },
                update: {},
                create: { id: shop }
            });

            const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : undefined;
            // Fallback for cycleEndDate: if provided by Shopify use it, otherwise keep existing or set default

            await prisma.shopSubscription.upsert({
                where: { shopId: shop },
                update: {
                    planName: dbPlanName,
                    status: dbStatus,
                    usageLimit: dbLimit,
                    cycleEndDate: currentPeriodEnd, // Trust Shopify's date if present
                    lastSyncTime: new Date()
                },
                create: {
                    shopId: shop,
                    planName: dbPlanName,
                    status: dbStatus,
                    usageLimit: dbLimit,
                    currentUsage: 0,
                    cycleStartDate: new Date(), // New sub
                    cycleEndDate: currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    lastSyncTime: new Date()
                }
            });
            console.log(`[Webhook] Updated subscription for ${shop}: ${dbPlanName} (${dbStatus})`);
        } catch (e) {
            console.error(`[Webhook] Failed to update billing info for ${shop}:`, e);
        }
    }

    return webhookResponse('success', "Webhook processed");
};
