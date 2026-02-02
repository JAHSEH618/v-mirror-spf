/**
 * D2-3 FIX: Unified Error Response Format
 * 
 * All API errors should follow this consistent format for easier
 * frontend handling and debugging.
 */

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
    // Client errors (4xx)
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_FIELDS: 'MISSING_FIELDS',
    IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
    LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
    CONTENT_FILTERED: 'CONTENT_FILTERED',
    UNAUTHORIZED: 'UNAUTHORIZED',

    // Server errors (5xx)
    AUTH_FAILED: 'AUTH_FAILED',
    AI_ERROR: 'AI_ERROR',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Create a standardized error response
 * 
 * @param {string} code - Error code from ErrorCodes
 * @param {string} message - User-friendly error message
 * @param {object} details - Optional additional details
 * @param {number} status - HTTP status code (default: 400)
 * @param {object} headers - Response headers
 * @returns {Response}
 */
export function createErrorResponse(code, message, details = {}, status = 400, headers = {}) {
    const body = {
        success: false,
        error: {
            code,
            message,
            ...details
        },
        timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

/**
 * Create a standardized success response
 * 
 * @param {object} data - Response data
 * @param {number} status - HTTP status code (default: 200)
 * @param {object} headers - Response headers
 * @returns {Response}
 */
export function createSuccessResponse(data, status = 200, headers = {}) {
    const body = {
        success: true,
        data,
        timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

/**
 * D1-4 FIX: Webhook response helper
 * 
 * Returns appropriate status codes for different webhook scenarios:
 * - 200: Success, processed
 * - 410: Permanent failure, don't retry
 * - 500+: Temporary failure, Shopify will retry
 */
export function webhookResponse(status = 'success', message = '') {
    switch (status) {
        case 'success':
            return new Response(message || 'Webhook processed', { status: 200 });

        case 'duplicate':
            return new Response('Already processed', { status: 200 });

        case 'permanent_failure':
            // D1-4 FIX: Use 410 Gone to tell Shopify not to retry
            return new Response(message || 'Permanent failure', { status: 410 });

        case 'temporary_failure':
            // Shopify will retry
            return new Response(message || 'Temporary failure', { status: 500 });

        default:
            return new Response('OK', { status: 200 });
    }
}
