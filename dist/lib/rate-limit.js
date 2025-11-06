"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Rate Limiting Utilities
 * Distributed rate limiting with Upstash Redis (with in-memory fallback)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
exports.authRateLimit = authRateLimit;
exports.magicLinkRateLimit = magicLinkRateLimit;
exports.bookingRateLimit = bookingRateLimit;
exports.getClientIp = getClientIp;
exports.rateLimitErrorResponse = rateLimitErrorResponse;
exports.checkDeletionRateLimit = checkDeletionRateLimit;
exports.resetDeletionRateLimit = resetDeletionRateLimit;
const redis_1 = require("@upstash/redis");
// In-memory store for rate limiting (fallback for development)
const rateLimitStore = new Map();
// In-memory store for deletion rate limiting (fallback)
const deletionAttempts = new Map();
// Initialize Redis client (lazy initialization)
let redis = null;
/**
 * Get Redis client instance (singleton pattern)
 */
function getRedisClient() {
    if (redis) {
        return redis;
    }
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set in production. Using in-memory fallback (NOT recommended).');
        }
        return null;
    }
    redis = new redis_1.Redis({
        url,
        token,
    });
    return redis;
}
// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
    // Also clean up deletion attempts
    for (const [key, entry] of deletionAttempts.entries()) {
        if (entry.resetAt < now) {
            deletionAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000);
/**
 * Simple in-memory rate limiter using sliding window
 *
 * @param identifier - Unique identifier (IP address or email)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
function rateLimit(identifier, limit, windowMs) {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);
    // No entry or expired entry
    if (!entry || entry.resetTime < now) {
        const newEntry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(identifier, newEntry);
        return {
            success: true,
            limit,
            remaining: limit - 1,
            reset: newEntry.resetTime,
        };
    }
    // Entry exists and not expired
    entry.count++;
    if (entry.count > limit) {
        return {
            success: false,
            limit,
            remaining: 0,
            reset: entry.resetTime,
        };
    }
    return {
        success: true,
        limit,
        remaining: limit - entry.count,
        reset: entry.resetTime,
    };
}
/**
 * Rate limiter for authentication endpoints
 * Limits: 5 attempts per 15 minutes
 */
function authRateLimit(identifier) {
    return rateLimit(identifier, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
}
/**
 * Rate limiter for magic link generation
 * Limits: 3 attempts per 15 minutes
 */
function magicLinkRateLimit(identifier) {
    return rateLimit(identifier, 3, 15 * 60 * 1000); // 3 requests per 15 minutes
}
/**
 * Rate limiter for booking endpoints
 * Limits: 10 bookings per hour
 */
function bookingRateLimit(identifier) {
    return rateLimit(identifier, 10, 60 * 60 * 1000); // 10 requests per hour
}
/**
 * Get client IP address from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
function getClientIp(request) {
    const headers = request.headers;
    // Try various headers (in order of preference)
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
        // We want the first one (original client)
        return forwardedFor.split(',')[0].trim();
    }
    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }
    const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }
    // Fallback to 'unknown' if no IP found
    return 'unknown';
}
/**
 * Format rate limit error response
 */
function rateLimitErrorResponse(result) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return {
        error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
        retryAfter,
        limit: result.limit,
        remaining: result.remaining,
    };
}
/**
 * In-memory deletion rate limiting (fallback for development)
 */
function checkInMemoryDeletionRateLimit(userId, maxAttempts, windowSeconds) {
    const now = Date.now();
    const userAttempts = deletionAttempts.get(userId);
    if (!userAttempts || now > userAttempts.resetAt) {
        // Reset or initialize
        deletionAttempts.set(userId, {
            count: 1,
            resetAt: now + windowSeconds * 1000,
        });
        return { allowed: true, attemptsLeft: maxAttempts - 1 };
    }
    userAttempts.count += 1;
    if (userAttempts.count > maxAttempts) {
        const secondsLeft = Math.ceil((userAttempts.resetAt - now) / 1000);
        const minutes = Math.ceil(secondsLeft / 60);
        return {
            allowed: false,
            error: `Zu viele Löschversuche. Bitte versuchen Sie es in ${minutes} Minute${minutes === 1 ? '' : 'n'} erneut.`,
        };
    }
    return { allowed: true, attemptsLeft: maxAttempts - userAttempts.count };
}
/**
 * Check deletion rate limit for a user (production-ready with Upstash Redis)
 *
 * @param userId - User ID to check
 * @returns Object with allowed status, error message if denied, and attempts left
 *
 * @example
 * ```typescript
 * const result = await checkDeletionRateLimit(userId);
 * if (!result.allowed) {
 *   return { success: false, error: result.error };
 * }
 * ```
 */
async function checkDeletionRateLimit(userId) {
    const MAX_ATTEMPTS = 3;
    const WINDOW_SECONDS = 60 * 60; // 1 hour
    const redisClient = getRedisClient();
    // Fallback to in-memory if Redis not configured
    if (!redisClient) {
        return checkInMemoryDeletionRateLimit(userId, MAX_ATTEMPTS, WINDOW_SECONDS);
    }
    try {
        const key = `studio:deletion:${userId}`;
        // Increment counter
        const count = await redisClient.incr(key);
        // Set expiry on first attempt
        if (count === 1) {
            await redisClient.expire(key, WINDOW_SECONDS);
        }
        // Check if limit exceeded
        if (count > MAX_ATTEMPTS) {
            const ttl = await redisClient.ttl(key);
            const minutes = Math.ceil(ttl / 60);
            return {
                allowed: false,
                error: `Zu viele Löschversuche. Bitte versuchen Sie es in ${minutes} Minute${minutes === 1 ? '' : 'n'} erneut.`,
            };
        }
        return {
            allowed: true,
            attemptsLeft: MAX_ATTEMPTS - count,
        };
    }
    catch (error) {
        console.error('[rate-limit] Redis error, falling back to in-memory:', error);
        // Fallback to in-memory on Redis errors
        return checkInMemoryDeletionRateLimit(userId, MAX_ATTEMPTS, WINDOW_SECONDS);
    }
}
/**
 * Reset deletion rate limit for a user
 * Useful for testing or manual admin actions
 *
 * @param userId - User ID to reset
 */
async function resetDeletionRateLimit(userId) {
    const redisClient = getRedisClient();
    if (!redisClient) {
        deletionAttempts.delete(userId);
        return;
    }
    try {
        const key = `studio:deletion:${userId}`;
        await redisClient.del(key);
    }
    catch (error) {
        console.error('[rate-limit] Error resetting rate limit:', error);
        // Also clear in-memory fallback
        deletionAttempts.delete(userId);
    }
}
