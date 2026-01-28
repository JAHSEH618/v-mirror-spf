/* eslint-disable no-undef */
import prisma from "../db.server";
import { authenticate, unauthenticated } from "../shopify.server";

/**
 * Google Vertex AI Virtual Try-On API
 *
 * Uses the virtual-try-on-preview-08-04 model from Google Vertex AI
 * Documentation: https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-virtual-try-on-images
 */

// Environment variables for Google Cloud
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

// ... [Keep existing helper functions: getAccessToken, isUrl, urlToBase64, ensureBase64] ...

// Helper: Get access token from Service Account (fallback if no API key)
async function getAccessToken() {
    console.log("[API Debug] Attempting to get access token from Service Account...");
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
    }

    // Dynamic imports to avoid loading these if not needed
    const fs = await import('fs');
    const crypto = await import('crypto');

    let credentials;
    try {
        const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsContent);
    } catch (error) {
        throw new Error(`Failed to read service account credentials: ${error.message}`);
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now
    };

    const base64url = (obj) => {
        return Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    };

    const headerEncoded = base64url(header);
    const payloadEncoded = base64url(payload);
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(credentials.private_key, 'base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const jwt = `${signatureInput}.${signature}`;

    console.log("[API Debug] Exchanging JWT for access token...");
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("[API Debug] Access token obtained successfully");
    return tokenData.access_token;
}

// Helper: Check if input is a URL
function isUrl(input) {
    if (!input || typeof input !== 'string') return false;
    return input.startsWith('http://') || input.startsWith('https://') || input.startsWith('//');
}

