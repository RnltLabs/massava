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

import { Redis } from "@upstash/redis";
import type { UserRole } from "@/app/generated/prisma";
import { logger } from '@/lib/logger';

// Redis client (singleton)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

/**
 * Cached session data (minimal payload)
 *
 * SIZE: ~200 bytes (vs 2KB full User object)
 * - userId: 36 bytes (UUID)
 * - email: ~30 bytes (average)
 * - name: ~30 bytes (average)
 * - role: 12 bytes (enum)
 * - image: ~80 bytes (URL)
 * - metadata: ~12 bytes (timestamps)
 */
export interface CachedSession {
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
  createdAt: string; // ISO timestamp
  lastAccessedAt: string; // ISO timestamp
}

/**
 * Cache key generator
 *
 * PATTERN: session:{userId}
 * EXAMPLE: session:550e8400-e29b-41d4-a716-446655440000
 */
function getCacheKey(userId: string): string {
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
export async function getSessionFromCache(
  userId: string
): Promise<CachedSession | null> {
  const startTime = performance.now();

  try {
    const key = getCacheKey(userId);
    const cached = await redis.get<CachedSession>(key);

    const duration = performance.now() - startTime;

    // Track performance
    if (duration > 10) {
      logger.warn('Redis cache read slow', {
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
  } catch (error) {
    logger.error('Redis cache read failed', {
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
export async function setSessionInCache(
  userId: string,
  session: CachedSession
): Promise<void> {
  const startTime = performance.now();

  try {
    const key = getCacheKey(userId);
    await redis.set(key, session, { ex: 900 }); // 15 minutes TTL

    const duration = performance.now() - startTime;

    if (duration > 10) {
      logger.warn('Redis cache write slow', {
        userId,
        duration,
        action: 'CACHE_WRITE'
      });
    }
  } catch (error) {
    logger.error('Redis cache write failed', {
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
export async function invalidateSessionCache(userId: string): Promise<void> {
  const startTime = performance.now();

  try {
    const key = getCacheKey(userId);
    await redis.del(key);

    const duration = performance.now() - startTime;

    if (duration > 10) {
      logger.warn('Redis cache invalidation slow', {
        userId,
        duration,
        action: 'CACHE_INVALIDATE'
      });
    }
  } catch (error) {
    logger.error('Redis cache invalidation failed', {
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
export async function invalidateMultipleSessions(
  userIds: string[]
): Promise<void> {
  const startTime = performance.now();

  try {
    const keys = userIds.map(getCacheKey);
    await Promise.all(keys.map((key) => redis.del(key)));

    const duration = performance.now() - startTime;

    logger.info('Batch session invalidation completed', {
      sessionCount: userIds.length,
      duration,
      action: 'BATCH_INVALIDATE'
    });
  } catch (error) {
    logger.error('Batch invalidation failed', {
      sessionCount: userIds.length,
      error: error instanceof Error ? error.message : String(error),
      action: 'BATCH_INVALIDATE'
    });
  }
}

/**
 * Cache statistics (for monitoring)
 *
 * METRICS:
 * - Hit rate: (hits / total requests) * 100
 * - Average latency: sum(durations) / count
 * - Memory usage: Redis INFO command
 */
export interface CacheStats {
  hitRate: number; // Percentage (0-100)
  avgLatency: number; // Milliseconds
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsedMB: number;
}

class CacheMonitor {
  private hits = 0;
  private misses = 0;
  private latencies: number[] = [];

  recordHit(latencyMs: number): void {
    this.hits++;
    this.latencies.push(latencyMs);
  }

  recordMiss(): void {
    this.misses++;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    const avgLatency =
      this.latencies.length > 0
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

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.latencies = [];
  }
}

export const cacheMonitor = new CacheMonitor();

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
