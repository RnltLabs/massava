/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { filterStudiosByRadius } from '@/lib/geolocation';
import { filterServicesByType } from '@/lib/utils/serviceMatching';
import { getMinPrice, filterServicesByPrice } from '@/lib/utils/priceAggregation';
import type { ServiceType } from '@/lib/constants/serviceTypes';

/**
 * Search Query Schema
 */
const SearchQuerySchema = z.object({
  location: z.string().min(2),
  lat: z.string().transform(Number).pipe(z.number()),
  lng: z.string().transform(Number).pipe(z.number()),
  radius: z.string().transform(Number).pipe(z.number().min(1).max(100)),
  datetime: z.string().optional(), // Accept ISO string, will be validated when parsing to Date
  serviceType: z.string().optional(), // Accept any string, validation happens in filterServicesByType
  minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
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
 * - serviceType: string (optional, e.g., "Thai-Massage")
 * - minPrice: number (optional, minimum price filter in EUR)
 * - maxPrice: number (optional, maximum price filter in EUR)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      location: searchParams.get('location') ?? undefined,
      lat: searchParams.get('lat') ?? undefined,
      lng: searchParams.get('lng') ?? undefined,
      radius: searchParams.get('radius') ?? undefined,
      datetime: searchParams.get('datetime') ?? undefined,
      serviceType: searchParams.get('serviceType') ?? undefined,
      minPrice: searchParams.get('minPrice') ?? undefined,
      maxPrice: searchParams.get('maxPrice') ?? undefined,
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

    const { lat, lng, radius, datetime, serviceType, minPrice, maxPrice } = validationResult.data;

    // Validate that datetime is in the future (if provided)
    if (datetime) {
      const requestedDateTime = new Date(datetime);
      const now = new Date();

      if (requestedDateTime < now) {
        return NextResponse.json(
          {
            error: 'Invalid datetime',
            message: 'Cannot search for appointments in the past. Please select a future date and time.',
          },
          { status: 400 }
        );
      }
    }

    // Fetch all studios with their time slots
    const studios = await prisma.studio.findMany({
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
                    // Filter: Only slots on the same day
                    lte: new Date(new Date(datetime).setHours(23, 59, 59, 999)),
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

    // Apply service type and price filters
    const filteredStudios = studiosWithAvailableSlots
      .map((studio) => {
        // Filter services by type (if specified)
        const matchedServices = filterServicesByType(studio.services, serviceType as ServiceType | undefined);

        // Filter services by price range (if specified)
        const priceFilteredServices = filterServicesByPrice(
          matchedServices,
          minPrice,
          maxPrice
        );

        // Calculate minimum price from matched services
        const studioMinPrice = getMinPrice(priceFilteredServices);

        return {
          ...studio,
          matchedServices: priceFilteredServices,
          minPrice: studioMinPrice,
        };
      })
      // Filter out studios with no matching services
      .filter((studio) => studio.matchedServices.length > 0);

    // Format response
    const results = filteredStudios.map((studio) => ({
      id: studio.id,
      name: studio.name,
      description: studio.description,
      logoUrl: studio.logoUrl,
      galleryImages: studio.galleryImages,
      address: studio.address,
      city: studio.city,
      postalCode: studio.postalCode,
      phone: studio.phone,
      email: studio.email,
      website: studio.website,
      openingHours: studio.openingHours,
      latitude: studio.latitude,
      longitude: studio.longitude,
      distance: Math.round(studio.distance * 10) / 10, // Round to 1 decimal
      services: studio.services,
      matchedServices: studio.matchedServices,
      minPrice: studio.minPrice,
      averageRating: studio.averageRating,
      totalReviews: studio.totalReviews,
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
        filters: {
          ...(serviceType && { serviceType }),
          ...(minPrice !== undefined && { minPrice }),
          ...(maxPrice !== undefined && { maxPrice }),
        },
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
