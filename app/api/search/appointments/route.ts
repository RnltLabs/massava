/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { filterStudiosByRadius } from '@/lib/geolocation';

/**
 * Search Query Schema
 */
const SearchQuerySchema = z.object({
  location: z.string().min(2),
  lat: z.string().transform(Number).pipe(z.number()),
  lng: z.string().transform(Number).pipe(z.number()),
  radius: z.string().transform(Number).pipe(z.number().min(1).max(100)),
  datetime: z.string().datetime().optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/**
 * GET /api/search/appointments
 *
 * Search for available appointment slots across all studios
 * within a specified radius and time range.
 *
 * Query Parameters:
 * - location: string (city name or postal code)
 * - lat: number (latitude)
 * - lng: number (longitude)
 * - radius: number (search radius in km)
 * - datetime: string (optional, ISO datetime)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      location: searchParams.get('location'),
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      radius: searchParams.get('radius'),
      datetime: searchParams.get('datetime'),
    };

    const validationResult = SearchQuerySchema.safeParse(queryData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { lat, lng, radius, datetime } = validationResult.data;

    // Fetch all studios with their time slots
    const studios = await db.studio.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
          },
        },
        timeSlots: {
          where: {
            isAvailable: true,
            isBooked: false,
            ...(datetime
              ? {
                  startTime: {
                    gte: new Date(datetime),
                  },
                }
              : {
                  startTime: {
                    gte: new Date(), // Only future slots
                  },
                }),
          },
          orderBy: {
            startTime: 'asc',
          },
          take: 10, // Limit to 10 slots per studio
          include: {
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
      },
    });

    // Filter studios by radius and calculate distance
    const studiosWithDistance = filterStudiosByRadius(
      studios,
      { lat, lng },
      radius
    );

    // Filter only studios with available slots
    const studiosWithAvailableSlots = studiosWithDistance.filter(
      (studio) => studio.timeSlots.length > 0
    );

    // Format response
    const results = studiosWithAvailableSlots.map((studio) => ({
      id: studio.id,
      name: studio.name,
      description: studio.description,
      address: studio.address,
      city: studio.city,
      postalCode: studio.postalCode,
      phone: studio.phone,
      email: studio.email,
      distance: Math.round(studio.distance * 10) / 10, // Round to 1 decimal
      services: studio.services,
      availableSlots: studio.timeSlots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        service: slot.service
          ? {
              id: slot.service.id,
              name: slot.service.name,
              price: slot.service.price,
              duration: slot.service.duration,
            }
          : null,
      })),
    }));

    return NextResponse.json({
      success: true,
      results,
      meta: {
        total: results.length,
        radius,
        center: { lat, lng },
      },
    });
  } catch (error) {
    console.error('Appointment search error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
