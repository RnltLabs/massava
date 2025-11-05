/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR Art. 15 - Right to Data Portability
 * Export all user data in JSON format
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const session = await auth();

    if (!session?.user?.email) {
      logger.warn('Unauthorized data export attempt', {
        correlationId,
        ipAddress,
        action: 'EXPORT_USER_DATA',
        resource: 'user',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Fetch unified User data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedStudios: {
          include: {
            studio: {
              include: {
                services: true,
                newBookings: {
                  select: {
                    id: true,
                    customerName: true,
                    customerEmail: true,
                    customerPhone: true,
                    preferredDate: true,
                    preferredTime: true,
                    status: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
        newAccounts: {
          select: {
            provider: true,
            type: true,
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
                phone: true,
                email: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      logger.warn('Data export failed: User not found', {
        correlationId,
        ipAddress,
        email,
        action: 'EXPORT_USER_DATA',
        resource: 'user',
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build export data structure
    const exportData = {
      exportDate: new Date().toISOString(),
      gdprArticle: 'Art. 15 GDPR - Right to Access',
      format: 'JSON',
      dataController: {
        name: 'RNLT Labs / Massava',
        email: 'datenschutz@massava.com',
      },
      personalData: {
        userType: 'user',
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        primaryRole: user.primaryRole,
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt,
        oauthProviders: user.newAccounts.map((acc) => acc.provider),
      },
      bookings: user.newBookings.map((booking) => ({
        id: booking.id,
        studio: booking.studio,
        service: booking.service,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
        message: booking.message,
        status: booking.status,
        healthDataConsent: booking.explicitHealthConsent,
        healthDataConsentGivenAt: booking.healthConsentGivenAt,
        createdAt: booking.createdAt,
      })),
      studios: user.ownedStudios.map((ownership) => ({
        id: ownership.studio.id,
        name: ownership.studio.name,
        description: ownership.studio.description,
        address: ownership.studio.address,
        city: ownership.studio.city,
        postalCode: ownership.studio.postalCode,
        phone: ownership.studio.phone,
        email: ownership.studio.email,
        services: ownership.studio.services,
        bookingsCount: ownership.studio.newBookings.length,
        createdAt: ownership.studio.createdAt,
      })),
    };

    logger.info('User data exported successfully', {
      correlationId,
      ipAddress,
      userAgent,
      email,
      userId: user.id,
      action: 'EXPORT_USER_DATA',
      resource: 'user',
      userType: 'user',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `massava-datenexport-${timestamp}.json`;

    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Data export failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'EXPORT_USER_DATA',
      resource: 'user',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Datenexport fehlgeschlagen. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}
