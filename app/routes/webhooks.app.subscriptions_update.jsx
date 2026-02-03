import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { webhookResponse } from "../utils/responses.server";
import { syncSubscriptionState } from "../services/subscription.server";

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

    console.log(`Received ${topic} webhook for ${shop}`);

    if (topic === "APP_SUBSCRIPTIONS_UPDATE") {
        const subscription = payload.app_subscription;

        console.log(`Handling subscription update for ${shop}: ${subscription.name} -> ${subscription.status}`);

        // OPTIMIZATION: Use centralized sync logic
        try {
            // syncSubscriptionState expects a shopify subscription object
            // The webhook payload has 'app_subscription' which matches the structure reasonably well,
            // but we should ensure naming aligns.
            // Payload: { app_subscription: { status, name, current_period_end, ... } }
            // API Object: { status, name, currentPeriodEnd, ... }
            // Note: Webhook uses snake_case (current_period_end) vs API camelCase.
            // We need to normalize for the service if it expects API format.

            // Normalize payload to match API object structure for the service
            const normalizedSubscription = {
                ...subscription,
                currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : undefined
            };

            await syncSubscriptionState(shop, normalizedSubscription, true);
            console.log(`[Webhook] Successfully synced subscription for ${shop}`);
        } catch (e) {
            console.error(`[Webhook] Failed to sync subscription for ${shop}:`, e);
        }
    }

    return webhookResponse('success', "Webhook processed");
};
