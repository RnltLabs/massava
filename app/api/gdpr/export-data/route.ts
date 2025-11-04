/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR Data Export API - Art. 15 (Right of Access)
 * Allows users to export all their personal data
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { createAuditLog, exportUserAuditLogs } from '@/lib/audit';
import { z } from 'zod';

const prisma = new PrismaClient();

// Request validation schema
const ExportRequestSchema = z.object({
  userId: z.string().cuid(),
  format: z.enum(['json', 'csv', 'zip']).optional().default('json'),
});

// Rate limiting (simple implementation - can be enhanced)
const exportRequests = new Map<string, number>();
const RATE_LIMIT = 3; // Max 3 exports per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * Check if user has exceeded export rate limit
 */
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const lastRequest = exportRequests.get(userId);

  if (!lastRequest || now - lastRequest > RATE_LIMIT_WINDOW) {
    exportRequests.set(userId, now);
    return false;
  }

  return true;
}

/**
 * Export user's personal data (GDPR Art. 15)
 * POST /api/gdpr/export-data
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = ExportRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid export data request', {
        correlationId,
        errors: validation.error.errors,
        action: 'GDPR_EXPORT_DATA',
      });

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { userId, format } = validation.data;

    // TODO: Verify authentication - user can only export their own data
    // This should be implemented with your authentication system
    // For now, assuming authentication is handled by middleware
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.id !== userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Rate limiting
    if (isRateLimited(userId)) {
      logger.warn('Data export rate limit exceeded', {
        correlationId,
        userId,
        action: 'GDPR_EXPORT_DATA',
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You can only export your data 3 times per hour',
        },
        { status: 429 }
      );
    }

    logger.info('Starting data export', {
      correlationId,
      userId,
      format,
      action: 'GDPR_EXPORT_DATA',
    });

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        newAccounts: true,
        newSessions: true,
        roles: {
          include: {
            studio: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        ownedStudios: {
          include: {
            studio: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        newBookings: {
          include: {
            studio: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
              },
            },
          },
        },
        newFavorites: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn('User not found for data export', {
        correlationId,
        userId,
        action: 'GDPR_EXPORT_DATA',
      });

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get audit logs (anonymized)
    const auditLogs = await exportUserAuditLogs(userId);

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportFormat: format,
      gdprArticle: 'Article 15 - Right of Access',
      userData: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        image: user.image,
        emailVerified: user.emailVerified,
        primaryRole: user.primaryRole,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accounts: user.newAccounts.map(account => ({
        id: account.id,
        provider: account.provider,
        type: account.type,
        // Don't export sensitive tokens
      })),
      sessions: user.newSessions.map(session => ({
        id: session.id,
        expires: session.expires,
        // Don't export session tokens
      })),
      roles: user.roles.map(role => ({
        role: role.role,
        studioId: role.studioId,
        studioName: role.studio?.name,
        grantedAt: role.grantedAt,
        expiresAt: role.expiresAt,
      })),
      ownedStudios: user.ownedStudios.map(ownership => ({
        studioId: ownership.studioId,
        studioName: ownership.studio.name,
        studioAddress: ownership.studio.address,
        studioCity: ownership.studio.city,
        canTransfer: ownership.canTransfer,
        acceptedAt: ownership.acceptedAt,
      })),
      bookings: user.newBookings.map(booking => ({
        id: booking.id,
        studioName: booking.studio.name,
        studioAddress: booking.studio.address,
        serviceName: booking.service?.name,
        servicePrice: booking.service?.price,
        serviceDuration: booking.service?.duration,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
        message: booking.message,
        status: booking.status,
        explicitHealthConsent: booking.explicitHealthConsent,
        healthConsentGivenAt: booking.healthConsentGivenAt,
        healthConsentWithdrawnAt: booking.healthConsentWithdrawnAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      })),
      favorites: user.newFavorites.map(studio => ({
        id: studio.id,
        name: studio.name,
        address: studio.address,
        city: studio.city,
      })),
      auditLogs: auditLogs,
    };

    // Create audit log for this export
    await createAuditLog({
      userId,
      action: 'DATA_EXPORT_REQUESTED',
      resource: 'user',
      resourceId: userId,
      metadata: {
        format,
        dataSize: JSON.stringify(exportData).length,
      },
      request,
    });

    logger.info('Data export completed', {
      correlationId,
      userId,
      format,
      dataSize: JSON.stringify(exportData).length,
      action: 'GDPR_EXPORT_DATA',
    });

    // Return data in requested format
    if (format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="massava-data-export-${userId}-${Date.now()}.json"`,
        },
      });
    } else if (format === 'csv') {
      // Simple CSV conversion (can be enhanced)
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="massava-data-export-${userId}-${Date.now()}.csv"`,
        },
      });
    } else {
      // ZIP format (future implementation)
      return NextResponse.json(
        { error: 'ZIP format not yet implemented' },
        { status: 501 }
      );
    }
  } catch (error) {
    logger.error('Data export failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'GDPR_EXPORT_DATA',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * Convert export data to CSV format
 * Simple implementation - can be enhanced with a proper CSV library
 */
function convertToCSV(data: unknown): string {
  const sections: string[] = [];

  sections.push('# Massava Data Export - GDPR Article 15\n');
  sections.push(`# Export Date: ${new Date().toISOString()}\n\n`);

  // Convert nested objects to CSV sections
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      sections.push(`## ${key}\n`);

      if (Array.isArray(value)) {
        // Convert array to CSV table
        if (value.length > 0) {
          const headers = Object.keys(value[0]);
          sections.push(headers.join(',') + '\n');

          for (const item of value) {
            const row = headers
              .map(h => {
                const val = item[h];
                return val !== null && val !== undefined
                  ? JSON.stringify(val)
                  : '';
              })
              .join(',');
            sections.push(row + '\n');
          }
        } else {
          sections.push('(No data)\n');
        }
      } else if (typeof value === 'object' && value !== null) {
        // Convert object to key-value pairs
        for (const [k, v] of Object.entries(value)) {
          sections.push(`${k},${JSON.stringify(v)}\n`);
        }
      } else {
        sections.push(`${JSON.stringify(value)}\n`);
      }

      sections.push('\n');
    }
  }

  return sections.join('');
}

/**
 * GET method not allowed
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use POST to export data',
    },
    { status: 405 }
  );
}
