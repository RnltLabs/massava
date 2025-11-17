"use strict";
/**
 * Redis Session Cache
 *
 * PERFORMANCE TARGETS:
 * - Cache hit: <5ms (P95)
 * - Cache miss: <80ms (fallback to DB)
 * - Hit rate: >90%
 * - Invalidation: <10ms
 *
 * ARCHITECTURE:
 * - Provider: Upstash Redis (serverless, low latency)
 * - TTL: 15 minutes (matches JWT expiry)
 * - Eviction: LRU (least recently used)
 * - Warm-up: Eager loading on sign-in
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMonitor = void 0;
exports.getSessionFromCache = getSessionFromCache;
exports.setSessionInCache = setSessionInCache;
exports.invalidateSessionCache = invalidateSessionCache;
exports.invalidateMultipleSessions = invalidateMultipleSessions;
const redis_1 = require("@upstash/redis");
const logger_1 = require("@/lib/logger");
// Redis client (singleton)
const redis = new redis_1.Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
});
/**
 * Cache key generator
 *
 * PATTERN: session:{userId}
 * EXAMPLE: session:550e8400-e29b-41d4-a716-446655440000
 */
function getCacheKey(userId) {
    return `session:${userId}`;
}
/**
 * Get session from cache
 *
 * PERFORMANCE:
 * - Cache hit: ~5ms (Upstash global edge network)
 * - Cache miss: null (caller must fallback to DB)
 *
 * MONITORING:
 * - Track hit rate (target: >90%)
 * - Alert if hit rate <80%
 */
async function getSessionFromCache(userId) {
    const startTime = performance.now();
    try {
        const key = getCacheKey(userId);
        const cached = await redis.get(key);
        const duration = performance.now() - startTime;
        // Track performance
        if (duration > 10) {
            logger_1.logger.warn('Redis cache read slow', {
                userId,
                duration,
                action: 'CACHE_READ'
            });
        }
        // Update lastAccessedAt on cache hit (track activity)
        if (cached) {
            cached.lastAccessedAt = new Date().toISOString();
            // Fire-and-forget update (don't await)
            redis.set(key, cached, { ex: 900 }); // 15 minutes TTL
        }
        return cached;
    }
    catch (error) {
        logger_1.logger.error('Redis cache read failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
            action: 'CACHE_READ'
        });
        return null; // Fallback to DB
    }
}
/**
 * Set session in cache
 *
 * PERFORMANCE: ~5ms (async write)
 * TTL: 900 seconds (15 minutes, matches JWT expiry)
 *
 * STRATEGY:
 * - Called on sign-in (warm cache immediately)
 * - Called on session refresh (update cached data)
 * - Fire-and-forget (don't block auth flow)
 */
async function setSessionInCache(userId, session) {
    const startTime = performance.now();
    try {
        const key = getCacheKey(userId);
        await redis.set(key, session, { ex: 900 }); // 15 minutes TTL
        const duration = performance.now() - startTime;
        if (duration > 10) {
            logger_1.logger.warn('Redis cache write slow', {
                userId,
                duration,
                action: 'CACHE_WRITE'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Redis cache write failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
            action: 'CACHE_WRITE'
        });
        // Don't throw - cache failure shouldn't break auth
    }
}
/**
 * Invalidate session in cache
 *
 * PERFORMANCE: ~5ms (delete operation)
 *
 * USE CASES:
 * - User signs out
 * - User role changed (admin action)
 * - User data updated (profile edit)
 * - Security event (force re-auth)
 */
async function invalidateSessionCache(userId) {
    const startTime = performance.now();
    try {
        const key = getCacheKey(userId);
        await redis.del(key);
        const duration = performance.now() - startTime;
        if (duration > 10) {
            logger_1.logger.warn('Redis cache invalidation slow', {
                userId,
                duration,
                action: 'CACHE_INVALIDATE'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Redis cache invalidation failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
            action: 'CACHE_INVALIDATE'
        });
        // Don't throw - cache failure shouldn't break app
    }
}
/**
 * Batch invalidate sessions (e.g., role change affects multiple users)
 *
 * PERFORMANCE: ~5ms per user (parallel deletes)
 */
async function invalidateMultipleSessions(userIds) {
    const startTime = performance.now();
    try {
        const keys = userIds.map(getCacheKey);
        await Promise.all(keys.map((key) => redis.del(key)));
        const duration = performance.now() - startTime;
        logger_1.logger.info('Batch session invalidation completed', {
            sessionCount: userIds.length,
            duration,
            action: 'BATCH_INVALIDATE'
        });
    }
    catch (error) {
        logger_1.logger.error('Batch invalidation failed', {
            sessionCount: userIds.length,
            error: error instanceof Error ? error.message : String(error),
            action: 'BATCH_INVALIDATE'
        });
    }
}
class CacheMonitor {
    constructor() {
        this.hits = 0;
        this.misses = 0;
        this.latencies = [];
    }
    recordHit(latencyMs) {
        this.hits++;
        this.latencies.push(latencyMs);
    }
    recordMiss() {
        this.misses++;
    }
    async getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
        const avgLatency = this.latencies.length > 0
            ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
            : 0;
        // Get Redis memory usage
        // Note: Upstash Redis doesn't support INFO command
        // We'll return 0 for now - can be implemented with a separate monitoring solution
        const memoryUsedMB = 0;
        return {
            hitRate,
            avgLatency,
            totalRequests: total,
            cacheHits: this.hits,
            cacheMisses: this.misses,
            memoryUsedMB,
        };
    }
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.latencies = [];
    }
}
exports.cacheMonitor = new CacheMonitor();
/**
 * PERFORMANCE TESTING
 *
 * ```typescript
 * // Benchmark cache performance
 * import { getSessionFromCache, setSessionInCache } from './session-cache'
 *
 * async function benchmarkCache() {
 *   const userId = 'test-user-id'
 *   const session: CachedSession = {
 *     userId,
 *     email: 'test@example.com',
 *     name: 'Test User',
 *     role: 'USER',
 *     image: null,
 *     createdAt: new Date().toISOString(),
 *     lastAccessedAt: new Date().toISOString(),
 *   }
 *
 *   // Warm cache
 *   await setSessionInCache(userId, session)
 *
 *   // Measure cache hit latency
 *   const iterations = 1000
 *   const times: number[] = []
 *
 *   for (let i = 0; i < iterations; i++) {
 *     const start = performance.now()
 *     await getSessionFromCache(userId)
 *     const end = performance.now()
 *     times.push(end - start)
 *   }
 *
 *   times.sort((a, b) => a - b)
 *
 *   console.log('Cache Performance:')
 *   console.log(`  P50: ${times[Math.floor(iterations * 0.5)].toFixed(2)}ms`)
 *   console.log(`  P95: ${times[Math.floor(iterations * 0.95)].toFixed(2)}ms`)
 *   console.log(`  P99: ${times[Math.floor(iterations * 0.99)].toFixed(2)}ms`)
 * }
 * ```
 */
