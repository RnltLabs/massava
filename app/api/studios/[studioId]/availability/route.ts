/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Availability API
 *
 * GET endpoint for retrieving available time slots for a specific studio.
 * Supports dynamic slot calculation with filtering options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateAvailableSlots } from '@/lib/slots';
import { logger, generateCorrelationId } from '@/lib/logger';

/**
 * Availability Query Schema
 */
const AvailabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat (YYYY-MM-DD)')
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Datum darf nicht in der Vergangenheit liegen'),
  serviceId: z.string().cuid('Ungültige Service-ID').optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat (HH:mm)')
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Ungültiges Zeitformat (HH:mm)')
    .optional(),
  includeUnavailable: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  minCapacity: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional(),
});

/**
 * GET /api/studios/[studioId]/availability
 *
 * Retrieve available time slots for a studio on a specific date.
 *
 * Query Parameters:
 * - date: string (required, YYYY-MM-DD format)
 * - serviceId: string (optional, filter by service)
 * - startTime: string (optional, filter slots >= this time, HH:mm format)
 * - endTime: string (optional, filter slots <= this time, HH:mm format)
 * - includeUnavailable: boolean (optional, include unavailable slots in results)
 * - minCapacity: number (optional, minimum required capacity, default: 1)
 *
 * Response:
 * {
 *   success: true,
 *   studioId: string,
 *   date: string,
 *   slots: Array<{
 *     startTime: string,
 *     endTime: string,
 *     available: boolean,
 *     remainingCapacity: number,
 *     reason?: string
 *   }>,
 *   meta: {
 *     totalSlots: number,
 *     availableSlots: number,
 *     filters: object
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
): Promise<NextResponse> {
  const correlationId = generateCorrelationId()

  try {
    const { studioId } = await params;

    // Validate studioId format
    if (!studioId || typeof studioId !== 'string') {
      return NextResponse.json(
        {
          error: 'Ungültige Studio-ID',
          message: 'Studio-ID muss angegeben werden',
        },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      date: searchParams.get('date') ?? undefined,
      serviceId: searchParams.get('serviceId') ?? undefined,
      startTime: searchParams.get('startTime') ?? undefined,
      endTime: searchParams.get('endTime') ?? undefined,
      includeUnavailable: searchParams.get('includeUnavailable') ?? undefined,
      minCapacity: searchParams.get('minCapacity') ?? undefined,
    };

    const validationResult = AvailabilityQuerySchema.safeParse(queryData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Ungültige Query-Parameter',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { date, serviceId, startTime, endTime, includeUnavailable, minCapacity } =
      validationResult.data;

    // Calculate available slots
    const slotsResult = await calculateAvailableSlots(studioId, date, serviceId, {
      includeUnavailable: includeUnavailable ?? false,
      minCapacity: minCapacity ?? 1,
    });

    if (!slotsResult.ok) {
      const error = slotsResult.error;

      // Map error types to HTTP status codes
      if (error.type === 'STUDIO_NOT_FOUND') {
        return NextResponse.json(
          {
            error: 'Studio nicht gefunden',
            message: `Studio mit ID ${studioId} existiert nicht`,
          },
          { status: 404 }
        );
      }

      if (error.type === 'INVALID_DATE') {
        return NextResponse.json(
          {
            error: 'Ungültiges Datum',
            message: 'Das angegebene Datum ist ungültig',
          },
          { status: 400 }
        );
      }

      if (error.type === 'INVALID_OPENING_HOURS') {
        return NextResponse.json(
          {
            error: 'Ungültige Öffnungszeiten',
            message: 'Die Öffnungszeiten für dieses Studio sind ungültig konfiguriert',
          },
          { status: 500 }
        );
      }

      // Generic database error
      return NextResponse.json(
        {
          error: 'Datenbankfehler',
          message: error.type === 'DATABASE_ERROR' ? error.message : 'Unbekannter Fehler',
        },
        { status: 500 }
      );
    }

    let slots = slotsResult.value;

    // Apply time range filters if provided
    if (startTime || endTime) {
      slots = slots.filter((slot) => {
        if (startTime && slot.startTime < startTime) {
          return false;
        }
        if (endTime && slot.startTime > endTime) {
          return false;
        }
        return true;
      });
    }

    // Calculate stats
    const totalSlots = slots.length;
    const availableSlots = slots.filter((s) => s.available).length;

    return NextResponse.json({
      success: true,
      studioId,
      date,
      slots,
      meta: {
        totalSlots,
        availableSlots,
        filters: {
          ...(serviceId && { serviceId }),
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
          ...(includeUnavailable !== undefined && { includeUnavailable }),
          ...(minCapacity !== undefined && { minCapacity }),
        },
      },
    });
  } catch (error) {
    logger.error('Availability API error', {
      correlationId,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return NextResponse.json(
      {
        error: 'Fehler beim Abrufen der Verfügbarkeit',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}
