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

// OPTIMIZATION 2: Google Access Token Caching
let cachedAccessToken = null;
let tokenExpiryTime = 0;

// OPTIMIZATION 5: Rate Limiting (database-backed for distributed deployments)
// P1 FIX: Use database-backed rate limiting instead of in-memory for multi-instance support
const rateLimitStore = new Map(); // In-memory cache layer for performance

async function checkRateLimit(shop, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = new Date(now - windowMs);

    // Check in-memory cache first for performance
    const cached = rateLimitStore.get(shop);
    if (cached && now < cached.resetTime) {
        cached.count++;
        const allowed = cached.count <= maxRequests;
        return {
            allowed,
            remaining: Math.max(0, maxRequests - cached.count),
            resetTime: cached.resetTime
        };
    }

    // Fallback: Query database for rate limit state (distributed-safe)
    try {
        const recentEvents = await prisma.tryOnEvent.count({
            where: {
                shop,
                createdAt: { gte: windowStart }
            }
        });

        const resetTime = now + windowMs;
        const count = recentEvents + 1;

        // Update cache
        rateLimitStore.set(shop, { count, resetTime });

        return {
            allowed: count <= maxRequests,
            remaining: Math.max(0, maxRequests - count),
            resetTime
        };
    } catch (dbError) {
        console.error("[Rate Limit] Database query failed, using in-memory fallback:", dbError.message);
        // Fallback to in-memory if DB fails
        const record = rateLimitStore.get(shop) || { count: 0, resetTime: now + windowMs };
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + windowMs;
        }
        record.count++;
        rateLimitStore.set(shop, record);

        return {
            allowed: record.count <= maxRequests,
            remaining: Math.max(0, maxRequests - record.count),
            resetTime: record.resetTime
        };
    }
}

// Clean up old rate limit records every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [shop, record] of rateLimitStore.entries()) {
        if (now > record.resetTime + 60000) {
            rateLimitStore.delete(shop);
        }
    }
}, 300000);

// ... [Keep existing helper functions: getAccessToken, isUrl, urlToBase64, ensureBase64] ...


async function getAccessToken() {

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // OPTIMIZATION 2: Return cached token if still valid (with 5-minute buffer)
    const now = Math.floor(Date.now() / 1000);
    if (cachedAccessToken && tokenExpiryTime > now + 300) {

        return cachedAccessToken;
    }



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

    // OPTIMIZATION 2: Cache the token
    cachedAccessToken = tokenData.access_token;
    tokenExpiryTime = now + (tokenData.expires_in || 3600);


    return cachedAccessToken;
}

// OPTIMIZATION 3: Retry logic with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            lastError = error;

            // Don't retry on last attempt
            if (attempt < maxRetries - 1) {
                const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
                console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${backoffMs}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }

    throw lastError;
}


function isUrl(input) {
    if (!input || typeof input !== 'string') return false;
    return input.startsWith('http://') || input.startsWith('https://') || input.startsWith('//');
}

// Helper: Fetch URL and convert to Base64 (with retry)
async function urlToBase64(url) {
    try {
        const fullUrl = url.startsWith('//') ? `https:${url}` : url;


        // Use retry logic for external image fetching
        const response = await fetchWithRetry(fullUrl, {}, 3);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

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


async function uploadImageToShopify(admin, imageBase64, filename, waitForReady = true) {



    // 1. Staged Upload Create

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


    const target = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!target) {
        console.error("[Shopify Files] Staged upload failed:", JSON.stringify(stagedData));
        throw new Error("Failed to create staged upload target");
    }

    // 2. Upload to Staged URL

    const formData = new FormData();
    target.parameters.forEach(param => {
        formData.append(param.name, param.value);
    });

    // Creating a blob from the buffer for FormData
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, filename);


    const uploadResponse = await fetch(target.url, {
        method: "POST",
        body: formData
    });

    if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        console.error(`[Shopify Files] Upload to bucket failed: ${uploadResponse.status}`, text);
        throw new Error(`Failed to upload file to storage: ${uploadResponse.status}`);
    }


    // 3. Create File in Shopify

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


    const file = createData.data?.fileCreate?.files?.[0];

    if (!file) {
        console.error("[Shopify Files] File create failed:", JSON.stringify(createData));
        throw new Error("Failed to create file record in Shopify");
    }



    // OPTIMIZATION: If not waiting for ready, return early
    if (!waitForReady) {

        return null; // Don't block
    }

    // Shopify processes files asynchronously. Poll until URL is available.
    let publicUrl = file.image?.url;
    const fileId = file.id;

    if (!publicUrl && fileId) {


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



            if (polledFile?.image?.url) {
                publicUrl = polledFile.image.url;

                break;
            }

            if (polledFile?.fileStatus === 'FAILED') {
                throw new Error("File processing failed in Shopify");
            }
        }
    }




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


