import prisma from "../db.server";

// This route handles App Proxy requests from the storefront
// URL: /apps/v-mirror/api/settings?shop=xxx.myshopify.com
export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    console.log(`[API Debug] Settings request received for shop: ${shop}`);

    if (!shop) {
        console.error("[API Debug] Missing shop parameter");
        return new Response(JSON.stringify({ error: "Shop parameter required" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
        });
    }

    // Get settings for this shop
    let settings = await prisma.widgetSettings.findUnique({
        where: { shop },
    });

    // Return default settings if not found
    if (!settings) {
        console.log(`[API Debug] No settings found for ${shop}, returning defaults`);
        settings = {
            position: "bottom-right",
            horizontalOffset: 20,
            verticalOffset: 20,
            primaryColor: "#7C3AED",
            textColor: "#FFFFFF",
            logoUrl: null,
            buttonText: "Try It On",
            tooltipText: "See how it looks on you!",
            modalTitle: "AI Virtual Try-On",
            uploadInstructions: "Upload a full-body photo for best results",
            smartDetection: false,
            showOnMobile: true,
            animationStyle: "fade-in",
        };
    } else {
        console.log(`[API Debug] Returning saved settings for ${shop}`);
    }

    // Return settings as JSON with CORS headers for storefront
    return new Response(JSON.stringify(settings), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate", // Allow no caching
        },
    });
};
