/**
 * Middleware Performance Benchmark
 *
 * USAGE:
 * ```bash
 * # Before optimization
 * tsx scripts/benchmark-middleware.ts --config=current
 *
 * # After optimization
 * tsx scripts/benchmark-middleware.ts --config=optimized
 * ```
 *
 * METRICS TRACKED:
 * - Bundle size (KB)
 * - Cold start time (ms)
 * - P50/P95/P99 latency (ms)
 * - Memory usage (MB)
 * - Requests per second (RPS)
 */

import { performance } from "perf_hooks";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface BenchmarkResult {
  config: "current" | "optimized";
  bundleSize: number; // KB
  coldStart: number; // ms
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  memory: number; // MB
  rps: number; // requests per second
}

/**
 * Measure bundle size
 */
function measureBundleSize(middlewarePath: string): number {
  const buildDir = path.join(process.cwd(), ".next");

  // Trigger Next.js build
  console.log("Building Next.js app...");
  execSync("npm run build", { stdio: "inherit" });

  // Find middleware bundle
  const middlewareBundle = path.join(
    buildDir,
    "server/middleware/middleware.js"
  );

  if (!fs.existsSync(middlewareBundle)) {
    throw new Error(`Middleware bundle not found: ${middlewareBundle}`);
  }

  const stats = fs.statSync(middlewareBundle);
  return Math.round(stats.size / 1024); // Convert to KB
}

/**
 * Measure cold start time
 */
async function measureColdStart(
  middlewareModule: any
): Promise<number> {
  const iterations = 100;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Simulate cold start (clear module cache)
    delete require.cache[require.resolve("../middleware")];

    const start = performance.now();
    await import("../middleware");
    const end = performance.now();

    times.push(end - start);
  }

  return times.reduce((a, b) => a + b, 0) / iterations;
}

/**
 * Measure request latency
 */
