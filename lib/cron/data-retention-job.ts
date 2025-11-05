/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Data Retention Cron Job
 * Runs daily at 2 AM to execute retention policies and send deletion warnings
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */

import { logger } from '@/lib/logger';
import {
  executeAllRetentionPolicies,
  getUsersNeedingWarnings,
} from '@/lib/data-retention/retention-policy';
import {
  sendDeletionWarningEmail,
  sendFinalWarningEmail,
} from '@/lib/notifications/deletion-notifier';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export interface DataRetentionJobResult {
  success: boolean;
  executionTime: number;
  retentionResults: Array<{
    dataType: string;
    deletedCount: number;
    warnings: number;
    errors: string[];
  }>;
  warningsSent: number;
  finalWarningsSent: number;
  errors: string[];
}

/**
 * Execute data retention job
 * This should be called by a cron scheduler (e.g., Vercel Cron, node-cron, etc.)
 */
export async function runDataRetentionJob(
  dryRun: boolean = false
): Promise<DataRetentionJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let warningsSent = 0;
  let finalWarningsSent = 0;

  logger.info('Starting data retention job', {
    dryRun,
    action: 'DATA_RETENTION_JOB',
  });

  try {
    // Step 1: Execute retention policies
    const retentionResults = await executeAllRetentionPolicies(dryRun);

    logger.info('Retention policies executed', {
      results: retentionResults,
      dryRun,
      action: 'DATA_RETENTION_JOB',
    });

    // Step 2: Send deletion warnings to users
    if (!dryRun) {
      const usersNeedingWarnings = await getUsersNeedingWarnings();

      logger.info('Found users needing deletion warnings', {
        count: usersNeedingWarnings.length,
        action: 'DATA_RETENTION_JOB',
      });

      for (const user of usersNeedingWarnings) {
        try {
          // Determine if this is a 7-day warning or 24-hour final warning
          const isFinalWarning = user.daysUntilDeletion <= 1;

          if (isFinalWarning) {
            // Send final warning (24 hours)
            const result = await sendFinalWarningEmail(
              user.id,
              user.email,
              user.name || 'User',
              'de' // TODO: Get user's preferred locale from database
            );

            if (result.success) {
              finalWarningsSent++;
            } else {
              errors.push(`Failed to send final warning to ${user.email}: ${result.error}`);
            }
          } else {
            // Send 7-day warning
            const result = await sendDeletionWarningEmail(
              user.id,
              user.email,
              user.name || 'User',
              user.daysUntilDeletion,
              'de' // TODO: Get user's preferred locale from database
            );

            if (result.success) {
              warningsSent++;

              // Mark user as warned in database
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  deletionScheduledAt: new Date(
                    Date.now() + user.daysUntilDeletion * 24 * 60 * 60 * 1000
                  ),
                },
              });
            } else {
              errors.push(`Failed to send warning to ${user.email}: ${result.error}`);
            }
          }
        } catch (error) {
          const errorMsg = `Error processing warning for user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg, {
            userId: user.id,
            action: 'DATA_RETENTION_JOB',
          });
          errors.push(errorMsg);
        }
      }
    }

    const executionTime = Date.now() - startTime;

    logger.info('Data retention job completed', {
      executionTime,
      warningsSent,
      finalWarningsSent,
      errors: errors.length,
      dryRun,
      action: 'DATA_RETENTION_JOB',
    });

    return {
      success: errors.length === 0,
      executionTime,
      retentionResults: retentionResults.map(r => ({
        dataType: r.dataType,
        deletedCount: r.deletedCount,
        warnings: r.warnings,
        errors: r.errors,
      })),
      warningsSent,
      finalWarningsSent,
      errors,
    };
  } catch (error) {
    const errorMsg = `Data retention job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, {
      action: 'DATA_RETENTION_JOB',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      executionTime: Date.now() - startTime,
      retentionResults: [],
      warningsSent,
      finalWarningsSent,
      errors: [errorMsg, ...errors],
    };
  }
}

/**
 * Scheduled function wrapper for Vercel Cron
 * This is the function that should be called by Vercel Cron Jobs
 */
export async function scheduledDataRetentionJob(): Promise<Response> {
  try {
    const result = await runDataRetentionJob(false);

    return new Response(
      JSON.stringify({
        message: 'Data retention job completed',
        ...result,
      }),
      {
        status: result.success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Scheduled data retention job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'SCHEDULED_DATA_RETENTION',
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Manual trigger for data retention job (CLI)
 * Usage: node -r ts-node/register lib/cron/data-retention-job.ts
 */
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');

  runDataRetentionJob(dryRun)
    .then(result => {
      console.log('Data Retention Job Result:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Data retention job failed:', error);
      process.exit(1);
    });
}
