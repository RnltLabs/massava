#!/usr/bin/env tsx

/**
 * Phase 7: Auth Query Performance Test
 * Tests the performance improvement from database indexes
 */

import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

interface BenchmarkResult {
  queryName: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
}

async function benchmarkQuery(
  name: string,
  queryFn: () => Promise<unknown>,
  iterations: number = 10
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  await queryFn();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await queryFn();
    const duration = performance.now() - start;
    times.push(duration);
  }

  return {
    queryName: name,
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    iterations,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('Phase 7: Auth Query Performance Benchmark');
  console.log('='.repeat(80));
  console.log('');

  // Get test data
  const testUser = await prisma.user.findFirst();
  const testStudio = await prisma.studio.findFirst();

  if (!testUser || !testStudio) {
    console.error('Error: No test data found in database');
    process.exit(1);
  }

  console.log(`Test User: ${testUser.email}`);
  console.log(`Test Studio: ${testStudio.name}`);
  console.log('');

  const results: BenchmarkResult[] = [];

  // 1. User email lookup (most frequent auth query)
  results.push(
    await benchmarkQuery('User email lookup', async () => {
      return prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          id: true,
          email: true,
          name: true,
          primaryRole: true,
          isActive: true,
          isSuspended: true,
        },
      });
    })
  );

  // 2. User with roles (permission check)
  results.push(
    await benchmarkQuery('User with roles', async () => {
      return prisma.user.findUnique({
        where: { id: testUser.id },
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      });
    })
  );

  // 3. Studio ownership check (critical permission query)
  results.push(
    await benchmarkQuery('Studio ownership check', async () => {
      return prisma.studioOwnership.findFirst({
        where: {
          userId: testUser.id,
          studioId: testStudio.id,
        },
      });
    })
  );

  // 4. Get all user studios
  results.push(
    await benchmarkQuery('Get user studios', async () => {
      return prisma.studioOwnership.findMany({
        where: { userId: testUser.id },
        select: { studioId: true },
      });
    })
  );

  // 5. Session lookup
  results.push(
    await benchmarkQuery('Session lookup', async () => {
      return prisma.newSession.findFirst({
        where: {
          userId: testUser.id,
        },
      });
    })
  );

  // Print results
  console.log('Benchmark Results:');
  console.log('='.repeat(80));
  console.log(
    'Query Name'.padEnd(40),
    'Avg'.padEnd(10),
    'Min'.padEnd(10),
    'Max'.padEnd(10)
  );
  console.log('-'.repeat(80));

  results.forEach((result) => {
    console.log(
      result.queryName.padEnd(40),
      `${result.avgTime.toFixed(2)}ms`.padEnd(10),
      `${result.minTime.toFixed(2)}ms`.padEnd(10),
      `${result.maxTime.toFixed(2)}ms`.padEnd(10)
    );
  });

  console.log('='.repeat(80));
  console.log('');

  // Performance summary
  const totalAvgTime = results.reduce((sum, r) => sum + r.avgTime, 0);
  console.log(`Total average query time: ${totalAvgTime.toFixed(2)}ms`);
  console.log(`Target: All queries < 5ms (achieved: ${results.every(r => r.avgTime < 5) ? 'YES' : 'NO'})`);
  console.log('');

  // Check if indexes are being used
  console.log('Verifying Index Usage:');
  console.log('-'.repeat(80));

  const indexCheck = await prisma.$queryRaw<Array<{ relname: string; idx_scan: bigint }>>`
    SELECT relname, idx_scan
    FROM pg_stat_user_indexes
    WHERE indexrelname LIKE 'idx_%'
      AND schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 10;
  `;

  console.log('Top 10 Most Used Indexes:');
  indexCheck.forEach((row) => {
    console.log(`  ${row.relname}: ${row.idx_scan.toString()} scans`);
  });

  console.log('');
  console.log('Phase 7 Performance Test Complete!');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
