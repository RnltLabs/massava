/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Geo-Filtering Optimization Tests
 *
 * Integration tests for Phase 1: Geo-Bounding Box filtering
 * Verifies that the search API only loads studios within radius
 */

import { GET } from '@/app/api/search/appointments/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

describe('Search API - Geo-Filtering Optimization', () => {
  // Munich coordinates for testing
  const MUNICH_LAT = 48.1351;
  const MUNICH_LNG = 11.582;

  beforeEach(async () => {
    // Clean up test data
    await prisma.timeSlot.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.studio.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.timeSlot.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.studio.deleteMany({});
  });

  it('should only return studios within specified radius', async () => {
    // Create studios at different distances from Munich
    const studioNear = await prisma.studio.create({
      data: {
        name: 'Near Studio',
        address: 'Near Address',
        city: 'München',
        phone: '123456789',
        email: 'near@test.com',
        latitude: MUNICH_LAT + 0.01, // ~1.1 km north
        longitude: MUNICH_LNG,
      },
    });

    const studioFar = await prisma.studio.create({
      data: {
        name: 'Far Studio',
        address: 'Far Address',
        city: 'Augsburg',
        phone: '987654321',
        email: 'far@test.com',
        latitude: MUNICH_LAT + 0.5, // ~55 km north
        longitude: MUNICH_LNG,
      },
    });

    // Create services for both studios
    await prisma.service.create({
      data: {
        studioId: studioNear.id,
        name: 'Near Service',
        price: 50,
        duration: 60,
      },
    });

    await prisma.service.create({
      data: {
        studioId: studioFar.id,
        name: 'Far Service',
        price: 50,
        duration: 60,
      },
    });

    // Create available time slots for both
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.timeSlot.create({
      data: {
        studioId: studioNear.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    await prisma.timeSlot.create({
      data: {
        studioId: studioFar.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    // Search with 10 km radius (should only find near studio)
    const request = new NextRequest(
      `http://localhost:3000/api/search/appointments?location=Munich&lat=${MUNICH_LAT}&lng=${MUNICH_LNG}&radius=10`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].name).toBe('Near Studio');
    expect(data.results[0].distance).toBeLessThan(10);
  });

  it('should use bounding box for efficient database filtering', async () => {
    // Create studios in different cities
    const munichStudio = await prisma.studio.create({
      data: {
        name: 'Munich Studio',
        address: 'Munich Address',
        city: 'München',
        phone: '111111111',
        email: 'munich@test.com',
        latitude: MUNICH_LAT,
        longitude: MUNICH_LNG,
      },
    });

    const berlinStudio = await prisma.studio.create({
      data: {
        name: 'Berlin Studio',
        address: 'Berlin Address',
        city: 'Berlin',
        phone: '222222222',
        email: 'berlin@test.com',
        latitude: 52.52, // Berlin coordinates
        longitude: 13.405,
      },
    });

    // Create services
    await prisma.service.create({
      data: {
        studioId: munichStudio.id,
        name: 'Munich Service',
        price: 50,
        duration: 60,
      },
    });

    await prisma.service.create({
      data: {
        studioId: berlinStudio.id,
        name: 'Berlin Service',
        price: 50,
        duration: 60,
      },
    });

    // Create time slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.timeSlot.create({
      data: {
        studioId: munichStudio.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    await prisma.timeSlot.create({
      data: {
        studioId: berlinStudio.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    // Search from Munich with small radius
    const request = new NextRequest(
      `http://localhost:3000/api/search/appointments?location=Munich&lat=${MUNICH_LAT}&lng=${MUNICH_LNG}&radius=50`
    );

    const response = await GET(request);
    const data = await response.json();

    // Should only return Munich studio (Berlin is ~500 km away)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].name).toBe('Munich Studio');
  });

  it('should calculate precise Haversine distance', async () => {
    const studio = await prisma.studio.create({
      data: {
        name: 'Test Studio',
        address: 'Test Address',
        city: 'München',
        phone: '123456789',
        email: 'test@test.com',
        latitude: MUNICH_LAT + 0.01, // ~1.1 km north
        longitude: MUNICH_LNG,
      },
    });

    await prisma.service.create({
      data: {
        studioId: studio.id,
        name: 'Test Service',
        price: 50,
        duration: 60,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.timeSlot.create({
      data: {
        studioId: studio.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/search/appointments?location=Munich&lat=${MUNICH_LAT}&lng=${MUNICH_LNG}&radius=10`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(1);

    // Distance should be approximately 1.1 km (rounded to 1 decimal)
    expect(data.results[0].distance).toBeGreaterThan(1.0);
    expect(data.results[0].distance).toBeLessThan(1.2);
  });

  it('should handle studios with null coordinates', async () => {
    // Create studio without coordinates
    const studioNoCoords = await prisma.studio.create({
      data: {
        name: 'No Coords Studio',
        address: 'No Coords Address',
        city: 'München',
        phone: '111111111',
        email: 'nocoords@test.com',
        latitude: null,
        longitude: null,
      },
    });

    // Create studio with coordinates
    const studioWithCoords = await prisma.studio.create({
      data: {
        name: 'With Coords Studio',
        address: 'With Coords Address',
        city: 'München',
        phone: '222222222',
        email: 'withcoords@test.com',
        latitude: MUNICH_LAT,
        longitude: MUNICH_LNG,
      },
    });

    // Create services
    await prisma.service.create({
      data: {
        studioId: studioNoCoords.id,
        name: 'No Coords Service',
        price: 50,
        duration: 60,
      },
    });

    await prisma.service.create({
      data: {
        studioId: studioWithCoords.id,
        name: 'With Coords Service',
        price: 50,
        duration: 60,
      },
    });

    // Create time slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.timeSlot.create({
      data: {
        studioId: studioNoCoords.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    await prisma.timeSlot.create({
      data: {
        studioId: studioWithCoords.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        isBooked: false,
      },
    });

    const request = new NextRequest(
      `http://localhost:3000/api/search/appointments?location=Munich&lat=${MUNICH_LAT}&lng=${MUNICH_LNG}&radius=10`
    );

    const response = await GET(request);
    const data = await response.json();

    // Should only return studio with coordinates
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].name).toBe('With Coords Studio');
  });

  it('should validate radius parameter', async () => {
    // Test with invalid radius (too large)
    const requestTooLarge = new NextRequest(
      `http://localhost:3000/api/search/appointments?location=Munich&lat=${MUNICH_LAT}&lng=${MUNICH_LNG}&radius=150`
    );

    const responseTooLarge = await GET(requestTooLarge);
    const dataTooLarge = await responseTooLarge.json();

    expect(responseTooLarge.status).toBe(400);
    expect(dataTooLarge.error).toBe('Invalid query parameters');

    // Test with invalid radius (negative)
    const requestNegative = new NextRequest(
      `http://localhost:3000/api/search/appointments?location=Munich&lat=${MUNICH_LAT}&lng=${MUNICH_LNG}&radius=-10`
    );

    const responseNegative = await GET(requestNegative);
    const dataNegative = await responseNegative.json();

    expect(responseNegative.status).toBe(400);
    expect(dataNegative.error).toBe('Invalid query parameters');
  });
});
