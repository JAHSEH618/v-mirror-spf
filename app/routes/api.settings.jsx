import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Simple in-memory cache for widget settings
const settingsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedSettings(shop) {
    const cached = settingsCache.get(shop);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedSettings(shop, data) {
    settingsCache.set(shop, { data, timestamp: Date.now() });
}

// Clean up old cache entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [shop, cached] of settingsCache.entries()) {
        if (now - cached.timestamp > CACHE_TTL * 2) {
            settingsCache.delete(shop);
        }
    }
}, 10 * 60 * 1000);

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

    // P2 FIX: Check cache first
    const cachedSettings = getCachedSettings(shop);
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

    // P2 FIX: Cache the settings
    setCachedSettings(shop, settings);

    // Return settings as JSON with CORS headers for storefront
    return new Response(JSON.stringify(settings), {
        headers: {
            ...corsHeaders,
            "Cache-Control": "public, max-age=300", // 5 minutes client cache
            "X-Cache": "MISS"
        },
    });
};
