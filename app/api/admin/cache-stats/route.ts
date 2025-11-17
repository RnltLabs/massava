/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Cache Statistics API
 * Provides cache performance metrics for monitoring
 * Phase 2: Redis Cache Integration
 */

import { NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/auth/session-cache';
import { requireAuth } from '@/lib/auth/guards';
import { UserRole } from '@/app/generated/prisma';

/**
 * GET /api/admin/cache-stats
 * Returns cache performance statistics
 * Requires SUPER_ADMIN role
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Require authentication and admin role
    const authResult = await requireAuth();

    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // Only SUPER_ADMIN can access cache stats
    if (authResult.value.primaryRole !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Super admin required.' },
        { status: 403 }
      );
    }

    // Get cache statistics
    const stats = await cacheMonitor.getStats();

    return NextResponse.json({
      success: true,
      stats,
      metadata: {
        timestamp: new Date().toISOString(),
        target: {
          hitRate: 90, // Target: >90%
          avgLatency: 5, // Target: <5ms
        },
        status: {
          hitRateOk: stats.hitRate >= 90,
          latencyOk: stats.avgLatency <= 5,
        },
      },
    });
  } catch (error) {
    console.error('[Cache Stats] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cache-stats
 * Reset cache statistics counters
 * Requires SUPER_ADMIN role
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    // Require authentication and admin role
    const authResult = await requireAuth();

    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // Only SUPER_ADMIN can reset cache stats
    if (authResult.value.primaryRole !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Super admin required.' },
        { status: 403 }
      );
    }

    // Reset statistics
    cacheMonitor.reset();

    return NextResponse.json({
      success: true,
      message: 'Cache statistics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cache Stats] Reset error:', error);

    return NextResponse.json(
      {
        error: 'Failed to reset cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
