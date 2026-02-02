import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { webhookResponse } from "../utils/responses.server";

export const action = async ({ request }) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    if (!admin) {
        // The admin context isn't available if the webhook fired after a shop was uninstalled.
        return new Response();
    }

    // P1 FIX: Webhook idempotency check
    // Shopify may retry webhooks, so we track processed webhookIds to prevent duplicate handling
    const webhookId = request.headers.get("X-Shopify-Webhook-Id");
    if (webhookId) {
        try {
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

    // The topics handled here should be declared in the shopify.server.js.
    // General error handling or payload validation
    if (topic !== "ORDERS_CREATE") {
        return webhookResponse('permanent_failure', "Topic not supported");
    }

    try {
        const order = payload;

        // We process line items to attribute sales to products
        for (const item of order.line_items) {
            if (!item.product_id) continue;

            const productId = String(item.product_id); // Ensure string format
            const quantity = item.quantity;
            const price = parseFloat(item.price);
            const lineRevenue = price * quantity;

            // CHECK SOURCING: Only count if user came from V-Mirror
            // Loop through properties to find '_from_v_mirror'
            const hasAttribution = item.properties?.some(
                p => p.name === '_from_v_mirror' && String(p.value) === 'true'
            );

            if (!hasAttribution) {
                console.log(`[V-Mirror] Skipping attribution for Product ${productId} - No attribution tag.`);
                continue;
            }

            // P3 FIX: Use upsert to track ALL attributed orders, even for new products
            // This ensures complete conversion tracking regardless of prior try-on activity
            await prisma.productStat.upsert({
                where: { shop_productId: { shop, productId } },
                update: {
                    orderedCount: { increment: quantity },
                    revenue: { increment: lineRevenue }
                },
                create: {
                    shop,
                    productId,
                    productTitle: item.title || 'Unknown Product',
                    tryOnCount: 0,
                    orderedCount: quantity,
                    revenue: lineRevenue
                }
            });
            console.log(`[V-Mirror] Attributed sale for Product ${productId}: +$${lineRevenue}`);
        }

    } catch (error) {
        console.error("Error processing ORDERS_CREATE webhook:", error);
        return webhookResponse('temporary_failure', "Error processing webhook");
    }

    return webhookResponse('success');
};
