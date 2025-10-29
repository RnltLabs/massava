/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Bookings API - Unified User Model
 * Phase 3: RBAC + Automatic User Creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@/app/generated/prisma';
import { bookingSchema } from '@/lib/validation';
import { bookingRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/permissions';
import { generateMagicLink } from '@/lib/magic-link';

const prisma = new PrismaClient();

// Art. 9 GDPR - Health consent text
const HEALTH_CONSENT_TEXT = `Ich willige ausdrücklich ein, dass meine im Nachrichtenfeld angegebenen Informationen (die möglicherweise Gesundheitsdaten enthalten) zum Zweck der Massage-Behandlung an das Studio weitergegeben und verarbeitet werden. Diese Einwilligung kann ich jederzeit per E-Mail an datenschutz@massava.com widerrufen.`;

/**
 * POST /api/bookings
 * Create a new booking (guest or authenticated)
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Rate limiting: 10 bookings per hour per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = bookingRateLimit(clientIp);

    if (!rateLimitResult.success) {
      logger.warn('Booking rate limit exceeded', {
        correlationId,
        ipAddress,
        action: 'CREATE_BOOKING',
        resource: 'booking',
      });
      return NextResponse.json(
        rateLimitErrorResponse(rateLimitResult),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await request.json();

    // Validate with Zod schema (includes Art. 9 GDPR validation)
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Booking validation failed', {
        correlationId,
        ipAddress,
        action: 'CREATE_BOOKING',
        resource: 'booking',
        errors: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json(
        {
          error: 'Validierungsfehler',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      studioId,
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      preferredDate,
      preferredTime,
      message,
      explicitHealthConsent,
    } = validation.data;

    // Art. 9 GDPR: If message contains potential health data, explicit consent is required
    const hasMessage = message && message.trim().length > 0;

    if (hasMessage && !explicitHealthConsent) {
      logger.warn('Art. 9 GDPR violation: Health consent missing', {
        correlationId,
        ipAddress,
        email: customerEmail,
        action: 'CREATE_BOOKING',
        resource: 'booking',
        gdprViolation: 'ART_9_MISSING_CONSENT',
      });
      return NextResponse.json(
        {
          error: 'Ausdrückliche Einwilligung zur Verarbeitung von Gesundheitsdaten erforderlich (Art. 9 DSGVO)',
        },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    let customerId: string;
    let isNewUser = false;

    if (currentUser) {
      // Authenticated user - use their ID
      customerId = currentUser.id;
    } else {
      // Guest booking - create passwordless user account
      let user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      if (!user) {
        // Create passwordless account
        user = await prisma.user.create({
          data: {
            email: customerEmail,
            name: customerName,
            phone: customerPhone || null,
            password: null, // Passwordless
            primaryRole: UserRole.CUSTOMER,
            emailVerified: null, // Will be verified via magic link
          },
        });

        // Create role assignment
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            role: UserRole.CUSTOMER,
            grantedBy: 'GUEST_BOOKING',
          },
        });

        isNewUser = true;

        logger.info('Passwordless user account created', {
          correlationId,
          ipAddress,
          email: customerEmail,
          action: 'USER_CREATED',
          resource: 'user',
          resourceId: user.id,
          via: 'guest_booking',
        });
      }

      customerId = user.id;
    }

    // Create booking with GDPR-compliant health data handling
    const booking = await prisma.newBooking.create({
      data: {
        studioId,
        serviceId: serviceId || null,
        customerId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        preferredDate,
        preferredTime,
        message: message || null,
        status: 'PENDING',
        // Art. 9 GDPR compliance fields
        explicitHealthConsent: hasMessage ? explicitHealthConsent : null,
        healthConsentGivenAt: hasMessage && explicitHealthConsent ? new Date() : null,
        healthConsentText: hasMessage && explicitHealthConsent ? HEALTH_CONSENT_TEXT : null,
      },
      include: {
        studio: true,
        service: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: customerId,
      action: 'BOOKING_CREATED',
      resource: 'booking',
      resourceId: booking.id,
      metadata: {
        studioId,
        hasHealthData: hasMessage,
        isNewUser,
        authMethod: currentUser ? 'authenticated' : 'guest',
      },
      request,
    });

    // Health consent audit log
    if (hasMessage && explicitHealthConsent) {
      await createAuditLog({
        userId: customerId,
        action: 'HEALTH_CONSENT_GIVEN',
        resource: 'booking',
        resourceId: booking.id,
        metadata: {
          consentText: HEALTH_CONSENT_TEXT,
          givenAt: new Date().toISOString(),
        },
        request,
      });
    }

    logger.info('Booking created successfully', {
      correlationId,
      ipAddress,
      userAgent,
      email: customerEmail,
      action: 'CREATE_BOOKING',
      resource: 'booking',
      resourceId: booking.id,
      studioId,
      hasHealthData: hasMessage,
      isNewUser,
    });

    // Generate magic link for guest users
    let magicLink: string | undefined;
    if (!currentUser) {
      magicLink = await generateMagicLink(customerEmail);
    }

    // TODO: Send email notification with booking confirmation + magic link
    // This will be implemented with email service integration

    return NextResponse.json(
      {
        success: true,
        booking,
        message: isNewUser
          ? 'Buchung erfolgreich! Wir haben Ihnen eine E-Mail mit einem Link zur Verwaltung Ihrer Buchung gesendet.'
          : 'Buchung erfolgreich!',
        // In development, include magic link for testing
        ...(process.env.NODE_ENV === 'development' && magicLink && { magicLink }),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Booking creation failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'CREATE_BOOKING',
      resource: 'booking',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Buchung fehlgeschlagen. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * Get bookings (role-based access)
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    // SUPER_ADMIN can see all bookings
    if (currentUser.primaryRole === UserRole.SUPER_ADMIN) {
      const bookings = await prisma.newBooking.findMany({
        include: {
          studio: true,
          service: true,
          customer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ bookings });
    }

    // STUDIO_OWNER can see bookings for their studios
    if (currentUser.primaryRole === UserRole.STUDIO_OWNER) {
      const ownerships = await prisma.studioOwnership.findMany({
        where: { userId: currentUser.id },
        select: { studioId: true },
      });

      const studioIds = ownerships.map((o) => o.studioId);

      const bookings = await prisma.newBooking.findMany({
        where: {
          studioId: { in: studioIds },
        },
        include: {
          studio: true,
          service: true,
          customer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ bookings });
    }

    // CUSTOMER can see their own bookings
    const bookings = await prisma.newBooking.findMany({
      where: { customerId: currentUser.id },
      include: {
        studio: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info('Bookings retrieved', {
      correlationId,
      ipAddress,
      userId: currentUser.id,
      role: currentUser.primaryRole,
      count: bookings.length,
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    logger.error('Booking retrieval failed', {
      correlationId,
      ipAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Abrufen fehlgeschlagen' },
      { status: 500 }
    );
  }
}
