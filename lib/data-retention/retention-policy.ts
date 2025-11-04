/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Data Retention Policy Engine
 * Implements GDPR Art. 5(1)(e) (Storage Limitation) and Art. 17 (Right to Erasure)
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */

import { PrismaClient } from '@/app/generated/prisma';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

/**
 * Data Retention Periods (from GDPR compliance requirements)
 */
export const RETENTION_PERIODS = {
  // User Account: 3 years after last activity
  USER_ACCOUNT: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years in milliseconds

  // Health Data (Booking Messages): 1 year OR consent revocation
  HEALTH_DATA: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds

  // Bookings (Non-Health): 3 years
  BOOKINGS: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years in milliseconds

  // Invoices: 10 years (legal obligation - tax law)
  INVOICES: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years in milliseconds

  // Audit Logs: 90 days
  AUDIT_LOGS: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds

  // Soft Delete Grace Period: 30 days before permanent deletion
  SOFT_DELETE_GRACE: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds

  // Warning Period: 7 days before scheduled deletion
  WARNING_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
} as const;

export type DataType =
  | 'USER_ACCOUNT'
  | 'HEALTH_DATA'
  | 'BOOKINGS'
  | 'INVOICES'
  | 'AUDIT_LOGS';

export interface RetentionCheckResult {
  shouldDelete: boolean;
  reason?: string;
  daysUntilDeletion?: number;
}

export interface RetentionExecutionResult {
  dataType: DataType;
  deletedCount: number;
  warnings: number;
  errors: string[];
  dryRun: boolean;
}

/**
 * Check if data should be deleted based on retention policy
 */
export function shouldDelete(
  data: { createdAt: Date; updatedAt?: Date; deletedAt?: Date },
  dataType: DataType
): RetentionCheckResult {
  const now = new Date();
  const retentionPeriod = RETENTION_PERIODS[dataType];

  // If data has deletedAt timestamp, check grace period
  if (data.deletedAt) {
    const deletionTime = new Date(data.deletedAt).getTime();
    const gracePeriod = RETENTION_PERIODS.SOFT_DELETE_GRACE;
    const timeSinceDeletion = now.getTime() - deletionTime;

    if (timeSinceDeletion >= gracePeriod) {
      return {
        shouldDelete: true,
        reason: 'Grace period expired after soft delete',
        daysUntilDeletion: 0,
      };
    } else {
      const remainingMs = gracePeriod - timeSinceDeletion;
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      return {
        shouldDelete: false,
        reason: 'Still in grace period',
        daysUntilDeletion: remainingDays,
      };
    }
  }

  // Use updatedAt for last activity, fallback to createdAt
  const lastActivity = data.updatedAt || data.createdAt;
  const timeSinceLastActivity = now.getTime() - new Date(lastActivity).getTime();

  if (timeSinceLastActivity >= retentionPeriod) {
    return {
      shouldDelete: true,
      reason: 'Retention period expired',
      daysUntilDeletion: 0,
    };
  } else {
    const remainingMs = retentionPeriod - timeSinceLastActivity;
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return {
      shouldDelete: false,
      reason: 'Still within retention period',
      daysUntilDeletion: remainingDays,
    };
  }
}

/**
 * Check if user should receive deletion warning
 */
export function shouldWarn(
  data: { createdAt: Date; updatedAt?: Date; deletionScheduledAt?: Date | null },
  dataType: DataType
): boolean {
  if (data.deletionScheduledAt) {
    // Already warned
    return false;
  }

  const now = new Date();
  const retentionPeriod = RETENTION_PERIODS[dataType];
  const warningPeriod = RETENTION_PERIODS.WARNING_PERIOD;
  const lastActivity = data.updatedAt || data.createdAt;
  const timeSinceLastActivity = now.getTime() - new Date(lastActivity).getTime();
  const timeUntilDeletion = retentionPeriod - timeSinceLastActivity;

  return timeUntilDeletion <= warningPeriod && timeUntilDeletion > 0;
}