async function measureLatency(
  middlewareFn: Function
): Promise<{ p50: number; p95: number; p99: number }> {
  const iterations = 10000;
  const times: number[] = [];

  // Mock request object
  const mockRequest = {
    nextUrl: { pathname: "/dashboard" },
    headers: new Map([
      ["authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
    ]),
    url: "https://massava.com/dashboard",
  };

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await middlewareFn(mockRequest);
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  return {
    p50: times[Math.floor(iterations * 0.5)],
    p95: times[Math.floor(iterations * 0.95)],
    p99: times[Math.floor(iterations * 0.99)],
  };
}

/**
 * Measure memory usage
 */
function measureMemory(): number {
  const used = process.memoryUsage();
  return Math.round(used.heapUsed / 1024 / 1024); // Convert to MB
}

/**
 * Measure throughput (RPS)
 */
async function measureThroughput(middlewareFn: Function): Promise<number> {
  const duration = 10000; // 10 seconds
  const mockRequest = {
    nextUrl: { pathname: "/dashboard" },
    headers: new Map([["authorization", "Bearer ..."]]),
    url: "https://massava.com/dashboard",
  };

  let requestCount = 0;
  const startTime = performance.now();

  while (performance.now() - startTime < duration) {
    await middlewareFn(mockRequest);
    requestCount++;
  }

  const actualDuration = (performance.now() - startTime) / 1000; // seconds
  return Math.round(requestCount / actualDuration);
}

/**
 * Run full benchmark
 */
async function runBenchmark(
  config: "current" | "optimized"
): Promise<BenchmarkResult> {
  console.log(`\n🚀 Running benchmark: ${config}`);

  const middlewarePath =
    config === "current" ? "./middleware.ts" : "./middleware-optimized.ts";

  console.log("1/5 Measuring bundle size...");
  const bundleSize = measureBundleSize(middlewarePath);

  console.log("2/5 Measuring cold start...");
  const middlewareModule = await import(
    config === "current" ? "../middleware" : "../middleware-optimized"
  );
  const coldStart = await measureColdStart(middlewareModule);

  console.log("3/5 Measuring latency...");
  const latency = await measureLatency(middlewareModule.middleware);

  console.log("4/5 Measuring memory...");
  const memory = measureMemory();

  console.log("5/5 Measuring throughput...");
  const rps = await measureThroughput(middlewareModule.middleware);

  return {
    config,
    bundleSize,
    coldStart,
    latency,
    memory,
    rps,
  };
}

/**
 * Compare results
 */
function compareResults(
  current: BenchmarkResult,
  optimized: BenchmarkResult
): void {
  console.log("\n📊 PERFORMANCE COMPARISON\n");
  console.log("─".repeat(60));

  const improvements = {
    bundleSize:
      ((current.bundleSize - optimized.bundleSize) / current.bundleSize) * 100,
    coldStart:
      ((current.coldStart - optimized.coldStart) / current.coldStart) * 100,
    p95: ((current.latency.p95 - optimized.latency.p95) / current.latency.p95) * 100,
    memory: ((current.memory - optimized.memory) / current.memory) * 100,
    rps: ((optimized.rps - current.rps) / current.rps) * 100,
  };

  console.log(`Metric              Current    Optimized   Improvement`);
  console.log("─".repeat(60));
  console.log(
    `Bundle Size         ${current.bundleSize}KB     ${optimized.bundleSize}KB      ${improvements.bundleSize.toFixed(1)}% smaller`
  );
  console.log(
    `Cold Start          ${current.coldStart.toFixed(1)}ms    ${optimized.coldStart.toFixed(1)}ms     ${improvements.coldStart.toFixed(1)}% faster`
  );
  console.log(
    `Latency P50         ${current.latency.p50.toFixed(1)}ms    ${optimized.latency.p50.toFixed(1)}ms     ${((current.latency.p50 - optimized.latency.p50) / current.latency.p50 * 100).toFixed(1)}% faster`
  );
  console.log(
    `Latency P95         ${current.latency.p95.toFixed(1)}ms    ${optimized.latency.p95.toFixed(1)}ms     ${improvements.p95.toFixed(1)}% faster`
  );
  console.log(
    `Latency P99         ${current.latency.p99.toFixed(1)}ms    ${optimized.latency.p99.toFixed(1)}ms     ${((current.latency.p99 - optimized.latency.p99) / current.latency.p99 * 100).toFixed(1)}% faster`
  );
  console.log(
    `Memory Usage        ${current.memory}MB     ${optimized.memory}MB      ${improvements.memory.toFixed(1)}% less`
  );
  console.log(
    `Throughput          ${current.rps} RPS   ${optimized.rps} RPS    ${improvements.rps.toFixed(1)}% more`
  );
  console.log("─".repeat(60));

  // Check if targets met
  const targetsMet = {
    bundleSize: optimized.bundleSize < 500, // <500KB
    p95: optimized.latency.p95 < 15, // <15ms
    coldStart: optimized.coldStart < 10, // <10ms
  };

  console.log("\n✅ TARGETS MET:");
  console.log(
    `  Bundle Size <500KB:   ${targetsMet.bundleSize ? "✓" : "✗"} (${optimized.bundleSize}KB)`
  );
  console.log(
    `  P95 Latency <15ms:    ${targetsMet.p95 ? "✓" : "✗"} (${optimized.latency.p95.toFixed(1)}ms)`
  );
  console.log(
    `  Cold Start <10ms:     ${targetsMet.coldStart ? "✓" : "✗"} (${optimized.coldStart.toFixed(1)}ms)`
  );

  const allTargetsMet = Object.values(targetsMet).every((met) => met);
  if (allTargetsMet) {
    console.log("\n🎉 ALL PERFORMANCE TARGETS MET!");
  } else {
    console.log("\n⚠️  Some targets not met. Further optimization needed.");
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const config = args[0]?.replace("--config=", "") as
    | "current"
    | "optimized"
    | undefined;

  if (!config || !["current", "optimized"].includes(config)) {
    console.log("Usage: tsx benchmark-middleware.ts --config=<current|optimized>");
    console.log("\nOr run both:");
    console.log("tsx benchmark-middleware.ts --config=both");
    process.exit(1);
  }

  if (config === "both" as any) {
    console.log("🔥 FULL PERFORMANCE COMPARISON\n");

    const currentResult = await runBenchmark("current");
    const optimizedResult = await runBenchmark("optimized");

    compareResults(currentResult, optimizedResult);

    // Save results to file
    const resultsPath = path.join(
      process.cwd(),
      "benchmark-results.json"
    );
    fs.writeFileSync(
      resultsPath,
      JSON.stringify(
        { current: currentResult, optimized: optimizedResult },
        null,
        2
      )
    );
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  } else {
    const result = await runBenchmark(config);
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
