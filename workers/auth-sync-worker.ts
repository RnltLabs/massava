/**
 * Auth Sync Worker - Background Job Processor
 *
 * DEPLOYMENT: Separate process from Next.js server
 * PURPOSE: Process user sync jobs asynchronously to reduce OAuth latency
 *
 * PERFORMANCE TARGET:
 * - OAuth sign-in: 260ms → 70ms (-73% reduction)
 * - Job enqueue: <5ms (non-blocking)
 * - Job processing: ~100ms (async, in background)
 *
 * RUN:
 * - Development: npm run worker:dev
 * - Production: npm run worker
 * - Docker: docker-compose up auth-worker
 *
 * MONITORING:
 * - Queue depth: GET /api/admin/worker-status
 * - Processing rate: logs
 * - Failed jobs: RabbitMQ management UI
 */

import { startWorker } from '@/lib/auth/background-sync';
import { logger } from '@/lib/logger';

async function main(): Promise<void> {
  logger.info('Starting auth sync worker...', {
    action: 'worker_startup',
    environment: process.env.NODE_ENV || 'development',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  });

  try {
    // Start consuming jobs from queue
    await startWorker();

    logger.info('Auth sync worker started successfully', {
      action: 'worker_ready',
      status: 'ready',
    });

    // Keep process alive
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...', {
        action: 'worker_shutdown',
      });
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...', {
        action: 'worker_shutdown',
      });
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start auth sync worker', {
      action: 'worker_startup_failed',
      error: error as Error,
    });
    process.exit(1);
  }
}

// Start worker
main().catch((error) => {
  console.error('Worker crashed:', error);
  process.exit(1);
});