/**
 * Execute retention policy for user accounts
 */
export async function executeUserRetention(
  dryRun: boolean = false
): Promise<RetentionExecutionResult> {
  const errors: string[] = [];
  let deletedCount = 0;
  let warnings = 0;

  try {
    const now = new Date();
    const retentionThreshold = new Date(
      now.getTime() - RETENTION_PERIODS.USER_ACCOUNT
    );

    // Find inactive users (no activity for 3 years)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        updatedAt: {
          lt: retentionThreshold,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        updatedAt: true,
        deletionScheduledAt: true,
      },
    });

    logger.info('Found inactive users for retention processing', {
      count: inactiveUsers.length,
      dryRun,
      action: 'USER_RETENTION',
    });

    for (const user of inactiveUsers) {
      try {
        if (!dryRun) {
          // Soft delete the user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              deletedAt: now,
            },
          });

          await createAuditLog({
            userId: user.id,
            action: 'USER_DELETED',
            resource: 'user',
            resourceId: user.id,
            metadata: {
              reason: 'Automatic deletion due to retention policy',
              lastActivity: user.updatedAt,
            },
          });

          deletedCount++;
        } else {
          deletedCount++; // Count for dry run
        }
      } catch (error) {
        const errorMsg = `Failed to delete user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg, { userId: user.id, action: 'USER_RETENTION' });
        errors.push(errorMsg);
      }
    }

    // Find users approaching deletion (for warnings)
    const warningThreshold = new Date(
      now.getTime() - RETENTION_PERIODS.USER_ACCOUNT + RETENTION_PERIODS.WARNING_PERIOD
    );

    const usersNeedingWarning = await prisma.user.findMany({
      where: {
        updatedAt: {
          lt: warningThreshold,
          gte: retentionThreshold,
        },
        deletedAt: null,
        deletionScheduledAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    warnings = usersNeedingWarning.length;

    if (!dryRun && usersNeedingWarning.length > 0) {
      // Mark users as needing warning
      for (const user of usersNeedingWarning) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            deletionScheduledAt: new Date(now.getTime() + RETENTION_PERIODS.WARNING_PERIOD),
          },
        });
      }
    }

    logger.info('User retention execution completed', {
      deletedCount,
      warnings,
      errors: errors.length,
      dryRun,
      action: 'USER_RETENTION',
    });
  } catch (error) {
    const errorMsg = `User retention execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { action: 'USER_RETENTION' });
    errors.push(errorMsg);
  }

  return {
    dataType: 'USER_ACCOUNT',
    deletedCount,
    warnings,
    errors,
    dryRun,
  };
}

/**
 * Execute retention policy for health data (booking messages)
 */