export const action = async ({ request }) => {
    // Global try-catch to prevent server crash
    try {
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
                headers: corsHeaders
            });
        }



        // P0 FIX: Authenticate the App Proxy request - no fallback allowed in production
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
                headers: corsHeaders
            });
        }

        if (!shop) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: corsHeaders
            });
        }



        // OPTIMIZATION 5: Rate Limiting - Check before processing
        const rateCheck = await checkRateLimit(shop, 100, 60000);
        if (!rateCheck.allowed) {
            console.warn(`[Rate Limit] Shop ${shop} exceeded limit (${rateCheck.remaining} remaining)`);
            return new Response(JSON.stringify({
                error: "Rate limit exceeded. Too many requests.",
                retryAfter: Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
            }), {
                status: 429,
                headers: {
                    ...corsHeaders,
                    'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)),
                    'X-RateLimit-Limit': '100',
                    'X-RateLimit-Remaining': String(rateCheck.remaining),
                    'X-RateLimit-Reset': String(Math.floor(rateCheck.resetTime / 1000))
                }
            });
        }

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
            // P1 FIX: Use API Key in header instead of URL query parameter to prevent exposure in logs

            authHeader = `Bearer ${GOOGLE_API_KEY}`;
        } else {
            // Use Service Account (OAuth)

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

        // Parse request body (JSON or FormData)
        let body = {};
        const contentType = request.headers.get("Content-Type") || "";

        try {
            if (contentType.includes("multipart/form-data")) {

                const formData = await request.formData();

                // Helper to get file as base64
                const getFileBase64 = async (field) => {
                    const entry = formData.get(field);
                    if (!entry) return null;
                    if (entry instanceof File) {
                        const buffer = await entry.arrayBuffer();
                        return Buffer.from(buffer).toString('base64');
                    }
                    return entry; // Assume string if not file
                };

                body = {
                    userImage: await getFileBase64("userImage"),
                    garmentImage: await getFileBase64("garmentImage"), // garment usually URL string
                    productId: formData.get("productId"),
                    productTitle: formData.get("productTitle"),
                    garmentType: formData.get("garmentType"),
                    sessionId: formData.get("sessionId"),
                    deviceType: formData.get("deviceType"),
                    fingerprintId: formData.get("fingerprintId")
                };
            } else {
                // Cloning request to ensure we can read it safely if needed
                const clone = request.clone();
                body = await clone.json();
            }
        } catch (e) {
            console.error("[API Debug] Failed to parse request body:", e);
            return new Response(JSON.stringify({ error: "Invalid request body" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const { userImage, garmentImage, garmentType, productId, productTitle, sessionId, deviceType, fingerprintId } = body;

        // CHECK BILLING LIMITS
        // Use atomic check if possible, but for now standard check is fine for limits
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



        // OPTIMIZATION 1: Parallel image processing - 2x faster
        const [personImageBase64, productImageBase64] = await Promise.all([
            ensureBase64(userImage),
            ensureBase64(garmentImage)
        ]);

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


        // Build product image object with optional type
        const productImageObject = {
            image: { bytesBase64Encoded: productImageBase64 }
        };

        // Add garment type if provided (tops, bottoms, or dresses)
        if (garmentType && ['tops', 'bottoms', 'dresses'].includes(garmentType)) {
            productImageObject.type = garmentType;

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







        // Make the actual API call
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }, 3); // 3 retries with exponential backoff


        // ============================================
        // END VERTEX AI CALL
        // ============================================



        // Parse the response
        const data = await response.json();

        // Add detailed logging for debugging


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

        // Extract result image with defensive checks
        const predictions = data.predictions;
        if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
            console.error("[API Debug] Invalid predictions array:", predictions);
            return new Response(JSON.stringify({
                error: "No predictions returned by AI",
                details: data
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const firstPrediction = predictions[0];
        if (!firstPrediction || typeof firstPrediction !== 'object') {
            console.error("[API Debug] Invalid first prediction:", firstPrediction);
            return new Response(JSON.stringify({
                error: "Invalid prediction format",
                details: data
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // Check for RAI (Responsible AI) filter
        if (firstPrediction.raiFilteredReason) {
            console.warn("[API Debug] Content filtered by RAI:", firstPrediction.raiFilteredReason);
            return new Response(JSON.stringify({
                error: "Content filtered by safety policy",
                message: "The image was filtered by Google's Responsible AI safety system. This may happen if the image contains inappropriate content, poor quality, or doesn't meet safety guidelines.",
                raiReason: firstPrediction.raiFilteredReason,
                suggestion: "Please try with a different image that shows a clear, full-body photo in appropriate clothing."
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const resultBase64 = firstPrediction.bytesBase64Encoded;
        if (!resultBase64 || typeof resultBase64 !== 'string') {
            console.error("[API Debug] Missing or invalid bytesBase64Encoded:", {
                hasField: 'bytesBase64Encoded' in firstPrediction,
                type: typeof resultBase64,
                availableFields: Object.keys(firstPrediction)
            });
            return new Response(JSON.stringify({
                error: "AI response missing image data",
                details: {
                    message: "bytesBase64Encoded field not found in prediction",
                    availableFields: Object.keys(firstPrediction)
                }
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const mimeType = firstPrediction.mimeType || "image/png";

        // ========================================
        // PERFORMANCE LOGGING - Detailed breakdown
        // ========================================



        // TRACK USAGE & PRODUCT STATS
        // Using upserts and atomic updates to prevent race conditions
        try {
            const now = new Date();
            // Truncate to current hour (precision to hour)
            const currentHour = new Date(now);
            currentHour.setMinutes(0, 0, 0);

            // 1. Record Detailed Event (Fine-grained tracking)
            // Extract IP address (privacy-safe hashing)
            const crypto = await import('crypto');
            const ipAddress = request.headers.get("CF-Connecting-IP") ||
                request.headers.get("X-Forwarded-For")?.split(',')[0]?.trim() ||
                request.headers.get("X-Real-IP");
            const ipHash = ipAddress
                ? crypto.createHash('sha256').update(ipAddress + 'v-mirror-salt').digest('hex').substring(0, 16)
                : null;

            // Extract referer for traffic source attribution
            const referer = request.headers.get("Referer") || null;

            await prisma.tryOnEvent.create({
                data: {
                    shop,
                    productId: String(productId || "unknown"),
                    productTitle: productTitle || "Unknown Product",
                    sessionId: sessionId || null,
                    fingerprintId: fingerprintId || null,
                    deviceType: deviceType || null,
                    userAgent: request.headers.get("User-Agent") || null,
                    ipHash: ipHash,
                    referer: referer,
                }
            });

            // 2. Increment Shop Usage (Hourly) - Using Upsert for Race Condition Safety
            await prisma.usageStat.upsert({
                where: {
                    shop_date: {
                        shop,
                        date: currentHour
                    }
                },
                update: { count: { increment: 1 } },
                create: {
                    shop,
                    date: currentHour,
                    count: 1
                }
            });

            // 3. Increment Billing Info (Total Usage for Cycle)
            await prisma.billingInfo.update({
                where: { shop },
                data: { currentUsage: { increment: 1 } }
            });

            // 4. Increment Product Stats (Attribution) - Using Upsert for Race Condition Safety
            if (productId && productTitle) {
                const pId = String(productId);

                await prisma.productStat.upsert({
                    where: { shop_productId: { shop, productId: pId } },
                    update: {
                        tryOnCount: { increment: 1 },
                        lastTryOn: new Date()
                    },
                    create: {
                        shop,
                        productId: pId,
                        productTitle,
                        productImage: garmentImage, // Store initial image as ref
                        tryOnCount: 1,
                        lastTryOn: new Date()
                    }
                });


            }

        } catch (dbError) {
            console.error("[PERF] ❌ Failed to track usage stats:", dbError);
            // Don't block response if stats fail
        }





        // BEST PERFORMANCE: Upload to CDN and return URL (not base64)
        // Frontend only needs to parse ~100 character URL instead of 3.5MB base64


        try {
            // Get admin context

            const { admin } = await unauthenticated.admin(shop);

            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            const filename = `try-on-${timestamp}-${random}.png`;



            // Upload and wait for URL (with polling)
            const cdnUrl = await uploadImageToShopify(admin, resultBase64, filename, true);



            if (!cdnUrl) {
                throw new Error("Failed to get CDN URL after upload");
            }



            // Return CDN URL in JSON response
            const responseData = {
                output: cdnUrl,
                outputType: 'url',
                status: 'succeed',
                mimeType: mimeType || "image/png",
                sizeBytes: Math.floor(resultBase64.length * 0.75)
            };



            return new Response(JSON.stringify(responseData), {
                headers: {
                    "Content-Type": "application/json",
                    "X-Try-On-Status": "succeed",
                    "X-Shop-Id": shop,
                    "X-Response-Time": new Date().toISOString(),
                    "X-CDN-URL": cdnUrl,
                    // CORS headers
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Expose-Headers": "X-Try-On-Status, X-Shop-Id, X-Response-Time, X-CDN-URL"
                }
            });

        } catch (uploadError) {
            console.error("[Shopify CDN] ❌ Upload failed:", uploadError);


            // Fallback to data URL if CDN upload fails
            const dataUrl = `data:${mimeType || "image/png"};base64,${resultBase64}`;

            const responseData = {
                output: dataUrl,
                outputType: 'dataUrl',
                status: 'succeed',
                mimeType: mimeType || "image/png",
                sizeBytes: Math.floor(resultBase64.length * 0.75),
                warning: "CDN upload failed, using data URL fallback"
            };

            return new Response(JSON.stringify(responseData), {
                headers: {
                    "Content-Type": "application/json",
                    "X-Try-On-Status": "succeed",
                    "X-Shop-Id": shop,
                    "Access-Control-Allow-Origin": "*"
                }
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
