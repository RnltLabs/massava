/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { bookingSchema } from '@/lib/validation';
import { bookingRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';

const prisma = new PrismaClient();

// Art. 9 GDPR - Health consent text
const HEALTH_CONSENT_TEXT = `Ich willige ausdrücklich ein, dass meine im Nachrichtenfeld angegebenen Informationen (die möglicherweise Gesundheitsdaten enthalten) zum Zweck der Massage-Behandlung an das Studio weitergegeben und verarbeitet werden. Diese Einwilligung kann ich jederzeit per E-Mail an datenschutz@massava.com widerrufen.`;

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

    // Create booking with GDPR-compliant health data handling
    const booking = await prisma.booking.create({
      data: {
        studioId,
        serviceId: serviceId || null,
        customerName,
        customerEmail,
        customerPhone,
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

    // TODO: Send email notification to studio
    // This will be implemented in the next step with Resend

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
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
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
