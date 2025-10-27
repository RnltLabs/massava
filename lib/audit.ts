/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Audit Logging for GDPR Compliance
 * Implements STRATEGY.md Section 4.1 (Audit Log)
 */

import { PrismaClient } from '@/app/generated/prisma';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export type AuditAction =
  // User actions
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_DATA_EXPORTED'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_VERIFIED'
  // Booking actions
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_UPDATED'
  // Studio actions
  | 'STUDIO_CREATED'
  | 'STUDIO_UPDATED'
  | 'STUDIO_DELETED'
  | 'STUDIO_SUSPENDED'
  // Service actions
  | 'SERVICE_CREATED'
  | 'SERVICE_UPDATED'
  | 'SERVICE_DELETED'
  // GDPR actions
  | 'HEALTH_CONSENT_GIVEN'
  | 'HEALTH_CONSENT_WITHDRAWN'
  | 'DATA_EXPORT_REQUESTED'
  | 'ACCOUNT_DELETION_REQUESTED';

export type AuditResource =
  | 'user'
  | 'booking'
  | 'studio'
  | 'service'
  | 'system';

/**
 * Anonymize IP address by hashing the last octet
 * GDPR Art. 32 - Security of processing
 */
function anonymizeIP(ip: string): string {
  if (!ip) return 'unknown';

  // For IPv4: Replace last octet with 0
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }

  // For IPv6: Keep first 64 bits, zero the rest
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }

  return 'unknown';
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  metadata,
  request,
}: {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}): Promise<void> {
  try {
    const ipAddress = request
      ? anonymizeIP(
          request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'
        )
      : undefined;

    const userAgent = request
      ? request.headers.get('user-agent') || undefined
      : undefined;

    await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action,
        resource,
        resourceId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw on audit log failure - just log the error
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 50
): Promise<unknown[]> {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      metadata: true,
      createdAt: true,
      // Exclude ipAddress and userAgent for privacy
    },
  });
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resource: AuditResource,
  resourceId: string,
  limit = 50
): Promise<unknown[]> {
  return prisma.auditLog.findMany({
    where: { resource, resourceId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Clean up old audit logs (GDPR retention policy)
 * Keep logs for 3 years, then delete
 */
export async function cleanupOldAuditLogs(): Promise<number> {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: threeYearsAgo,
      },
    },
  });

  return result.count;
}

/**
 * Export audit logs for GDPR data export request
 */
export async function exportUserAuditLogs(userId: string): Promise<unknown[]> {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      metadata: true,
      createdAt: true,
      // Include anonymized IP for transparency
      ipAddress: true,
    },
  });
}
