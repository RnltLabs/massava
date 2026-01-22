/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events endpoint for real-time notifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { createSSEStream, getSSEHeaders } from '@/lib/sse/sse-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stream = createSSEStream(
      session.user.id,
      request.signal,
      { heartbeatInterval: 30000, pollInterval: 2000 }
    );

    return new Response(stream, {
      headers: getSSEHeaders(),
    });
  } catch (error) {
    logger.error('GET /api/notifications/stream error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
