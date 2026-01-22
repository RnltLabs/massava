/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Search Appointments API - Unit Tests (Phase 3)
 *
 * Tests integration with dynamic slot calculation.
 */


import { GET } from '@/app/api/search/appointments/route';
import { NextRequest } from 'next/server';
import { ok } from '@/lib/result';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    studio: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/slots', () => ({
  calculateAvailableSlots: jest.fn(),
}));

jest.mock('@/lib/geo/bounding-box', () => ({
  getBoundingBox: jest.fn(() => ({
    minLat: 52.0,
    maxLat: 53.0,
    minLng: 13.0,
    maxLng: 14.0,
  })),
}));

jest.mock('@/lib/geo/haversine', () => ({
  calculateHaversineDistance: jest.fn(() => 5.0),
}));

jest.mock('@/lib/utils/serviceMatching', () => ({
  filterServicesByType: jest.fn((services) => services),
}));

jest.mock('@/lib/utils/priceAggregation', () => ({
  filterServicesByPrice: jest.fn((services) => services),
  getMinPrice: jest.fn(() => 50),
}));

import { prisma } from '@/lib/prisma';
import { calculateAvailableSlots } from '@/lib/slots';

describe('Search Appointments API - Dynamic Slots Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should integrate dynamic slots with geo-filtering', async () => {
    const mockStudios = [
      {
        id: 'studio-1',
        name: 'Test Studio 1',
        description: 'Description 1',
        logoUrl: null,
        galleryImages: [],
        address: 'Test Street 1',
        city: 'Berlin',
        postalCode: '10115',
        phone: '+49 30 12345678',
        email: 'studio1@example.com',
        website: null,
        openingHours: {},
        latitude: 52.5,
        longitude: 13.5,
        capacity: 3,
        averageRating: 4.5,
        totalReviews: 10,
        services: [
          {
            id: 'service-1',
            name: 'Thai Massage',
            description: 'Description',
            price: 60,
            duration: 60,
          },
        ],
      },
    ];

    const mockSlots = [
      {
        startTime: '09:00',
        endTime: '09:15',
        available: true,
        remainingCapacity: 2,
      },
      {
        startTime: '09:15',
        endTime: '09:30',
        available: true,
        remainingCapacity: 1,
      },
    ];

    jest.mocked(prisma.studio.findMany).mockResolvedValue(mockStudios as any);
    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok(mockSlots));

    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10&datetime=2025-12-01T09:00:00Z'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(1);

    const result = data.results[0];
    expect(result.id).toBe('studio-1');
    expect(result.availableSlots).toHaveLength(2);

    // Check slot format
    const slot = result.availableSlots[0];
    expect(slot.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(slot.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(slot.remainingCapacity).toBe(2);

    // Verify calculateAvailableSlots was called
    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'studio-1',
      '2025-12-01',
      undefined,
      { includeUnavailable: false, minCapacity: 1 }
    );
  });

  it('should call calculateAvailableSlots in parallel for multiple studios', async () => {
    const mockStudios = [
      {
        id: 'studio-1',
        name: 'Studio 1',
        latitude: 52.5,
        longitude: 13.5,
        services: [],
      },
      {
        id: 'studio-2',
        name: 'Studio 2',
        latitude: 52.6,
        longitude: 13.6,
        services: [],
      },
    ];

    jest.mocked(prisma.studio.findMany).mockResolvedValue(mockStudios as any);
    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok([]));

    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10&datetime=2025-12-01T09:00:00Z'
    );

    await GET(request);

    // Should be called once for each studio
    expect(calculateAvailableSlots).toHaveBeenCalledTimes(2);
    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'studio-1',
      expect.any(String),
      undefined,
      expect.any(Object)
    );
    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'studio-2',
      expect.any(String),
      undefined,
      expect.any(Object)
    );
  });

  it('should filter out studios with no available slots', async () => {
    const mockStudios = [
      {
        id: 'studio-1',
        name: 'Studio 1',
        latitude: 52.5,
        longitude: 13.5,
        services: [{ id: 'service-1', name: 'Massage' }],
      },
      {
        id: 'studio-2',
        name: 'Studio 2',
        latitude: 52.6,
        longitude: 13.6,
        services: [{ id: 'service-2', name: 'Massage' }],
      },
    ];

    jest.mocked(prisma.studio.findMany).mockResolvedValue(mockStudios as any);

    // Studio 1 has slots, Studio 2 has none
    jest.mocked(calculateAvailableSlots)
      .mockResolvedValueOnce(
        ok([
          {
            startTime: '09:00',
            endTime: '09:15',
            available: true,
            remainingCapacity: 1,
          },
        ])
      )
      .mockResolvedValueOnce(ok([]));

    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10&datetime=2025-12-01T09:00:00Z'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('studio-1');
  });

  it('should handle slot calculation errors gracefully', async () => {
    const mockStudios = [
      {
        id: 'studio-1',
        name: 'Studio 1',
        latitude: 52.5,
        longitude: 13.5,
        services: [],
      },
    ];

    jest.mocked(prisma.studio.findMany).mockResolvedValue(mockStudios as any);
    jest.mocked(calculateAvailableSlots).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10&datetime=2025-12-01T09:00:00Z'
    );

    const response = await GET(request);

    // Should not crash - studio should just have empty slots
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.results).toHaveLength(0);
  });

  it('should limit slots to 10 per studio', async () => {
    const mockStudios = [
      {
        id: 'studio-1',
        name: 'Studio 1',
        latitude: 52.5,
        longitude: 13.5,
        services: [{ id: 'service-1', name: 'Massage' }],
      },
    ];

    // Create 20 mock slots
    const manySlots = Array.from({ length: 20 }, (_, i) => ({
      startTime: `${9 + Math.floor(i / 4)}:${(i % 4) * 15}`.padStart(5, '0'),
      endTime: `${9 + Math.floor(i / 4)}:${((i % 4) * 15 + 15) % 60}`.padStart(5, '0'),
      available: true,
      remainingCapacity: 1,
    }));

    jest.mocked(prisma.studio.findMany).mockResolvedValue(mockStudios as any);
    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok(manySlots));

    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10&datetime=2025-12-01T09:00:00Z'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.results[0].availableSlots).toHaveLength(10);
  });

  it('should validate datetime is not in the past', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10&datetime=2020-01-01T09:00:00Z'
    );

    const response = await GET(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid datetime');
  });

  it('should use current date when datetime is not provided', async () => {
    const mockStudios = [
      {
        id: 'studio-1',
        name: 'Studio 1',
        latitude: 52.5,
        longitude: 13.5,
        services: [],
      },
    ];

    jest.mocked(prisma.studio.findMany).mockResolvedValue(mockStudios as any);
    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok([]));

    const request = new NextRequest(
      'http://localhost:3000/api/search/appointments?location=Berlin&lat=52.5&lng=13.4&radius=10'
    );

    await GET(request);

    const today = new Date().toISOString().split('T')[0];

    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'studio-1',
      today,
      undefined,
      expect.any(Object)
    );
  });
});
