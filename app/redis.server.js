import Redis from 'ioredis';

// P0: Redis client for distributed caching
// Replaces in-memory Map for token caching and rate limiting

let redis = null;
let lastHealthCheck = 0;
let isHealthy = false;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Get Redis client singleton
 * D2-1 FIX: Added health check mechanism
 * @returns {Redis} Redis client instance
 */
export function getRedis() {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            lazyConnect: true,
            connectTimeout: 10000,
            // D2-1 FIX: Enable keep-alive to detect dead connections
            keepAlive: 10000,
            // Auto-reconnect strategy
            retryStrategy(times) {
                if (times > 5) {
                    console.error('[Redis] Max retry attempts reached, stopping reconnection');
                    isHealthy = false;
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 200, 3000);
                console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
                return delay;
            }
        });

        redis.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
            isHealthy = false;
        });

        redis.on('connect', () => {
            console.log('[Redis] Connected successfully');
        });

        redis.on('ready', () => {
            console.log('[Redis] Ready to accept commands');
            isHealthy = true;
            lastHealthCheck = Date.now();
        });

        redis.on('close', () => {
            console.log('[Redis] Connection closed');
            isHealthy = false;
        });

        redis.on('reconnecting', () => {
            console.log('[Redis] Attempting to reconnect...');
            isHealthy = false;
        });
    }
    return redis;
}

/**
 * D2-1 FIX: Get healthy Redis client with connection validation
 * Checks connection status before returning, reconnects if needed
 * @returns {Promise<Redis>} Healthy Redis client
 */
export async function getHealthyRedis() {
    const client = getRedis();
    const now = Date.now();

    // Skip health check if recently verified healthy
    if (isHealthy && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
        return client;
    }

    // Perform health check
    try {
        const status = client.status;

        // If not in ready state, try to reconnect
        if (status !== 'ready' && status !== 'connecting') {
            console.log(`[Redis] Status: ${status}, attempting reconnection...`);
            await client.connect();
        }

        // Verify with ping
        await client.ping();
        isHealthy = true;
        lastHealthCheck = now;
        return client;
    } catch (e) {
        console.error('[Redis] Health check failed:', e.message);
        isHealthy = false;

        // Try to create new connection
        try {
            redis.disconnect();
            redis = null;
            const newClient = getRedis();
            await newClient.ping();
            isHealthy = true;
            lastHealthCheck = Date.now();
            return newClient;
        } catch (reconnectError) {
            console.error('[Redis] Reconnection failed:', reconnectError.message);
            throw new Error('Redis unavailable');
        }
    }
}

/**
 * Check if Redis is connected and healthy (non-blocking)
 * @returns {Promise<boolean>}
 */
export async function isRedisHealthy() {
    try {
        const client = getRedis();
        await client.ping();
        isHealthy = true;
        lastHealthCheck = Date.now();
        return true;
    } catch (e) {
        isHealthy = false;
        return false;
    }
}

/**
 * Get current health status without network call
 * @returns {boolean}
 */
export function getRedisHealthStatus() {
    return isHealthy;
}

/**
 * Graceful shutdown
 */
export async function closeRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
        isHealthy = false;
        console.log('[Redis] Connection closed gracefully');
    }
}

// Key prefixes for organization
export const REDIS_KEYS = {
    TOKEN: 'vmirror:google_access_token',
    RATE_LIMIT: (shop) => `vmirror:ratelimit:${shop}`,
    WEBHOOK: (webhookId) => `vmirror:webhook:${webhookId}`
};
