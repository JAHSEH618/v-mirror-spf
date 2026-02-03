import prisma from "../db.server";
import { authenticate } from "../shopify.server";

import { getHealthyRedis, REDIS_KEYS } from "../redis.server";

const SETTINGS_CACHE_TTL = 300; // 5 minutes in seconds

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

// This route handles App Proxy requests from the storefront
// URL: /apps/v-mirror/api/settings?shop=xxx.myshopify.com
export const loader = async ({ request }) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // P0 FIX: Authenticate App Proxy request - no fallback allowed
    let shop;
    try {
        const { session } = await authenticate.public.appProxy(request);
        if (session) {
            shop = session.shop;
        }
    } catch (authError) {
        console.error("[API Debug] App Proxy authentication failed:", authError.message);
        return new Response(JSON.stringify({ error: "Unauthorized - Invalid request signature" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    if (!shop) {
        console.error("[API Debug] Missing shop from authenticated session");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    // P2 FIX: Check Redis cache first
    let cachedSettings = null;
    let redis = null;
    try {
        redis = await getHealthyRedis();
        const cached = await redis.get(`vmirror:settings:${shop}`);
        if (cached) {
            cachedSettings = JSON.parse(cached);
        }
    } catch (e) {
        console.warn("[Redis] Cache read failed (falling back to DB):", e.message);
    }

    if (cachedSettings) {
        return new Response(JSON.stringify(cachedSettings), {
            headers: {
                ...corsHeaders,
                "Cache-Control": "public, max-age=300", // 5 minutes client cache
                "X-Cache": "HIT"
            },
        });
    }

    // Get settings for this shop
    let settings = await prisma.widgetSettings.findUnique({
        where: { shop },
    });

    // Return default settings if not found
    if (!settings) {
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
    }

    // P2 FIX: Cache the settings in Redis
    if (redis) {
        try {
            await redis.set(`vmirror:settings:${shop}`, JSON.stringify(settings), 'EX', SETTINGS_CACHE_TTL);
        } catch (e) {
            console.warn("[Redis] Cache write failed:", e.message);
        }
    }

    // Return settings as JSON with CORS headers for storefront
    return new Response(JSON.stringify(settings), {
        headers: {
            ...corsHeaders,
            "Cache-Control": "public, max-age=300", // 5 minutes client cache
            "X-Cache": "MISS"
        },
    });
};
