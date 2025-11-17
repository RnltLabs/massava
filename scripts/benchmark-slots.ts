/**
 * Dynamic Slots Performance Benchmark
 * 
 * Tests database query performance and slot calculation timing.
 * Run with: npx tsx scripts/benchmark-slots.ts
 */

import { performance } from 'perf_hooks';
import { prisma } from '../lib/prisma';
import { calculateAvailableSlots } from '../lib/slots';

interface BenchmarkResult {
  operation: string;
  duration: number;
  count?: number;
  details?: Record<string, any>;
}

const results: BenchmarkResult[] = [];

async function benchmark(name: string, fn: () => Promise<any>): Promise<number> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  results.push({
    operation: name,
    duration: Math.round(duration * 100) / 100,
    count: Array.isArray(result) ? result.length : undefined,
  });
  
  return duration;
}

async function runBenchmarks() {
  console.log('🚀 Starting Dynamic Slots Performance Benchmark\n');

  // Get a test studio
  const studio = await prisma.studio.findFirst({
    where: {
      capacity: { gte: 1 },
      openingHours: { not: Prisma.JsonNull },
    },
    select: { id: true, name: true, capacity: true },
  });

  if (!studio) {
    console.error('❌ No studio found for benchmarking');
    return;
  }

  console.log(`📍 Testing with studio: ${studio.name} (ID: ${studio.id})`);
  console.log(`   Capacity: ${studio.capacity}\n`);

  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1); // Tomorrow
  const dateStr = testDate.toISOString().split('T')[0];

  // Benchmark 1: Studio lookup
  await benchmark('Studio Lookup', async () => {
    return await prisma.studio.findUnique({
      where: { id: studio.id },
      select: {
        id: true,
        capacity: true,
        openingHours: true,
      },
    });
  });

  // Benchmark 2: Booking query (without index optimization)
  await benchmark('Booking Query (current)', async () => {
    return await prisma.newBooking.findMany({
      where: {
        studioId: studio.id,
        preferredDate: dateStr,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: {
        preferredTime: true,
      },
    });
  });

  // Benchmark 3: Blocked times query
  await benchmark('Blocked Times Query', async () => {
    return await prisma.blockedTime.findMany({
      where: {
        studioId: studio.id,
        OR: [
          {
            isAllDay: true,
            startTime: { lte: new Date(`${dateStr}T23:59:59.999Z`) },
            endTime: { gte: new Date(`${dateStr}T00:00:00.000Z`) },
          },
          {
            isAllDay: false,
            startTime: {
              gte: new Date(`${dateStr}T00:00:00.000Z`),
              lt: new Date(`${dateStr}T23:59:59.999Z`),
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
  });

  // Benchmark 4: Full slot calculation
  const slotStart = performance.now();
  const slotsResult = await calculateAvailableSlots(studio.id, dateStr);
  const slotDuration = performance.now() - slotStart;

  if (slotsResult.ok) {
    results.push({
      operation: 'Full Slot Calculation (end-to-end)',
      duration: Math.round(slotDuration * 100) / 100,
      count: slotsResult.value.length,
      details: {
        available: slotsResult.value.filter(s => s.available).length,
        unavailable: slotsResult.value.filter(s => !s.available).length,
      },
    });
  }

  // Print results
  console.log('\n📊 Benchmark Results:\n');
  console.log('┌─────────────────────────────────────────────┬──────────┬───────┬─────────────────┐');
  console.log('│ Operation                                   │ Duration │ Count │ Details         │');
  console.log('├─────────────────────────────────────────────┼──────────┼───────┼─────────────────┤');

  for (const result of results) {
    const op = result.operation.padEnd(43);
    const dur = `${result.duration}ms`.padEnd(8);
    const count = result.count !== undefined ? result.count.toString().padEnd(5) : '-'.padEnd(5);
    const details = result.details 
      ? `${result.details.available}/${result.details.unavailable}`.padEnd(15)
      : '-'.padEnd(15);
    
    // Color code based on duration
    let icon = '✅';
    if (result.duration > 200) icon = '❌';
    else if (result.duration > 100) icon = '⚠️';
    
    console.log(`│ ${op} │ ${dur} │ ${count} │ ${details} │ ${icon}`);
  }

  console.log('└─────────────────────────────────────────────┴──────────┴───────┴─────────────────┘');

  // Performance assessment
  console.log('\n🎯 Performance Assessment:\n');

  const studioLookup = results.find(r => r.operation === 'Studio Lookup');
  const bookingQuery = results.find(r => r.operation === 'Booking Query (current)');
  const blockedQuery = results.find(r => r.operation === 'Blocked Times Query');
  const fullCalc = results.find(r => r.operation.includes('Full Slot Calculation'));

  if (studioLookup && studioLookup.duration < 10) {
    console.log('✅ Studio Lookup: Excellent (< 10ms)');
  } else if (studioLookup && studioLookup.duration < 50) {
    console.log('⚠️  Studio Lookup: Good (< 50ms)');
  } else {
    console.log('❌ Studio Lookup: Needs optimization (> 50ms)');
  }

  if (bookingQuery && bookingQuery.duration < 50) {
    console.log('✅ Booking Query: Excellent (< 50ms)');
  } else if (bookingQuery && bookingQuery.duration < 100) {
    console.log('⚠️  Booking Query: Good but could improve (< 100ms)');
  } else {
    console.log('❌ Booking Query: Needs optimization (> 100ms) - Consider composite index');
  }

  if (blockedQuery && blockedQuery.duration < 50) {
    console.log('✅ Blocked Times Query: Excellent (< 50ms)');
  } else if (blockedQuery && blockedQuery.duration < 100) {
    console.log('⚠️  Blocked Times Query: Good (< 100ms)');
  } else {
    console.log('❌ Blocked Times Query: Needs optimization (> 100ms)');
  }

  if (fullCalc && fullCalc.duration < 100) {
    console.log('✅ Full Calculation: Excellent (< 100ms)');
  } else if (fullCalc && fullCalc.duration < 200) {
    console.log('⚠️  Full Calculation: Acceptable (< 200ms)');
  } else {
    console.log('❌ Full Calculation: Needs optimization (> 200ms)');
  }

  console.log('\n💡 Recommendations:\n');

  if (bookingQuery && bookingQuery.duration > 50) {
    console.log('1. Add composite index on NewBooking(studioId, preferredDate, status)');
  }

  if (fullCalc && fullCalc.duration > 100) {
    console.log('2. Consider implementing Redis caching for frequently accessed slots');
    console.log('   - Cache key pattern: slots:{studioId}:{date}');
    console.log('   - TTL: 5-15 minutes');
    console.log('   - Invalidate on booking creation/cancellation');
  }

  if (results.some(r => r.duration > 200)) {
    console.log('3. Add query timing logs to GlitchTip for monitoring in production');
  }

  await prisma.$disconnect();
}

runBenchmarks().catch(console.error);
