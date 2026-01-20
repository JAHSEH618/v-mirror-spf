import jwt from "jsonwebtoken";

const KLINGAI_ACCESS_KEY = process.env.KLINGAI_ACCESS_KEY;
const KLINGAI_SECRET_KEY = process.env.KLINGAI_SECRET_KEY;
const KLINGAI_BASE_URL = "https://api-beijing.klingai.com/v1/images/kolors-virtual-try-on";

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

// Helper: Generate JWT Token using library
function generateJwtToken(ak, sk) {
    if (!ak || !sk) return null;

    const payload = {
        iss: ak,
        exp: Math.floor(Date.now() / 1000) + 1800,
        nbf: Math.floor(Date.now() / 1000) - 5
    };

    return jwt.sign(payload, sk, {
        algorithm: "HS256",
        header: {
            typ: "JWT"
        }
    });
}

export const loader = async ({ request }) => {
    // Handle OPTIONS request for CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");

    if (!taskId) {
        return new Response(JSON.stringify({ error: "Missing taskId" }), {
            status: 400,
            headers: corsHeaders
        });
    }

    if (!KLINGAI_ACCESS_KEY || !KLINGAI_SECRET_KEY) {
        console.error("Missing KlingAI Credentials");
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
            headers: corsHeaders
        });
    }

    try {
        const token = generateJwtToken(KLINGAI_ACCESS_KEY, KLINGAI_SECRET_KEY);

        // 1. Call KlingAI Query API
        const response = await fetch(`${KLINGAI_BASE_URL}/${taskId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok || data.code !== 0) {
            console.error("KlingAI Status Error:", data);
            return new Response(JSON.stringify({ status: "failed", error: data.message || "Unknown error" }), {
                headers: corsHeaders
            });
        }

        // 2. Map response status
        const status = data.data.task_status;
        let resultImage = null;

        if (status === "succeed" || status === "succeeded") {
            const images = data.data.task_result?.images;
            if (images && images.length > 0) {
                resultImage = images[0].url;
            }
        }

        return new Response(JSON.stringify({
            status: status, // "succeed" | "processing" | "failed"
            output: resultImage,
            _original: data.data
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Try-on status error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: corsHeaders
        });
    }
};
