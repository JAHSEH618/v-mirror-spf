/* eslint-disable no-undef */
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

export const loader = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: corsHeaders
    });
};

export const action = async ({ request }) => {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        // Authenticate proxy request
        let shop;
        try {
            const { session } = await authenticate.public.appProxy(request);
            if (session) shop = session.shop;
        } catch (e) {
            // Fallback for local dev testing
            const url = new URL(request.url);
            shop = url.searchParams.get("shop");
        }

        if (!shop) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        const body = await request.json();
        const { eventType, productId, productTitle } = body;

        if (eventType === 'add_to_cart' && productId) {
            const pId = String(productId);

            // Track Add to Cart
            const existingProduct = await prisma.productStat.findUnique({
                where: { shop_productId: { shop, productId: pId } }
            });

            if (existingProduct) {
                await prisma.productStat.update({
                    where: { id: existingProduct.id },
                    data: { addToCartCount: { increment: 1 } }
                });
            } else {
                // Should ideally exist from try-on, but create if not
                await prisma.productStat.create({
                    data: {
                        shop,
                        productId: pId,
                        productTitle: productTitle || "Unknown Product",
                        addToCartCount: 1
                    }
                });
            }

            console.log(`[Analytics] Tracked Add-To-Cart for ${pId}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return new Response(JSON.stringify({ error: "Server Error" }), {
            status: 500,
            headers: corsHeaders
        });
    }
};
