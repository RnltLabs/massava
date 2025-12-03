/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateHaversineDistance } from '@/lib/geo/haversine';
import { getBoundingBox } from '@/lib/geo/bounding-box';
import { filterServicesByType } from '@/lib/utils/serviceMatching';
import { getMinPrice } from '@/lib/utils/priceAggregation';
import type { ServiceType } from '@/lib/constants/serviceTypes';
import { calculateAvailableSlots, type AvailableSlot } from '@/lib/slots';
import { logger, generateCorrelationId } from '@/lib/logger';

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
  sort: z.enum(['distance', 'price', 'rating']).optional().default('distance'),
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
 * - sort: string (optional, 'distance' | 'price' | 'rating', default: 'distance')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId()

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
      sort: searchParams.get('sort') ?? undefined,
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

    const { lat, lng, radius, datetime, serviceType, sort } = validationResult.data;

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

    // Calculate bounding box for efficient geo-filtering
    const boundingBox = getBoundingBox(lat, lng, radius);

    // Fetch studios within bounding box ONLY (geo-optimized query)
    // This reduces data transfer by 80-98% by filtering at database level
    const studios = await prisma.studio.findMany({
      where: {
        // Geo-bounding box filter (uses composite index on city, latitude, longitude)
        latitude: {
          gte: boundingBox.minLat,
          lte: boundingBox.maxLat,
          not: null,
        },
        longitude: {
          gte: boundingBox.minLng,
          lte: boundingBox.maxLng,
          not: null,
        },
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
      },
    });

    // Precise Haversine distance calculation and filtering
    // Filter out studios outside exact radius (bounding box is approximate)
    const studiosWithDistance = studios
      .filter((studio) => studio.latitude !== null && studio.longitude !== null)
      .map((studio) => ({
        ...studio,
        distance: calculateHaversineDistance(
          { lat, lng },
          {
            lat: studio.latitude!,
            lng: studio.longitude!,
          }
        ),
      }))
      .filter((studio) => studio.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Calculate date for dynamic slots
    const searchDate = datetime
      ? new Date(datetime).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Calculate dynamic availability for each studio in parallel
    const studiosWithSlotsResults = await Promise.all(
      studiosWithDistance.map(async (studio) => {
        try {
          logger.info('Calculating slots for studio', {
            correlationId,
            studioId: studio.id,
            studioName: studio.name,
            searchDate,
            timezone: studio.timezone,
          });

          const slotsResult = await calculateAvailableSlots(
            studio.id,
            searchDate,
            serviceType ? undefined : undefined, // Service filtering happens later
            { includeUnavailable: false, minCapacity: 1 }
          );

          if (!slotsResult.ok) {
            logger.error('Failed to calculate slots for studio', {
              correlationId,
              studioId: studio.id,
              studioName: studio.name,
              errorType: slotsResult.error.type,
            });
            return { ...studio, availableSlots: [] as AvailableSlot[] };
          }

          logger.info('Slot calculation succeeded for studio', {
            correlationId,
            studioId: studio.id,
            studioName: studio.name,
            totalSlots: slotsResult.value.length,
            availableSlots: slotsResult.value.filter(s => s.available).length,
          });

          // Limit to 10 slots per studio for performance
          const limitedSlots = slotsResult.value.slice(0, 10);
          return { ...studio, availableSlots: limitedSlots };
        } catch (error) {
          logger.error('Error calculating slots for studio', {
            correlationId,
            studioId: studio.id,
            studioName: studio.name,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          return { ...studio, availableSlots: [] as AvailableSlot[] };
        }
      })
    );

    // Filter only studios with available slots
    const studiosWithAvailableSlots = studiosWithSlotsResults.filter(
      (studio) => studio.availableSlots.length > 0
    );

    logger.info('Filtered studios with available slots', {
      correlationId,
      totalStudiosInRadius: studiosWithDistance.length,
      studiosWithSlots: studiosWithAvailableSlots.length,
      studiosFiltered: studiosWithDistance.length - studiosWithAvailableSlots.length,
    });

    // Apply service type filter
    const filteredStudios = studiosWithAvailableSlots
      .map((studio) => {
        // Filter services by type (if specified)
        const matchedServices = filterServicesByType(studio.services, serviceType as ServiceType | undefined);

        // Calculate minimum price from matched services
        const studioMinPrice = getMinPrice(matchedServices);

        return {
          ...studio,
          matchedServices,
          minPrice: studioMinPrice,
        };
      })
      // Filter out studios with no matching services
      .filter((studio) => studio.matchedServices.length > 0);

    // Apply sorting based on sort parameter
    const sortedStudios = [...filteredStudios].sort((a, b) => {
      switch (sort) {
        case 'price':
          // Sort by minimum price (lowest first), null prices go last
          const priceA = a.minPrice ?? Infinity;
          const priceB = b.minPrice ?? Infinity;
          return priceA - priceB;
        case 'rating':
          // Sort by rating (highest first), null ratings go last
          const ratingA = a.averageRating ?? 0;
          const ratingB = b.averageRating ?? 0;
          return ratingB - ratingA;
        case 'distance':
        default:
          // Sort by distance (closest first) - already sorted
          return a.distance - b.distance;
      }
    });

    // Format response with dynamic slots
    const results = sortedStudios.map((studio) => ({
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
      timezone: studio.timezone, // CRITICAL: Required for slot time formatting
      distance: Math.round(studio.distance * 10) / 10, // Round to 1 decimal
      services: studio.services,
      matchedServices: studio.matchedServices,
      minPrice: studio.minPrice,
      averageRating: studio.averageRating,
      totalReviews: studio.totalReviews,
      availableSlots: studio.availableSlots.map((slot) => ({
        // Dynamic slots format (DateTime-based API returns Date objects)
        startTime: typeof slot.startTime === 'string'
          ? `${searchDate}T${slot.startTime}:00.000Z`
          : slot.startTime.toISOString(),
        endTime: typeof slot.endTime === 'string'
          ? `${searchDate}T${slot.endTime}:00.000Z`
          : slot.endTime.toISOString(),
        remainingCapacity: slot.remainingCapacity,
        // Note: id and service are not available in dynamic slots
        // Frontend should handle booking without slotId
      })),
    }));

    logger.info('Search appointments completed', {
      correlationId,
      resultsCount: results.length,
      totalSlotsReturned: results.reduce((sum, r) => sum + r.availableSlots.length, 0),
    });

    return NextResponse.json({
      success: true,
      results,
      meta: {
        total: results.length,
        radius,
        center: { lat, lng },
        sort,
        filters: {
          ...(serviceType && { serviceType }),
        },
      },
    });
  } catch (error) {
    logger.error('Appointment search error', {
      correlationId,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return NextResponse.json(
      {
        error: 'Failed to search appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
