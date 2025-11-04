/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Health Data Access Audit Logger
 * 
 * GDPR Art. 32 Compliance - Log all access to health data
 * Records who accessed what health data and when
 */

import { prisma } from '../prisma';
import { logger } from '../logger';

/**
 * Health data access log entry
 */
export interface HealthDataAccessLog {
  action: 'ENCRYPT' | 'DECRYPT' | 'ACCESS' | 'EXPORT' | 'DELETE';
  userId: string;
  bookingId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

/**
 * Log health data access to audit trail
 * 
 * Stores logs in database and optionally to file/external service
 * 
 * @param log - Health data access log entry
 */
export async function logHealthDataAccess(log: HealthDataAccessLog): Promise<void> {
  try {
    // Log to application logger (for external monitoring like GlitchTip)
    logger.info('Health data access', {
      action: log.action,
      userId: log.userId,
      bookingId: log.bookingId,
      timestamp: log.timestamp.toISOString(),
      ipAddress: log.ipAddress ? anonymizeIp(log.ipAddress) : undefined,
      userAgent: log.userAgent,
      details: log.details,
      gdprCompliance: 'Art. 32 GDPR - Security of Processing',
    });

    // Store in database audit log
    // Note: This requires an AuditLog table in Prisma schema
    // For now, we'll handle gracefully if table doesn't exist
    try {
      await prisma.auditLog.create({
        data: {
          action: `HEALTH_DATA_${log.action}`,
          userId: log.userId,
          resourceType: 'BOOKING',
          resourceId: log.bookingId,
          ipAddress: log.ipAddress ? anonymizeIp(log.ipAddress) : null,
          userAgent: log.userAgent || null,
          details: log.details || null,
          timestamp: log.timestamp,
        },
      });
    } catch (dbError) {
      // If AuditLog table doesn't exist yet, only log to application logger
      // This allows the encryption system to work before full audit infrastructure is ready
      logger.warn('Failed to store health data access in database audit log', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        fallback: 'Logged to application logger only',
      });
    }
  } catch (error) {
    // Never throw errors from audit logging - it should not break the application
    console.error('Failed to log health data access:', error);
    logger.error('Health data audit logging failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      log,
    });
  }
}

/**
 * Anonymize IP address for GDPR compliance
 * Removes last octet for IPv4, last 80 bits for IPv6
 * 
 * @param ip - IP address to anonymize
 * @returns Anonymized IP address
 */
function anonymizeIp(ip: string): string {
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[parts.length - 1] = '0';
    return parts.join('.');
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    // Keep first 48 bits (3 groups), zero out the rest
    return parts.slice(0, 3).join(':') + '::';
  }

  // Unknown format, return as-is
  return ip;
}

/**
 * Query health data access audit logs
 * 
 * @param filters - Optional filters for querying logs
 * @returns Array of audit log entries
 */
export async function queryHealthDataAccessLogs(filters?: {
  userId?: string;
  bookingId?: string;
  action?: HealthDataAccessLog['action'];
  startDate?: Date;
  endDate?: Date;
}): Promise<any[]> {
  try {
    const where: any = {
      action: {
        startsWith: 'HEALTH_DATA_',
      },
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.bookingId) {
      where.resourceId = filters.bookingId;
    }

    if (filters?.action) {
      where.action = `HEALTH_DATA_${filters.action}`;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Limit to prevent performance issues
    });

    return logs;
  } catch (error) {
    logger.error('Failed to query health data access logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filters,
    });
    return [];
  }
}

/**
 * Export health data access logs for compliance reporting
 * 
 * @param userId - User ID to export logs for
 * @returns CSV format logs
 */
export async function exportHealthDataAccessLogs(userId: string): Promise<string> {
  const logs = await queryHealthDataAccessLogs({ userId });

  const csv = [
    'Timestamp,Action,Booking ID,IP Address,User Agent',
    ...logs.map((log: any) =>
      [
        log.timestamp.toISOString(),
        log.action,
        log.resourceId,
        log.ipAddress || '',
        log.userAgent || '',
      ].join(',')
    ),
  ].join('\n');

  return csv;
}
