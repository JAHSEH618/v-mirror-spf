/* eslint-disable no-undef */
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

// Handle OPTIONS (Preflight)
export const loader = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Authenticate the App Proxy request
        let shop;
        try {
            const { session } = await authenticate.public.appProxy(request);
            if (session) {
                shop = session.shop;
            }
        } catch (authError) {
            console.error("[CDN Status] App Proxy authentication failed:", authError.message);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        if (!shop) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        // Get taskId from query parameters
        const url = new URL(request.url);
        const taskId = url.searchParams.get("taskId");

        if (!taskId) {
            return new Response(JSON.stringify({ error: "Missing taskId parameter" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Query upload task status
        const task = await prisma.uploadTask.findUnique({
            where: { taskId },
            select: {
                taskId: true,
                status: true,
                cdnUrl: true,
                error: true,
                createdAt: true,
                completedAt: true
            }
        });

        if (!task) {
            return new Response(JSON.stringify({
                error: "Task not found",
                taskId
            }), {
                status: 404,
                headers: corsHeaders
            });
        }

        // Security: Verify task belongs to requesting shop
        const taskWithShop = await prisma.uploadTask.findUnique({
            where: { taskId },
            select: { shop: true }
        });

        if (taskWithShop.shop !== shop) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 403,
                headers: corsHeaders
            });
        }

        // Return task status
        return new Response(JSON.stringify({
            taskId: task.taskId,
            status: task.status,
            cdnUrl: task.cdnUrl,
            error: task.error,
            createdAt: task.createdAt,
            completedAt: task.completedAt
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("[CDN Status] Error:", error);
        return new Response(JSON.stringify({
            error: "Internal Server Error",
            message: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
};
