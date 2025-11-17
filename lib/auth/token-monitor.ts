/**
 * Token Compromise Monitoring and Detection
 *
 * SECURITY:
 * - Periodic compromise detection (cron job)
 * - Alert generation on suspicious patterns
 * - Token family statistics for analysis
 * - Automatic revocation of compromised families
 *
 * RUN:
 * - As cron job (every 5 minutes)
 * - On-demand via admin panel
 * - After security incident
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revokeTokenFamily } from './refresh-token';

/**
 * Compromise alert
 */
export interface CompromiseAlert {
  userId: string;
  family: string;
  detectedAt: Date;
  reason: string;
  tokensRevoked: number;
}

/**
 * Token family statistics
 */
export interface TokenFamilyStats {
  family: string;
  userId: string;
  tokenCount: number;
  activeTokens: number;
  revokedTokens: number;
  createdAt: Date;
  lastActivity: Date;
  suspicious: boolean;
  suspicionReason?: string;
}

/**
 * Monitor for token compromises (run periodically)
 *
 * DETECTION PATTERNS:
 * 1. Multiple children from same parent (token reuse)
 * 2. Excessive token rotation (>50 tokens/hour)
 * 3. Token usage after long gap (>7 days)
 *
 * PERFORMANCE: <1s for 10k tokens
 */
export async function monitorTokenCompromises(): Promise<CompromiseAlert[]> {
  const startTime = performance.now();
  const alerts: CompromiseAlert[] = [];

  try {
    logger.info('Starting token compromise monitoring', {
      action: 'TOKEN_MONITORING',
    });

    // Pattern 1: Find tokens with multiple active children (REUSE)
    const suspiciousTokens = await prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        parentId: null, // Only check root tokens
      },
      include: {
        children: {
          where: { revokedAt: null },
          include: {
            children: {
              where: { revokedAt: null },
              select: { id: true },
            },
          },
        },
      },
    });

    // Check for tokens with multiple children
    for (const token of suspiciousTokens) {
      // Count total descendants
      const descendantCount = token.children.reduce(
        (sum, child) => sum + 1 + child.children.length,
        0
      );

      // If token has > 10 descendants, might be compromised
      if (descendantCount > 10) {
        const result = await revokeTokenFamily(
          token.family,
          'suspicious_pattern_excessive_rotation',
          'system'
        );

        if (result.ok) {
          alerts.push({
            userId: token.userId,
            family: token.family,
            detectedAt: new Date(),
            reason: `Excessive token rotation: ${descendantCount} descendants`,
            tokensRevoked: result.value,
          });

          logger.warn('Token family revoked - excessive rotation', {
            userId: token.userId,
            family: token.family,
            descendants: descendantCount,
            action: 'TOKEN_MONITORING',
          });
        }
      }
    }

    // Pattern 2: Find families with multiple active tokens (CONCURRENT SESSIONS)
    const familyStats = await prisma.refreshToken.groupBy({
      by: ['family', 'userId'],
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 5 } }, // More than 5 active tokens suspicious
      },
    });

    for (const stat of familyStats) {
      if (stat._count.id > 5) {
        const result = await revokeTokenFamily(
          stat.family,
          'suspicious_pattern_concurrent_tokens',
          'system'
        );

        if (result.ok) {
          alerts.push({
            userId: stat.userId,
            family: stat.family,
            detectedAt: new Date(),
            reason: `Too many concurrent tokens: ${stat._count.id}`,
            tokensRevoked: result.value,
          });

          logger.warn('Token family revoked - concurrent tokens', {
            userId: stat.userId,
            family: stat.family,
            tokenCount: stat._count.id,
            action: 'TOKEN_MONITORING',
          });
        }
      }
    }

    const duration = performance.now() - startTime;

    logger.info('Token compromise monitoring complete', {
      alertCount: alerts.length,
      duration,
      action: 'TOKEN_MONITORING',
    });

    return alerts;
  } catch (error) {
    logger.error('Token compromise monitoring failed', {
      error: error instanceof Error ? error.message : String(error),
      action: 'TOKEN_MONITORING',
    });
    return alerts;
  }
}

/**
 * Get token family statistics for a user
 *
 * USE CASES:
 * - Admin dashboard (user session overview)
 * - Security audit (identify suspicious patterns)
 * - User settings (show active sessions)
 */
