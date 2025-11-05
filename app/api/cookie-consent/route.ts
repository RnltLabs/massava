/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Consent API Route
 * Saves user consent preferences for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookieConsentSchema } from '@/lib/validations/cookie-consent';
import { z } from 'zod';

/**
 * POST /api/cookie-consent
 * Save cookie consent preferences
 *
 * This endpoint logs consent for audit trail purposes.
 * The actual consent state is stored client-side in localStorage.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = cookieConsentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid consent data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const consent = validationResult.data;

    // Log consent for audit trail
    // In production, you might want to:
    // 1. Store in database with user IP (anonymized)
    // 2. Send to analytics service
    // 3. Trigger compliance monitoring
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    console.log('Cookie consent saved:', {
      timestamp: consent.timestamp,
      analytics: consent.analytics,
      marketing: consent.marketing,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // Optional: Store in database for compliance audit
    // await prisma.cookieConsent.create({
    //   data: {
    //     analytics: consent.analytics,
    //     marketing: consent.marketing,
    //     timestamp: new Date(consent.timestamp),
    //     ipAddress: anonymizeIp(request.ip),
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Consent preferences saved successfully',
    });
  } catch (error) {
    console.error('Error saving cookie consent:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save consent preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cookie-consent
 * Retrieve current consent status (for logged-in users)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // This endpoint could be used to sync consent across devices
  // for authenticated users. For now, we rely on localStorage.
  return NextResponse.json({
    success: true,
    message: 'Consent is stored client-side in localStorage',
    storageKey: 'cookie-consent',
  });
}

/**
 * Helper function to anonymize IP addresses for GDPR compliance
 * Removes last octet of IPv4 or last 80 bits of IPv6
 */
function anonymizeIp(ip: string | null): string {
  if (!ip) return 'unknown';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }

  return 'unknown';
}
