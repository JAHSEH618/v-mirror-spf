import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    if (!admin) {
        // The invalid signature error is handled by the authenticate.webhook method.
        // So this really only happens if the webhook is not an admin webhook.
        throw new Response();
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
                const existingBilling = await prisma.billingInfo.findUnique({ where: { shop } });
                if (existingBilling) {
                    dbPlanName = existingBilling.planName;
                    dbLimit = existingBilling.usageLimit;
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

        // Update DB
        try {
            await prisma.billingInfo.upsert({
                where: { shop },
                update: {
                    planName: dbPlanName,
                    status: dbStatus,
                    usageLimit: dbLimit,
                },
                create: {
                    shop,
                    planName: dbPlanName,
                    status: dbStatus,
                    usageLimit: dbLimit,
                    currentUsage: 0,
                }
            });
            console.log(`[Webhook] Updated billing info for ${shop}: ${dbPlanName} (${dbStatus})`);
        } catch (e) {
            console.error(`[Webhook] Failed to update billing info for ${shop}:`, e);
        }
    }

    return new Response("Webhook processed", { status: 200 });
};
