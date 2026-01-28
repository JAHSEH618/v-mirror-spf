import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    if (!admin) {
        // The admin context isn't available if the webhook fired after a shop was uninstalled.
        return new Response();
    }

    // The topics handled here should be declared in the shopify.server.js.
    // General error handling or payload validation
    if (topic !== "ORDERS_CREATE") {
        return new Response("Topic not supported", { status: 404 });
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

            // We only update stats for products that we are tracking (have ProductStat)
            // This ensures we focus on "V-Mirror" related analytics or at least products that entered our system
            // If you want to track ALL products, you would use upsert.
            // For now, based on "Conversion Rate" of Try-On, we update if exists.

            const stat = await prisma.productStat.findUnique({
                where: {
                    shop_productId: {
                        shop,
                        productId
                    }
                }
            });

            if (stat) {
                await prisma.productStat.update({
                    where: { id: stat.id },
                    data: {
                        orderedCount: { increment: quantity },
                        revenue: { increment: lineRevenue }
                    }
                });
                console.log(`[V-Mirror] Attributed sale for Product ${productId}: +$${lineRevenue}`);
            }
        }

    } catch (error) {
        console.error("Error processing ORDERS_CREATE webhook:", error);
        return new Response("Error processing webhook", { status: 500 });
    }

    return new Response();
};
