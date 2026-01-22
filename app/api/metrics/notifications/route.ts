/**
 * Notification Metrics Endpoint
 *
 * Exposes notification system metrics in Prometheus format.
 * Use with Prometheus scraping or for manual inspection.
 *
 * GET /api/metrics/notifications
 * Returns: text/plain (Prometheus format)
 */

import { NextResponse } from 'next/server';
import { getMetricsCollector } from '@/lib/notifications/metrics';

/**
 * Export notification metrics in Prometheus format
 *
 * @example
 * curl http://localhost:3000/api/metrics/notifications
 *
 * @returns Prometheus-formatted metrics
 */
export async function GET(): Promise<NextResponse> {
  try {
    const collector = getMetricsCollector();
    const metricsOutput = collector.export();

    return new NextResponse(metricsOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to export metrics:', error);
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}