export async function executeHealthDataRetention(
  dryRun: boolean = false
): Promise<RetentionExecutionResult> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    const now = new Date();
    const retentionThreshold = new Date(
      now.getTime() - RETENTION_PERIODS.HEALTH_DATA
    );

    // Find bookings with health data older than 1 year OR consent withdrawn
    const healthDataToDelete = await prisma.newBooking.findMany({
      where: {
        OR: [
          {
            // Health consent given and retention period expired
            explicitHealthConsent: true,
            healthConsentGivenAt: {
              lt: retentionThreshold,
            },
            healthConsentWithdrawnAt: null,
          },
          {
            // Health consent withdrawn (immediate deletion)
            healthConsentWithdrawnAt: {
              not: null,
            },
          },
        ],
      },
      select: {
        id: true,
        message: true,
        healthConsentWithdrawnAt: true,
      },
    });

    logger.info('Found health data for retention processing', {
      count: healthDataToDelete.length,
      dryRun,
      action: 'HEALTH_DATA_RETENTION',
    });

    for (const booking of healthDataToDelete) {
      try {
        if (!dryRun) {
          // Delete health-related message data
          await prisma.newBooking.update({
            where: { id: booking.id },
            data: {
              message: null, // Remove health-related messages
              healthConsentText: null,
            },
          });

          await createAuditLog({
            action: 'BOOKING_UPDATED',
            resource: 'booking',
            resourceId: booking.id,
            metadata: {
              reason: 'Health data deleted due to retention policy',
              consentWithdrawn: !!booking.healthConsentWithdrawnAt,
            },
          });

          deletedCount++;
        } else {
          deletedCount++;
        }
      } catch (error) {
        const errorMsg = `Failed to delete health data for booking ${booking.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg, { bookingId: booking.id, action: 'HEALTH_DATA_RETENTION' });
        errors.push(errorMsg);
      }
    }

    logger.info('Health data retention execution completed', {
      deletedCount,
      errors: errors.length,
      dryRun,
      action: 'HEALTH_DATA_RETENTION',
    });
  } catch (error) {
    const errorMsg = `Health data retention execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { action: 'HEALTH_DATA_RETENTION' });
    errors.push(errorMsg);
  }

  return {
    dataType: 'HEALTH_DATA',
    deletedCount,
    warnings: 0,
    errors,
    dryRun,
  };
}

/**
 * Execute retention policy for bookings (non-health)
 */
export async function executeBookingsRetention(
  dryRun: boolean = false
): Promise<RetentionExecutionResult> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    const now = new Date();
    const retentionThreshold = new Date(
      now.getTime() - RETENTION_PERIODS.BOOKINGS
    );

    // Find bookings older than 3 years
    const bookingsToDelete = await prisma.newBooking.findMany({
      where: {
        createdAt: {
          lt: retentionThreshold,
        },
      },
      select: {
        id: true,
      },
    });

    logger.info('Found bookings for retention processing', {
      count: bookingsToDelete.length,
      dryRun,
      action: 'BOOKINGS_RETENTION',
    });

    if (!dryRun && bookingsToDelete.length > 0) {
      const result = await prisma.newBooking.deleteMany({
        where: {
          id: {
            in: bookingsToDelete.map(b => b.id),
          },
        },
      });

      deletedCount = result.count;

      await createAuditLog({
        action: 'BOOKING_DELETED',
        resource: 'booking',
        resourceId: 'bulk',
        metadata: {
          reason: 'Automatic deletion due to retention policy',
          count: deletedCount,
        },
      });
    } else {
      deletedCount = bookingsToDelete.length;
    }

    logger.info('Bookings retention execution completed', {
      deletedCount,
      errors: errors.length,
      dryRun,
      action: 'BOOKINGS_RETENTION',
    });
  } catch (error) {
    const errorMsg = `Bookings retention execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { action: 'BOOKINGS_RETENTION' });
    errors.push(errorMsg);
  }

  return {
    dataType: 'BOOKINGS',
    deletedCount,
    warnings: 0,
    errors,
    dryRun,
  };
}

/**
 * Execute retention policy for audit logs
 */
export async function executeAuditLogsRetention(
  dryRun: boolean = false
): Promise<RetentionExecutionResult> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    const now = new Date();
    const retentionThreshold = new Date(
      now.getTime() - RETENTION_PERIODS.AUDIT_LOGS
    );

    // Find audit logs older than 90 days
    const result = dryRun
      ? await prisma.auditLog.count({
          where: {
            createdAt: {
              lt: retentionThreshold,
            },
          },
        })
      : (await prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: retentionThreshold,
            },
          },
        })).count;

    deletedCount = result;

    logger.info('Audit logs retention execution completed', {
      deletedCount,
      errors: errors.length,
      dryRun,
      action: 'AUDIT_LOGS_RETENTION',
    });
  } catch (error) {
    const errorMsg = `Audit logs retention execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { action: 'AUDIT_LOGS_RETENTION' });
    errors.push(errorMsg);
  }

  return {
    dataType: 'AUDIT_LOGS',
    deletedCount,
    warnings: 0,
    errors,
    dryRun,
  };
}

