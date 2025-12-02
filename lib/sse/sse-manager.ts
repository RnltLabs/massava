/**
 * SSE Connection Manager
 *
 * Manages SSE connections and message formatting.
 */

import { logger } from '@/lib/logger';

export interface SSEConnectionOptions {
  heartbeatInterval?: number; // milliseconds
  pollInterval?: number; // milliseconds
}

const DEFAULT_OPTIONS: Required<SSEConnectionOptions> = {
  heartbeatInterval: 30000, // 30 seconds
  pollInterval: 1000, // 1 second
};

/**
 * Format a message for SSE transmission
 */
export function formatSSEMessage(data: unknown, event?: string): string {
  const lines: string[] = [];

  if (event) {
    lines.push(`event: ${event}`);
  }

  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push(''); // Empty line to end message

  return lines.join('\n') + '\n';
}

/**
 * Format a heartbeat comment (keeps connection alive)
 */
export function formatSSEHeartbeat(): string {
  return ': heartbeat\n\n';
}

/**
 * Create SSE headers for response
 */
export function getSSEHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  };
}

/**
 * Create an SSE stream for a user
 */
export function createSSEStream(
  userId: string,
  signal: AbortSignal,
  options: SSEConnectionOptions = {}
): ReadableStream {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // Import subscriber dynamically to avoid issues
      const { sseSubscriber } = await import('./redis-pubsub');

      // Send initial connection message
      controller.enqueue(
        encoder.encode(formatSSEMessage({ type: 'connected' }))
      );

      // Heartbeat interval
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(formatSSEHeartbeat()));
        } catch {
          clearInterval(heartbeat);
        }
      }, opts.heartbeatInterval);

      // Poll for messages
      const poll = setInterval(async () => {
        try {
          const messages = await sseSubscriber.getMessages(userId);

          for (const message of messages) {
            controller.enqueue(
              encoder.encode(formatSSEMessage(message))
            );
          }
        } catch (error) {
          logger.error('SSE poll error:', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }, opts.pollInterval);

      // Cleanup on abort
      signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clearInterval(poll);
        controller.close();
      });
    },
  });
}