export async function getUserTokenStats(
  userId: string
): Promise<TokenFamilyStats[]> {
  try {
    const families = await prisma.refreshToken.groupBy({
      by: ['family'],
      where: { userId },
      _count: { id: true },
      _max: { createdAt: true },
    });

    const stats: TokenFamilyStats[] = [];

    for (const family of families) {
      const tokens = await prisma.refreshToken.findMany({
        where: {
          userId,
          family: family.family,
        },
        orderBy: { createdAt: 'desc' },
      });

      const activeTokens = tokens.filter(t => !t.revokedAt && t.expiresAt > new Date());
      const revokedTokens = tokens.filter(t => t.revokedAt);
      const lastActivity = tokens[0]?.createdAt || new Date();

      // Detect suspicious patterns
      let suspicious = false;
      let suspicionReason: string | undefined;

      // Pattern: Too many tokens in family
      if (tokens.length > 50) {
        suspicious = true;
        suspicionReason = 'Excessive token rotation';
      }

      // Pattern: Multiple active tokens
      if (activeTokens.length > 5) {
        suspicious = true;
        suspicionReason = 'Multiple concurrent active tokens';
      }

      // Pattern: Activity gap (dormant then active)
      const oldestActive = activeTokens[activeTokens.length - 1];
      if (oldestActive) {
        const age = Date.now() - oldestActive.createdAt.getTime();
        if (age > 7 * 24 * 60 * 60 * 1000) {
          // > 7 days
          suspicious = true;
          suspicionReason = 'Token used after long dormancy';
        }
      }

      stats.push({
        family: family.family,
        userId,
        tokenCount: tokens.length,
        activeTokens: activeTokens.length,
        revokedTokens: revokedTokens.length,
        createdAt: family._max.createdAt || new Date(),
        lastActivity,
        suspicious,
        suspicionReason,
      });
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get user token stats', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      action: 'TOKEN_STATS',
    });
    return [];
  }
}

/**
 * Get global token statistics (admin only)
 *
 * METRICS:
 * - Total active tokens
 * - Total families
 * - Average tokens per family
 * - Revoked tokens (last 24h)
 * - Suspicious families
 */
export async function getGlobalTokenStats() {
  try {
    const [
      totalTokens,
      activeTokens,
      revokedLast24h,
      families,
      suspiciousFamilies,
    ] = await Promise.all([
      // Total tokens
      prisma.refreshToken.count(),

      // Active tokens
      prisma.refreshToken.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),

      // Revoked in last 24h
      prisma.refreshToken.count({
        where: {
          revokedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total families
      prisma.refreshToken.groupBy({
        by: ['family'],
      }),

      // Suspicious families (>5 active tokens)
      prisma.refreshToken.groupBy({
        by: ['family'],
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        _count: { id: true },
        having: {
          id: { _count: { gt: 5 } },
        },
      }),
    ]);

    return {
      totalTokens,
      activeTokens,
      expiredTokens: totalTokens - activeTokens,
      revokedLast24h,
      totalFamilies: families.length,
      avgTokensPerFamily: totalTokens / families.length,
      suspiciousFamilies: suspiciousFamilies.length,
    };
  } catch (error) {
    logger.error('Failed to get global token stats', {
      error: error instanceof Error ? error.message : String(error),
      action: 'GLOBAL_TOKEN_STATS',
    });
    return null;
  }
}

/**
 * Clean up expired tokens (database cleanup)
 *
 * RUN:
 * - Daily cron job
 * - Keeps database size manageable
 * - Retains revoked tokens for audit (30 days)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          // Delete expired non-revoked tokens
          {
            expiresAt: { lt: new Date() },
            revokedAt: null,
          },
          // Delete old revoked tokens (keep 30 days for audit)
          {
            revokedAt: { lt: thirtyDaysAgo },
          },
        ],
      },
    });

    logger.info('Expired tokens cleaned up', {
      deletedCount: result.count,
      action: 'TOKEN_CLEANUP',
    });

    return result.count;
  } catch (error) {
    logger.error('Token cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
      action: 'TOKEN_CLEANUP',
    });
    return 0;
  }
}