/**
 * Execute permanent deletion of soft-deleted users after grace period
 */
export async function executePermanentDeletion(
  dryRun: boolean = false
): Promise<{ deletedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    const now = new Date();
    const gracePeriodThreshold = new Date(
      now.getTime() - RETENTION_PERIODS.SOFT_DELETE_GRACE
    );

    // Find soft-deleted users past grace period
    const usersToDelete = await prisma.user.findMany({
      where: {
        deletedAt: {
          lt: gracePeriodThreshold,
        },
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    logger.info('Found users for permanent deletion', {
      count: usersToDelete.length,
      dryRun,
      action: 'PERMANENT_DELETION',
    });

    for (const user of usersToDelete) {
      try {
        if (!dryRun) {
          // Delete user completely (CASCADE will handle related records)
          await prisma.user.delete({
            where: { id: user.id },
          });

          // Create audit log before user is deleted
          await createAuditLog({
            action: 'USER_DELETED',
            resource: 'user',
            resourceId: user.id,
            metadata: {
              reason: 'Permanent deletion after grace period',
              deletedAt: user.deletedAt,
              email: user.email,
            },
          });

          deletedCount++;
        } else {
          deletedCount++;
        }
      } catch (error) {
        const errorMsg = `Failed to permanently delete user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg, { userId: user.id, action: 'PERMANENT_DELETION' });
        errors.push(errorMsg);
      }
    }

    logger.info('Permanent deletion completed', {
      deletedCount,
      errors: errors.length,
      dryRun,
      action: 'PERMANENT_DELETION',
    });
  } catch (error) {
    const errorMsg = `Permanent deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { action: 'PERMANENT_DELETION' });
    errors.push(errorMsg);
  }

  return { deletedCount, errors };
}

/**
 * Execute all retention policies
 */
export async function executeAllRetentionPolicies(
  dryRun: boolean = false
): Promise<RetentionExecutionResult[]> {
  logger.info('Starting retention policy execution', {
    dryRun,
    action: 'RETENTION_EXECUTION',
  });

  const results: RetentionExecutionResult[] = [];

  // Execute each retention policy
  results.push(await executeUserRetention(dryRun));
  results.push(await executeHealthDataRetention(dryRun));
  results.push(await executeBookingsRetention(dryRun));
  results.push(await executeAuditLogsRetention(dryRun));

  // Execute permanent deletion
  const permanentDeletion = await executePermanentDeletion(dryRun);

  logger.info('Retention policy execution completed', {
    results,
    permanentDeletions: permanentDeletion.deletedCount,
    dryRun,
    action: 'RETENTION_EXECUTION',
  });

  return results;
}

/**
 * Get users that need deletion warnings
 */
export async function getUsersNeedingWarnings(): Promise<
  Array<{ id: string; email: string; name: string | null; daysUntilDeletion: number }>
> {
  const now = new Date();
  const retentionThreshold = new Date(
    now.getTime() - RETENTION_PERIODS.USER_ACCOUNT
  );
  const warningThreshold = new Date(
    now.getTime() - RETENTION_PERIODS.USER_ACCOUNT + RETENTION_PERIODS.WARNING_PERIOD
  );

  const users = await prisma.user.findMany({
    where: {
      updatedAt: {
        lt: warningThreshold,
        gte: retentionThreshold,
      },
      deletedAt: null,
      deletionScheduledAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      updatedAt: true,
    },
  });

  return users.map(user => {
    const timeSinceLastActivity = now.getTime() - new Date(user.updatedAt).getTime();
    const timeUntilDeletion = RETENTION_PERIODS.USER_ACCOUNT - timeSinceLastActivity;
    const daysUntilDeletion = Math.ceil(timeUntilDeletion / (24 * 60 * 60 * 1000));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      daysUntilDeletion,
    };
  });
}
