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
import { getMinPrice, filterServicesByPrice } from '@/lib/utils/priceAggregation';
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
              error: slotsResult.error,
            });
            return { ...studio, availableSlots: [] as AvailableSlot[] };
          }

          // Limit to 10 slots per studio for performance
          const limitedSlots = slotsResult.value.slice(0, 10);
          return { ...studio, availableSlots: limitedSlots };
        } catch (error) {
          logger.error('Error calculating slots for studio', {
            correlationId,
            studioId: studio.id,
            error,
          });
          return { ...studio, availableSlots: [] as AvailableSlot[] };
        }
      })
    );

    // Filter only studios with available slots
    const studiosWithAvailableSlots = studiosWithSlotsResults.filter(
      (studio) => studio.availableSlots.length > 0
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

    // Format response with dynamic slots
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
      availableSlots: studio.availableSlots.map((slot) => ({
        // Dynamic slots format (backward compatible)
        startTime: `${searchDate}T${slot.startTime}:00.000Z`,
        endTime: `${searchDate}T${slot.endTime}:00.000Z`,
        remainingCapacity: slot.remainingCapacity,
        // Note: id and service are not available in dynamic slots
        // Frontend should handle booking without slotId
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
    logger.error('Appointment search error', {
      correlationId,
      error,
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
