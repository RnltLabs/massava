"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Data Retention Cron Job
 * Runs daily at 2 AM to execute retention policies and send deletion warnings
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDataRetentionJob = runDataRetentionJob;
exports.scheduledDataRetentionJob = scheduledDataRetentionJob;
const prisma_1 = require("@/lib/prisma");
const logger_1 = require("@/lib/logger");
const retention_policy_1 = require("@/lib/data-retention/retention-policy");
const deletion_notifier_1 = require("@/lib/notifications/deletion-notifier");
/**
 * Execute data retention job
 * This should be called by a cron scheduler (e.g., Vercel Cron, node-cron, etc.)
 */
async function runDataRetentionJob(dryRun = false) {
    const startTime = Date.now();
    const errors = [];
    let warningsSent = 0;
    let finalWarningsSent = 0;
    logger_1.logger.info('Starting data retention job', {
        dryRun,
        action: 'DATA_RETENTION_JOB',
    });
    try {
        // Step 1: Execute retention policies
        const retentionResults = await (0, retention_policy_1.executeAllRetentionPolicies)(dryRun);
        logger_1.logger.info('Retention policies executed', {
            results: retentionResults,
            dryRun,
            action: 'DATA_RETENTION_JOB',
        });
        // Step 2: Send deletion warnings to users
        if (!dryRun) {
            const usersNeedingWarnings = await (0, retention_policy_1.getUsersNeedingWarnings)();
            logger_1.logger.info('Found users needing deletion warnings', {
                count: usersNeedingWarnings.length,
                action: 'DATA_RETENTION_JOB',
            });
            for (const user of usersNeedingWarnings) {
                try {
                    // Determine if this is a 7-day warning or 24-hour final warning
                    const isFinalWarning = user.daysUntilDeletion <= 1;
                    if (isFinalWarning) {
                        // Send final warning (24 hours)
                        const result = await (0, deletion_notifier_1.sendFinalWarningEmail)(user.id, user.email, user.name || 'User', 'de' // TODO: Get user's preferred locale from database
                        );
                        if (result.success) {
                            finalWarningsSent++;
                        }
                        else {
                            errors.push(`Failed to send final warning to ${user.email}: ${result.error}`);
                        }
                    }
                    else {
                        // Send 7-day warning
                        const result = await (0, deletion_notifier_1.sendDeletionWarningEmail)(user.id, user.email, user.name || 'User', user.daysUntilDeletion, 'de' // TODO: Get user's preferred locale from database
                        );
                        if (result.success) {
                            warningsSent++;
                            // Mark user as warned in database
                            await prisma_1.prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    deletionScheduledAt: new Date(Date.now() + user.daysUntilDeletion * 24 * 60 * 60 * 1000),
                                },
                            });
                        }
                        else {
                            errors.push(`Failed to send warning to ${user.email}: ${result.error}`);
                        }
                    }
                }
                catch (error) {
                    const errorMsg = `Error processing warning for user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    logger_1.logger.error(errorMsg, {
                        userId: user.id,
                        action: 'DATA_RETENTION_JOB',
                    });
                    errors.push(errorMsg);
                }
            }
        }
        const executionTime = Date.now() - startTime;
        logger_1.logger.info('Data retention job completed', {
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
    }
    catch (error) {
        const errorMsg = `Data retention job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger_1.logger.error(errorMsg, {
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
async function scheduledDataRetentionJob() {
    try {
        const result = await runDataRetentionJob(false);
        return new Response(JSON.stringify({
            message: 'Data retention job completed',
            ...result,
        }), {
            status: result.success ? 200 : 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Scheduled data retention job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'SCHEDULED_DATA_RETENTION',
        });
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
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
