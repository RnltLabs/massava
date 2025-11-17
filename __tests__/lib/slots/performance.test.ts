/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Performance Tests for Dynamic Slots
 *
 * Tests database query performance and slot calculation timing.
 * Run with: npm test __tests__/lib/slots/performance.test.ts
 */

import tap from 'tap';
import { performance } from 'perf_hooks';
import { calculateAvailableSlots } from '@/lib/slots';
import { prisma } from '@/lib/prisma';

// Performance thresholds
const THRESHOLDS = {
  STUDIO_LOOKUP: 50, // ms
  BOOKING_QUERY: 50, // ms
  BLOCKED_QUERY: 50, // ms
  FULL_CALCULATION: 200, // ms
  SLOT_COUNT: 96, // Maximum slots (15-min intervals, 6am-10pm)
};

tap.test('Dynamic Slots Performance Tests', async (t) => {
  // Setup: Create test studio and data
  let testStudioId: string;
  let testDate: string;

  t.before(async () => {
    // Create test studio
    const studio = await prisma.studio.create({
      data: {
        name: 'Performance Test Studio',
        description: 'Used for performance testing',
        address: 'Test Street 1',
        city: 'Test City',
        postalCode: '12345',
        phone: '+49 123 456789',
        email: 'test@example.com',
        capacity: 5,
        openingHours: {
          monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          saturday: { isOpen: false, openTime: '00:00', closeTime: '00:00' },
          sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' },
        },
      },
    });

    testStudioId = studio.id;

    // Set test date to next Monday
    const now = new Date();
    const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    testDate = nextMonday.toISOString().split('T')[0];

    // Create some test bookings (simulate moderate load)
    const bookingPromises = [];
    for (let i = 0; i < 10; i++) {
      const hour = 9 + Math.floor(i / 4);
      const minute = (i % 4) * 15;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      bookingPromises.push(
        prisma.newBooking.create({
          data: {
            studioId: testStudioId,
            customerName: `Test Customer ${i}`,
            customerEmail: `test${i}@example.com`,
            preferredDate: testDate,
            preferredTime: time,
            status: i % 2 === 0 ? 'CONFIRMED' : 'PENDING',
          },
        })
      );
    }

    await Promise.all(bookingPromises);

    // Create some blocked times
    await prisma.blockedTime.create({
      data: {
        studioId: testStudioId,
        startTime: new Date(`${testDate}T12:00:00.000Z`),
        endTime: new Date(`${testDate}T13:00:00.000Z`),
        reason: 'Lunch break',
        isAllDay: false,
      },
    });
  });

  t.teardown(async () => {
    // Cleanup test data
    if (testStudioId) {
      await prisma.newBooking.deleteMany({ where: { studioId: testStudioId } });
      await prisma.blockedTime.deleteMany({ where: { studioId: testStudioId } });
      await prisma.studio.delete({ where: { id: testStudioId } });
    }
    await prisma.$disconnect();
  });

  t.test('Studio Lookup Performance', async (t) => {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await prisma.studio.findUnique({
        where: { id: testStudioId },
        select: {
          id: true,
          capacity: true,
          openingHours: true,
        },
      });

      const duration = performance.now() - start;
      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const maxDuration = Math.max(...durations);

    t.ok(
      avgDuration < THRESHOLDS.STUDIO_LOOKUP,
      `Average studio lookup should be < ${THRESHOLDS.STUDIO_LOOKUP}ms (got ${avgDuration.toFixed(2)}ms)`
    );

    t.ok(
      maxDuration < THRESHOLDS.STUDIO_LOOKUP * 2,
      `Max studio lookup should be < ${THRESHOLDS.STUDIO_LOOKUP * 2}ms (got ${maxDuration.toFixed(2)}ms)`
    );

    t.comment(`Studio Lookup - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    t.end();
  });

  t.test('Booking Query Performance', async (t) => {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await prisma.newBooking.findMany({
        where: {
          studioId: testStudioId,
          preferredDate: testDate,
          status: {
            in: ['CONFIRMED', 'PENDING'],
          },
        },
        select: {
          preferredTime: true,
        },
      });

      const duration = performance.now() - start;
      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const maxDuration = Math.max(...durations);

    t.ok(
      avgDuration < THRESHOLDS.BOOKING_QUERY,
      `Average booking query should be < ${THRESHOLDS.BOOKING_QUERY}ms (got ${avgDuration.toFixed(2)}ms)`
    );

    t.ok(
      maxDuration < THRESHOLDS.BOOKING_QUERY * 2,
      `Max booking query should be < ${THRESHOLDS.BOOKING_QUERY * 2}ms (got ${maxDuration.toFixed(2)}ms)`
    );

    t.comment(`Booking Query - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    t.end();
  });

  t.test('Blocked Times Query Performance', async (t) => {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await prisma.blockedTime.findMany({
        where: {
          studioId: testStudioId,
          OR: [
            {
              isAllDay: true,
              startTime: { lte: new Date(`${testDate}T23:59:59.999Z`) },
              endTime: { gte: new Date(`${testDate}T00:00:00.000Z`) },
            },
            {
              isAllDay: false,
              startTime: {
                gte: new Date(`${testDate}T00:00:00.000Z`),
                lt: new Date(`${testDate}T23:59:59.999Z`),
              },
            },
          ],
        },
        select: {
          startTime: true,
          endTime: true,
          isAllDay: true,
        },
      });

      const duration = performance.now() - start;
      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const maxDuration = Math.max(...durations);

    t.ok(
      avgDuration < THRESHOLDS.BLOCKED_QUERY,
      `Average blocked query should be < ${THRESHOLDS.BLOCKED_QUERY}ms (got ${avgDuration.toFixed(2)}ms)`
    );

    t.ok(
      maxDuration < THRESHOLDS.BLOCKED_QUERY * 2,
      `Max blocked query should be < ${THRESHOLDS.BLOCKED_QUERY * 2}ms (got ${maxDuration.toFixed(2)}ms)`
    );

    t.comment(`Blocked Times Query - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    t.end();
  });

  t.test('Full Slot Calculation Performance', async (t) => {
    const iterations = 5; // Fewer iterations for full calculation
    const durations: number[] = [];
    const slotCounts: number[] = [];
    const availableCounts: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const result = await calculateAvailableSlots(testStudioId, testDate);

      const duration = performance.now() - start;
      durations.push(duration);

      t.ok(result.ok, 'Calculation should succeed');

      if (result.ok) {
        slotCounts.push(result.value.length);
        availableCounts.push(result.value.filter((s) => s.available).length);
      }
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const maxDuration = Math.max(...durations);
    const avgSlots = slotCounts.reduce((a, b) => a + b, 0) / slotCounts.length;
    const avgAvailable = availableCounts.reduce((a, b) => a + b, 0) / availableCounts.length;

    t.ok(
      avgDuration < THRESHOLDS.FULL_CALCULATION,
      `Average calculation should be < ${THRESHOLDS.FULL_CALCULATION}ms (got ${avgDuration.toFixed(2)}ms)`
    );

    t.ok(
      maxDuration < THRESHOLDS.FULL_CALCULATION * 1.5,
      `Max calculation should be < ${THRESHOLDS.FULL_CALCULATION * 1.5}ms (got ${maxDuration.toFixed(2)}ms)`
    );

    t.ok(
      avgSlots > 0 && avgSlots <= THRESHOLDS.SLOT_COUNT,
      `Should return 1-${THRESHOLDS.SLOT_COUNT} slots (got ${avgSlots.toFixed(0)})`
    );

    t.comment(
      `Full Calculation - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms, ` +
        `Slots: ${avgSlots.toFixed(0)}, Available: ${avgAvailable.toFixed(0)}`
    );
    t.end();
  });

  t.test('Concurrent Request Performance', async (t) => {
    const concurrentRequests = 10;

    const start = performance.now();

    const promises = Array.from({ length: concurrentRequests }, () =>
      calculateAvailableSlots(testStudioId, testDate)
    );

    const results = await Promise.all(promises);
    const duration = performance.now() - start;

    const allSucceeded = results.every((r) => r.ok);
    const avgTimePerRequest = duration / concurrentRequests;

    t.ok(allSucceeded, 'All concurrent requests should succeed');

    t.ok(
      avgTimePerRequest < THRESHOLDS.FULL_CALCULATION * 1.2,
      `Average time per concurrent request should be < ${THRESHOLDS.FULL_CALCULATION * 1.2}ms ` +
        `(got ${avgTimePerRequest.toFixed(2)}ms)`
    );

    t.comment(
      `Concurrent Requests (${concurrentRequests}) - ` +
        `Total: ${duration.toFixed(2)}ms, Per Request: ${avgTimePerRequest.toFixed(2)}ms`
    );
    t.end();
  });

  t.test('Memory Usage Test', async (t) => {
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Run 100 calculations
    for (let i = 0; i < 100; i++) {
      await calculateAvailableSlots(testStudioId, testDate);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const memIncrease = memAfter - memBefore;

    t.ok(
      memIncrease < 50,
      `Memory increase should be < 50MB for 100 calculations (got ${memIncrease.toFixed(2)}MB)`
    );

    t.comment(`Memory Usage - Before: ${memBefore.toFixed(2)}MB, After: ${memAfter.toFixed(2)}MB, ` +
      `Increase: ${memIncrease.toFixed(2)}MB`);
    t.end();
  });

  t.end();
});
