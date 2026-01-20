import jwt from "jsonwebtoken";

// 1. Get Keys from environment variables
const KLINGAI_ACCESS_KEY = process.env.KLINGAI_ACCESS_KEY;
const KLINGAI_SECRET_KEY = process.env.KLINGAI_SECRET_KEY;
const KLINGAI_BASE_URL = "https://api-beijing.klingai.com/v1/images/kolors-virtual-try-on";

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

// Helper: Generate JWT Token using library
function generateJwtToken(ak, sk) {
    if (!ak || !sk) return null;

    const payload = {
        iss: ak,
        exp: Math.floor(Date.now() / 1000) + 1800, // +30 mins
        nbf: Math.floor(Date.now() / 1000) - 5     // -5 seconds
    };

    return jwt.sign(payload, sk, {
        algorithm: "HS256",
        header: {
            typ: "JWT"
        }
    });
}

// Helper: Strip Base64 Data URL prefix if present
function cleanBase64(input) {
    if (!input) return input;
    if (input.startsWith('data:')) {
        const parts = input.split(',');
        return parts.length > 1 ? parts[1] : input;
    }
    return input;
}

// Helper: Check if input is a URL
function isUrl(input) {
    if (!input) return false;
    return input.startsWith('http://') || input.startsWith('https://') || input.startsWith('//');
}

// Helper: Fetch URL and convert to Base64
async function urlToBase64(url) {
    try {
        // Handle protocol-relative URLs (starting with //)
        const fullUrl = url.startsWith('//') ? `https:${url}` : url;
        console.log(`[API Debug] Fetching image from URL: ${fullUrl.substring(0, 80)}...`);

        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        console.log(`[API Debug] Converted URL to Base64, length: ${base64.length}`);
        return base64;
    } catch (error) {
        console.error(`[API Debug] URL to Base64 conversion failed:`, error.message);
        throw error;
    }
}

// Helper: Ensure input is raw Base64 (convert from URL or strip Data URL prefix)
async function ensureBase64(input) {
    if (!input) return input;

    // If it's a URL, fetch and convert
    if (isUrl(input)) {
        return await urlToBase64(input);
    }

    // If it's a Data URL, strip the prefix
    if (input.startsWith('data:')) {
        const parts = input.split(',');
        return parts.length > 1 ? parts[1] : input;
    }

    // Already raw Base64
    return input;
}

// Handle OPTIONS (Preflight) and GET requests
export const loader = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: corsHeaders
    });
};

// Handle POST requests
export const action = async ({ request }) => {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: corsHeaders
        });
    }

    console.log(`[API Debug] Checking Credentials...`);
    console.log(`[API Debug] Access Key present: ${!!KLINGAI_ACCESS_KEY}, Secret Key present: ${!!KLINGAI_SECRET_KEY}`);

    if (!KLINGAI_ACCESS_KEY || !KLINGAI_SECRET_KEY) {
        console.error("[API Debug] Missing KlingAI Access Key or Secret Key");
        return new Response(JSON.stringify({
            error: "Server configuration error: Missing Credentials."
        }), {
            status: 500,
            headers: corsHeaders
        });
    }

    try {
        const token = generateJwtToken(KLINGAI_ACCESS_KEY, KLINGAI_SECRET_KEY);
        console.log(`[API Debug] JWT Token generated, length: ${token?.length}`);

        const body = await request.json();
        const { userImage, garmentImage, modelName } = body;

        console.log("Try-on request received");

        if (!userImage || !garmentImage) {
            return new Response(JSON.stringify({ error: "Missing required fields: userImage or garmentImage" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Debug: Log original image types
        const userImgType = userImage.startsWith('data:') ? 'DataURL' : (isUrl(userImage) ? 'URL' : 'Raw');
        const garmentImgType = garmentImage.startsWith('data:') ? 'DataURL' : (isUrl(garmentImage) ? 'URL' : 'Raw');
        console.log(`[API Debug] UserImage type: ${userImgType}, length: ${userImage.length}`);
        console.log(`[API Debug] GarmentImage type: ${garmentImgType}, length: ${garmentImage.length}`);

        // Convert both images to raw Base64
        const cleanedUserImage = await ensureBase64(userImage);
        const cleanedGarmentImage = await ensureBase64(garmentImage);

        console.log(`[API Debug] Cleaned UserImage length: ${cleanedUserImage.length}`);
        console.log(`[API Debug] Cleaned GarmentImage length: ${cleanedGarmentImage.length}`);

        const payload = {
            model_name: modelName || "kolors-virtual-try-on-v1",
            human_image: cleanedUserImage,
            cloth_image: cleanedGarmentImage,
        };

        const response = await fetch(KLINGAI_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data.code !== 0) {
            console.error("KlingAI API Error:", JSON.stringify(data, null, 2));
            return new Response(JSON.stringify({ error: data.message || "Failed to start try-on task", details: data }), {
                status: response.status || 500,
                headers: corsHeaders
            });
        }

        console.log("[API Debug] Success! TaskId:", data.data.task_id);
        return new Response(JSON.stringify({
            success: true,
            taskId: data.data.task_id
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Try-on start error:", error);
        return new Response(JSON.stringify({ error: "Internal server error: " + error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
};
