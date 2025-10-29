/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR Art. 15 - Right to Data Portability
 * Export all user data in JSON format
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth-unified';
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

    // Check if user is a customer or studio owner
    const customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        bookings: {
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
        favorites: {
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
    });

    const studioOwner = await prisma.studioOwner.findUnique({
      where: { email },
      include: {
        studios: {
          include: {
            services: true,
            bookings: {
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
        accounts: {
          select: {
            provider: true,
            type: true,
          },
        },
      },
    });

    if (!customer && !studioOwner) {
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
      personalData: customer
        ? {
            userType: 'customer',
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            emailVerified: customer.emailVerified,
            accountCreated: customer.createdAt,
            lastUpdated: customer.updatedAt,
          }
        : {
            userType: 'studioOwner',
            id: studioOwner!.id,
            name: studioOwner!.name,
            email: studioOwner!.email,
            emailVerified: studioOwner!.emailVerified,
            accountCreated: studioOwner!.createdAt,
            lastUpdated: studioOwner!.updatedAt,
            oauthProviders: studioOwner!.accounts.map((acc) => acc.provider),
          },
      bookings: customer
        ? customer.bookings.map((booking) => ({
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
          }))
        : [],
      favorites: customer
        ? customer.favorites.map((studio) => ({
            id: studio.id,
            name: studio.name,
            address: studio.address,
            city: studio.city,
            phone: studio.phone,
            email: studio.email,
          }))
        : [],
      studios: studioOwner
        ? studioOwner.studios.map((studio) => ({
            id: studio.id,
            name: studio.name,
            description: studio.description,
            address: studio.address,
            city: studio.city,
            postalCode: studio.postalCode,
            phone: studio.phone,
            email: studio.email,
            services: studio.services,
            bookingsCount: studio.bookings.length,
            createdAt: studio.createdAt,
          }))
        : [],
    };

    logger.info('User data exported successfully', {
      correlationId,
      ipAddress,
      userAgent,
      email,
      userId: customer?.id || studioOwner!.id,
      action: 'EXPORT_USER_DATA',
      resource: 'user',
      userType: customer ? 'customer' : 'studioOwner',
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