// Helper: Fetch URL and convert to Base64
async function urlToBase64(url) {
    try {
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

// Helper: Ensure input is raw Base64
async function ensureBase64(input) {
    if (!input) return "";

    if (isUrl(input)) {
        return await urlToBase64(input);
    }

    if (typeof input === 'string' && input.startsWith('data:')) {
        const parts = input.split(',');
        return parts.length > 1 ? parts[1] : input;
    }

    return input; // Assume raw base64
}

// Helper: Upload image to Shopify Files API
async function uploadImageToShopify(admin, imageBase64, filename) {
    console.log(`[Shopify Files] Starting upload for ${filename}...`);
    const startTime = Date.now();

    // 1. Staged Upload Create
    console.time("Shopify:StagedUpload");
    const stagedUploadsQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }`;

    // Determine mime type (simple check)
    const mimeType = "image/png"; // We'll assume PNG for generated images

    // Convert base64 to buffer for upload
    const buffer = Buffer.from(imageBase64, 'base64');
    const fileSize = buffer.length.toString();

    const stagedResult = await admin.graphql(stagedUploadsQuery, {
        variables: {
            input: [{
                resource: "IMAGE",
                filename: filename,
                mimeType: mimeType,
                httpMethod: "POST",
                fileSize: fileSize
            }]
        }
    });

    const stagedData = await stagedResult.json();
    console.timeEnd("Shopify:StagedUpload");

    const target = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!target) {
        console.error("[Shopify Files] Staged upload failed:", JSON.stringify(stagedData));
        throw new Error("Failed to create staged upload target");
    }

    // 2. Upload to Staged URL
    console.time("Shopify:UploadToGCS");
    const formData = new FormData();
    target.parameters.forEach(param => {
        formData.append(param.name, param.value);
    });

    // Creating a blob from the buffer for FormData
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, filename);

    console.log(`[Shopify Files] Uploading to ${target.url}...`);
    const uploadResponse = await fetch(target.url, {
        method: "POST",
        body: formData
    });

    if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        console.error(`[Shopify Files] Upload to bucket failed: ${uploadResponse.status}`, text);
        throw new Error(`Failed to upload file to storage: ${uploadResponse.status}`);
    }
    console.timeEnd("Shopify:UploadToGCS");

    // 3. Create File in Shopify
    console.time("Shopify:FileCreate");
    const fileCreateQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          fileStatus
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }`;

    console.log(`[Shopify Files] Creating file record for ${target.resourceUrl}...`);
    const createResult = await admin.graphql(fileCreateQuery, {
        variables: {
            files: [{
                originalSource: target.resourceUrl,
                contentType: "IMAGE",
                filename: filename
            }]
        }
    });

    const createData = await createResult.json();
    console.timeEnd("Shopify:FileCreate");

    const file = createData.data?.fileCreate?.files?.[0];

    if (!file) {
        console.error("[Shopify Files] File create failed:", JSON.stringify(createData));
        throw new Error("Failed to create file record in Shopify");
    }

    console.log(`[Shopify Files] File created with ID: ${file.id}, Status: ${file.fileStatus}`);

    // Shopify processes files asynchronously. Poll until URL is available.
    let publicUrl = file.image?.url;
    const fileId = file.id;

    if (!publicUrl && fileId) {
        console.log("[Shopify Files] URL not immediately available, polling...");

        const fileQueryGql = `
        query getFile($id: ID!) {
          node(id: $id) {
            ... on MediaImage {
              id
              fileStatus
              image {
                url
              }
            }
          }
        }`;

        // Poll up to 10 times with 1 second intervals
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const pollResult = await admin.graphql(fileQueryGql, {
                variables: { id: fileId }
            });
            const pollData = await pollResult.json();
            const polledFile = pollData.data?.node;

            console.log(`[Shopify Files] Poll ${i + 1}: Status=${polledFile?.fileStatus}`);

            if (polledFile?.image?.url) {
                publicUrl = polledFile.image.url;
                console.log(`[Shopify Files] URL obtained after ${i + 1} polls: ${publicUrl}`);
                break;
            }

            if (polledFile?.fileStatus === 'FAILED') {
                throw new Error("File processing failed in Shopify");
            }
        }
    }

    console.log(`[Shopify Files] Final URL: ${publicUrl}`);
    console.log(`[Shopify Files] Total upload time: ${(Date.now() - startTime) / 1000}s`);

    return publicUrl;
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

// Handle POST requests - Virtual Try-On with Google Vertex AI
export const action = async ({ request }) => {
    // Global try-catch to prevent server crash
    try {
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
                headers: corsHeaders
            });
        }

        console.log(`[API Debug] Action processing started...`);

        // Authenticate the App Proxy request
        let shop;
        try {
            const { session } = await authenticate.public.appProxy(request);
            if (session) {
                shop = session.shop;
                console.log(`[API Debug] App Proxy authenticated for shop: ${shop}`);
            }
        } catch (authError) {
            console.warn("[API Debug] App Proxy authentication failed or locally testing without signature. Fallback to query param.");
            // Fallback for local testing if needed
            const url = new URL(request.url);
            shop = url.searchParams.get("shop");
        }

        console.log(`[API Debug] Project: ${GOOGLE_CLOUD_PROJECT}, Shop: ${shop}`);

        if (!GOOGLE_CLOUD_PROJECT || GOOGLE_CLOUD_PROJECT === 'your-gcp-project-id') {
            console.error("[API Debug] Invalid GOOGLE_CLOUD_PROJECT");
            return new Response(JSON.stringify({
                error: "Server configuration error: GOOGLE_CLOUD_PROJECT not configured."
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // Determine authentication method
        let authHeader;
        let apiUrl = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/virtual-try-on-preview-08-04:predict`;

        if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'your-api-key-here') {
            // Use API Key (simpler)
            console.log("[API Debug] Using API Key authentication");
            authHeader = null; // API key is passed as query parameter
            apiUrl += `?key=${GOOGLE_API_KEY}`;
        } else {
            // Use Service Account (OAuth)
            console.log("[API Debug] Using Service Account authentication");
            try {
                const accessToken = await getAccessToken();
                authHeader = `Bearer ${accessToken}`;
            } catch (authError) {
                console.error("[API Debug] Auth Error:", authError);
                return new Response(JSON.stringify({
                    error: "Authentication failed. Please check server logs."
                }), {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // Parse request body safely
        let body;
        try {
            // Cloning request to ensure we can read it safely if needed
            const clone = request.clone();
            body = await clone.json();
        } catch (e) {
            console.error("[API Debug] Failed to parse request body:", e);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const { userImage, garmentImage, garmentType, productId, productTitle } = body;

        // CHECK BILLING LIMITS
        const billingInfo = await prisma.billingInfo.findUnique({ where: { shop } });
        if (billingInfo) {
            if (billingInfo.currentUsage >= billingInfo.usageLimit) {
                return new Response(JSON.stringify({
                    error: "Usage limit exceeded. Please upgrade your plan.",
                    code: "LIMIT_EXCEEDED"
                }), {
                    status: 402, // Payment Required
                    headers: corsHeaders
                });
            }
        }

        if (!userImage || !garmentImage) {
            return new Response(JSON.stringify({
                error: "Missing required fields: userImage or garmentImage"
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        console.log("[API Debug] Garment type:", garmentType || "auto-detect");

        console.log("[API Debug] Converting images...");

        // Convert images to Base64
        const personImageBase64 = await ensureBase64(userImage);
        const productImageBase64 = await ensureBase64(garmentImage);

        if (!personImageBase64 || !productImageBase64) {
            console.error("[API Debug] Image conversion failed - empty result");
            return new Response(JSON.stringify({
                error: "Failed to process input images"
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const totalSize = personImageBase64.length + productImageBase64.length;
        console.log(`[API Debug] Payload size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

        // Build product image object with optional type
        const productImageObject = {
            image: { bytesBase64Encoded: productImageBase64 }
        };

        // Add garment type if provided (tops, bottoms, or dresses)
        if (garmentType && ['tops', 'bottoms', 'dresses'].includes(garmentType)) {
            productImageObject.type = garmentType;
            console.log(`[API Debug] Including garment type in payload: ${garmentType}`);
        }

        // Build Vertex AI request payload
        const payload = {
            instances: [{
                personImage: {
                    image: { bytesBase64Encoded: personImageBase64 }
                },
                productImages: [productImageObject]
            }],
            parameters: {
                sampleCount: 1
            }
        };

        console.log(`[API Debug] Calling Vertex AI: ${apiUrl.split('?')[0]}`);

        // Build headers
        const headers = {
            "Content-Type": "application/json",
        };
        if (authHeader) {
            headers["Authorization"] = authHeader;
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        console.log(`[API Debug] Vertex AI Status: ${response.status}`);

        const data = await response.json();

        if (!response.ok) {
            console.error("[API Debug] Vertex AI API Error:", JSON.stringify(data, null, 2));
            return new Response(JSON.stringify({
                error: data.error?.message || "Google Vertex AI API Error",
                details: data.error
            }), {
                status: response.status || 500,
                headers: corsHeaders
            });
        }

        // Extract result image
        const predictions = data.predictions;
        if (!predictions || predictions.length === 0) {
            return new Response(JSON.stringify({
                error: "No image generated by AI",
                details: data
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const resultBase64 = predictions[0].bytesBase64Encoded;
        const mimeType = predictions[0].mimeType || "image/png";

        console.log(`[API Debug] Success! Generated image size: ${resultBase64.length} bytes`);

        // TRACK USAGE & PRODUCT STATS
        try {
            const now = new Date();
            // Truncate to current hour (precision to hour)
            const currentHour = new Date(now);
            currentHour.setMinutes(0, 0, 0);

            // 1. Increment Shop Usage (Hourly)
            const usageStat = await prisma.usageStat.findUnique({
                where: {
                    shop_date: {
                        shop,
                        date: currentHour
                    }
                }
            });

            if (usageStat) {
                await prisma.usageStat.update({
                    where: { id: usageStat.id },
                    data: { count: { increment: 1 } }
                });
            } else {
                await prisma.usageStat.create({
                    data: {
                        shop,
                        date: currentHour,
                        count: 1
                    }
                });
            }

            // 2. Increment Billing Info (Total Usage for Cycle)
            await prisma.billingInfo.update({
                where: { shop },
                data: { currentUsage: { increment: 1 } }
            });

            // 3. Increment Product Stats (Attribution)
            if (productId && productTitle) {
                const pId = String(productId);
                const existingProduct = await prisma.productStat.findUnique({
                    where: { shop_productId: { shop, productId: pId } }
                });

                if (existingProduct) {
                    await prisma.productStat.update({
                        where: { id: existingProduct.id },
                        data: {
                            tryOnCount: { increment: 1 },
                            lastTryOn: new Date()
                        }
                    });
                } else {
                    await prisma.productStat.create({
                        data: {
                            shop,
                            productId: pId,
                            productTitle,
                            productImage: garmentImage, // Store initial image as ref
                            tryOnCount: 1
                        }
                    });
                }
                console.log(`[API Debug] Tracked stats for product: ${productTitle} (${pId})`);
            }

        } catch (dbError) {
            console.error("[API Debug] Failed to track usage stats:", dbError);
            // Don't block response if stats fail
        }

        // SAVE TO SHOPIFY FILES INSTEAD OF LOCAL DISK
        try {
            if (!shop) {
                throw new Error("Missing shop parameter, cannot upload to Shopify Files");
            }

            // Get admin context via unauthenticated helper for offline access
            console.log(`[Shopify Files] Getting admin context for shop: ${shop}`);
            const { admin } = await unauthenticated.admin(shop);

            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            const filename = `try-on-${timestamp}-${random}.png`;

            // Upload via Helper
            const publicUrl = await uploadImageToShopify(admin, resultBase64, filename);

            if (publicUrl) {
                return new Response(JSON.stringify({
                    success: true,
                    status: "succeed",
                    outputType: "url",
                    output: publicUrl
                }), {
                    headers: corsHeaders
                });
            } else {
                throw new Error("Uploaded file but got no URL");
            }

        } catch (uploadError) {
            console.error("[API Debug] Failed to upload to Shopify Files:", uploadError);
            // Fallback to base64 if upload fails
            return new Response(JSON.stringify({
                success: true,
                status: "succeed",
                output: `data:${mimeType};base64,${resultBase64}`
            }), {
                headers: corsHeaders
            });
        }

    } catch (error) {
        console.error("[API Debug] CRITICAL UNHANDLED ERROR:", error);

        // Write error to file for agent debugging
        try {
            const fs = await import('fs');
            const logMessage = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.appendFileSync('server-error.log', logMessage);
        } catch (logErr) {
            console.error("Failed to write to error log:", logErr);
        }

        return new Response(JSON.stringify({
            error: "Internal Server Error: " + (error.message || "Unknown error")
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
};
