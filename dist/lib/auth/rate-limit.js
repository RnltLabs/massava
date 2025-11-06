"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Phase 3: Redis-Backed Rate Limiting
 * Distributed, persistent rate limiting for production security
 *
 * SECURITY IMPROVEMENTS:
 * - Rate limits persist across server restarts
 * - Rate limits shared across all instances (distributed)
 * - Atomic operations prevent race conditions
 * - Fail-secure: denies access on Redis errors
 *
 * FIXES:
 * - CR-013: In-memory rate limiting not distributed
 * - SEC-003: Rate limit bypass on multi-instance deployments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_CONFIGS = void 0;
exports.checkRateLimit = checkRateLimit;
exports.rateLimitByIP = rateLimitByIP;
exports.rateLimitByUser = rateLimitByUser;
exports.resetRateLimit = resetRateLimit;
exports.getRateLimitStatus = getRateLimitStatus;
const redis_1 = require("@upstash/redis");
const logger_1 = require("@/lib/logger");
// Redis client singleton
let redisClient = null;
function getRedisClient() {
    if (redisClient)
        return redisClient;
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;
    if (!url || !token) {
        throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set for rate limiting');
    }
    redisClient = new redis_1.Redis({
        url,
        token,
    });
    return redisClient;
}
/**
 * Get client identifier (IP address)
 * Uses x-forwarded-for header if available (behind proxy)
 */
function getClientIdentifier(request) {
    // Try to get real IP from headers (Vercel, Cloudflare, etc.)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    // Fallback to real-ip header
    const ip = request.headers.get('x-real-ip');
    return ip || 'unknown';
}
/**
 * Check if request should be allowed based on rate limit
 *
 * Uses Redis INCR + TTL for atomic, distributed rate limiting.
 * Each identifier gets independent bucket with windowed resets.
 *
 * PERFORMANCE: ~5ms (Redis latency)
 * SECURITY: Atomic operations, no race conditions
 * DISTRIBUTED: Works across all instances
 * PERSISTENT: Survives server restarts
 */
async function checkRateLimit(identifier, config) {
    const startTime = performance.now();
    try {
        const redis = getRedisClient();
        const key = `ratelimit:${identifier}`;
        const ttl = config.windowSeconds;
        // Atomic increment (handles concurrent requests safely)
        const current = await redis.incr(key);
        // First request in window - set expiry
        if (current === 1) {
            await redis.expire(key, ttl);
        }
        // Get remaining time until reset
        const ttlRemaining = await redis.ttl(key);
        const resetAt = Date.now() + (ttlRemaining > 0 ? ttlRemaining * 1000 : ttl * 1000);
        const allowed = current <= config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - current);
        const duration = performance.now() - startTime;
        if (duration > 10) {
            logger_1.logger.warn('Rate limit check slow', {
                identifier,
                duration,
                action: 'RATE_LIMIT_CHECK'
            });
        }
        if (!allowed) {
            logger_1.logger.warn('Rate limit exceeded', {
                identifier,
                current,
                max: config.maxRequests,
                window: config.windowSeconds,
                action: 'RATE_LIMIT_EXCEEDED'
            });
        }
        return {
            allowed,
            remaining,
            resetAt,
            current,
        };
    }
    catch (error) {
        logger_1.logger.error('Rate limit check failed', {
            identifier,
            error: error instanceof Error ? error.message : String(error),
            action: 'RATE_LIMIT_CHECK'
        });
        // FAIL-SECURE: Deny access on Redis errors
        // This prevents bypass attacks if Redis is down
        // Production monitoring should alert on these errors
        return {
            allowed: false,
            remaining: 0,
            resetAt: Date.now() + config.windowSeconds * 1000,
            current: config.maxRequests + 1,
        };
    }
}
/**
 * Rate limit by IP address
 * Returns rate limit result with detailed status
 */
async function rateLimitByIP(request, config = {
    maxRequests: 5,
    windowSeconds: 15 * 60, // 15 minutes
}) {
    const identifier = getClientIdentifier(request);
    const result = await checkRateLimit(identifier, config);
    return {
        limited: !result.allowed,
        remaining: result.remaining,
        resetAt: result.resetAt,
        current: result.current,
    };
}
/**
 * Rate limit by user ID (for authenticated endpoints)
 * Returns rate limit result with detailed status
 */
async function rateLimitByUser(userId, config = {
    maxRequests: 10,
    windowSeconds: 15 * 60, // 15 minutes
}) {
    const identifier = `user:${userId}`;
    const result = await checkRateLimit(identifier, config);
    return {
        limited: !result.allowed,
        remaining: result.remaining,
        resetAt: result.resetAt,
        current: result.current,
    };
}
/**
 * Reset rate limit for a specific identifier
 * Useful after successful login to clear failed attempts
 */
async function resetRateLimit(identifier) {
    try {
        const redis = getRedisClient();
        const key = `ratelimit:${identifier}`;
        await redis.del(key);
        logger_1.logger.info('Rate limit reset', {
            identifier,
            action: 'RATE_LIMIT_RESET'
        });
    }
    catch (error) {
        logger_1.logger.error('Rate limit reset failed', {
            identifier,
            error: error instanceof Error ? error.message : String(error),
            action: 'RATE_LIMIT_RESET'
        });
    }
}
/**
 * Get rate limit status without incrementing
 */
async function getRateLimitStatus(identifier, config = {
    maxRequests: 5,
    windowSeconds: 15 * 60,
}) {
    try {
        const redis = getRedisClient();
        const key = `ratelimit:${identifier}`;
        const current = await redis.get(key);
        const ttlRemaining = await redis.ttl(key);
        if (current === null || ttlRemaining <= 0) {
            return null;
        }
        const remaining = Math.max(0, config.maxRequests - current);
        const resetAt = Date.now() + ttlRemaining * 1000;
        return {
            remaining,
            resetAt,
            current,
        };
    }
    catch (error) {
        logger_1.logger.error('Rate limit status check failed', {
            identifier,
            error: error instanceof Error ? error.message : String(error),
            action: 'RATE_LIMIT_STATUS'
        });
        return null;
    }
}
// Export config for common scenarios
exports.RATE_LIMIT_CONFIGS = {
    LOGIN: { maxRequests: 5, windowSeconds: 900 }, // 5 attempts per 15 min
    MAGIC_LINK: { maxRequests: 3, windowSeconds: 3600 }, // 3 per hour
    GENERAL: { maxRequests: 60, windowSeconds: 60 }, // 60 per minute
    STRICT: { maxRequests: 10, windowSeconds: 3600 }, // 10 per hour
};
