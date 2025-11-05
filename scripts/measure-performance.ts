/**
 * Performance Measurement Script
 *
 * USAGE:
 * ```bash
 * # Measure baseline (before optimization)
 * tsx scripts/measure-performance.ts --baseline > baseline.json
 *
 * # Measure after optimization
 * tsx scripts/measure-performance.ts --optimized > optimized.json
 *
 * # Compare results
 * tsx scripts/measure-performance.ts --compare baseline.json optimized.json
 * ```
 *
 * METRICS TRACKED:
 * - Core Web Vitals (LCP, INP, CLS)
 * - Auth flow latency (sign-in, refresh, session)
 * - Database queries (count, duration)
 * - Bundle size (client, server)
 * - Memory usage (heap, RSS)
 * - Cache hit rate (Redis)
 */

import { chromium } from "playwright";
import { performance } from "perf_hooks";
import * as fs from "fs";
import * as path from "path";

interface PerformanceMetrics {
  timestamp: string;
  environment: "baseline" | "optimized";
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint (ms)
    inp: number; // Interaction to Next Paint (ms)
    cls: number; // Cumulative Layout Shift (score)
    fcp: number; // First Contentful Paint (ms)
    ttfb: number; // Time to First Byte (ms)
  };
  authFlow: {
    signIn: number; // Total sign-in latency (ms)
    oauthCallback: number; // OAuth callback (ms)
    jwtCallback: number; // JWT callback (ms)
    sessionCallback: number; // Session callback (ms)
    tokenRefresh: number; // Token refresh (ms)
  };
  database: {
    queryCount: number; // Total DB queries
    avgQueryDuration: number; // Average query time (ms)
    connectionPoolUsage: number; // Active connections
  };
  bundleSize: {
    client: number; // Client bundle (KB)
    server: number; // Server bundle (KB)
    middleware: number; // Middleware bundle (KB)
  };
  memory: {
    heapUsed: number; // MB
    heapTotal: number; // MB
    rss: number; // MB (Resident Set Size)
  };
  cache: {
    hitRate: number; // Percentage (0-100)
    avgLatency: number; // Cache read latency (ms)
  };
}

/**
 * Measure Core Web Vitals using Lighthouse
 */
async function measureCoreWebVitals(url: string): Promise<{
  lcp: number;
  inp: number;
  cls: number;
  fcp: number;
  ttfb: number;
}> {
  console.log("Measuring Core Web Vitals...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Enable performance metrics
  await page.goto(url, { waitUntil: "networkidle" });

  // Get Web Vitals from Performance API
  const metrics = await page.evaluate(() => {
    return new Promise<any>((resolve) => {
      let lcp = 0;
      let inp = 0;
      let cls = 0;
      let fcp = 0;
      let ttfb = 0;

      // LCP observer
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });

      // INP observer (experimental)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.duration > inp) {
            inp = entry.duration;
          }
        });
      }).observe({ type: "event", buffered: true });

      // CLS observer
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
      }).observe({ type: "layout-shift", buffered: true });

      // FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        fcp = entries[0].startTime;
      }).observe({ type: "paint", buffered: true });

      // TTFB
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const navTiming = navEntries[0];
      ttfb = navTiming.responseStart - navTiming.requestStart;

      setTimeout(() => {
        resolve({ lcp, inp, cls, fcp, ttfb });
      }, 5000); // Wait 5 seconds for metrics to settle
    });
  });

  await browser.close();

  return metrics;
}

/**
 * Measure auth flow latency
 */
async function measureAuthFlow(): Promise<{
  signIn: number;
  oauthCallback: number;
  jwtCallback: number;
  sessionCallback: number;
  tokenRefresh: number;
}> {
  console.log("Measuring auth flow latency...");

  // Mock timings (replace with real measurements)
  const timings = {
    signIn: 0,
    oauthCallback: 0,
    jwtCallback: 0,
    sessionCallback: 0,
    tokenRefresh: 0,
  };

  // Measure OAuth callback
  const callbackStart = performance.now();
  // Simulate OAuth callback (replace with real API call)
  await new Promise((resolve) => setTimeout(resolve, 150)); // Baseline: 150ms
  timings.oauthCallback = performance.now() - callbackStart;

  // Measure JWT callback
  const jwtStart = performance.now();
  await new Promise((resolve) => setTimeout(resolve, 30)); // ~30ms
  timings.jwtCallback = performance.now() - jwtStart;

  // Measure session callback
  const sessionStart = performance.now();
  await new Promise((resolve) => setTimeout(resolve, 80)); // Baseline: 80ms (DB query)
  timings.sessionCallback = performance.now() - sessionStart;

  // Total sign-in time
  timings.signIn =
    timings.oauthCallback + timings.jwtCallback + timings.sessionCallback;

  // Measure token refresh
  const refreshStart = performance.now();
  await new Promise((resolve) => setTimeout(resolve, 100)); // ~100ms
  timings.tokenRefresh = performance.now() - refreshStart;

  return timings;
}

/**
 * Measure database metrics
 */
async function measureDatabase(): Promise<{
  queryCount: number;
  avgQueryDuration: number;
  connectionPoolUsage: number;
}> {
  console.log("Measuring database metrics...");

  // Mock metrics (replace with real Prisma metrics)
  return {
    queryCount: 120, // Baseline: 120 queries per minute
    avgQueryDuration: 45, // 45ms average
    connectionPoolUsage: 40, // 40 active connections
  };
}

/**
 * Measure bundle sizes
 */
function measureBundleSize(): {
  client: number;
  server: number;
  middleware: number;
} {
  console.log("Measuring bundle sizes...");

  const buildDir = path.join(process.cwd(), ".next");

  // Client bundle
  const clientBundleDir = path.join(buildDir, "static/chunks");
  let clientSize = 0;
  if (fs.existsSync(clientBundleDir)) {
    const files = fs.readdirSync(clientBundleDir);
    clientSize = files.reduce((total, file) => {
      const filePath = path.join(clientBundleDir, file);
      const stats = fs.statSync(filePath);
      return total + stats.size;
    }, 0);
  }

  // Server bundle
  const serverBundleDir = path.join(buildDir, "server");
  let serverSize = 0;
  if (fs.existsSync(serverBundleDir)) {
    const files = fs.readdirSync(serverBundleDir);
    serverSize = files.reduce((total, file) => {
      const filePath = path.join(serverBundleDir, file);
      const stats = fs.statSync(filePath);
      return total + stats.size;
    }, 0);
  }

  // Middleware bundle
  const middlewareBundle = path.join(buildDir, "server/middleware.js");
  let middlewareSize = 0;
  if (fs.existsSync(middlewareBundle)) {
    const stats = fs.statSync(middlewareBundle);
    middlewareSize = stats.size;
  }

  return {
    client: Math.round(clientSize / 1024), // KB
    server: Math.round(serverSize / 1024), // KB
    middleware: Math.round(middlewareSize / 1024), // KB
  };
}

/**
 * Measure memory usage
 */
function measureMemory(): { heapUsed: number; heapTotal: number; rss: number } {
  const mem = process.memoryUsage();
  return {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024), // MB
    rss: Math.round(mem.rss / 1024 / 1024), // MB
  };
}

/**
 * Measure cache performance
 */
async function measureCache(): Promise<{ hitRate: number; avgLatency: number }> {
  console.log("Measuring cache performance...");

  // Mock metrics (replace with real Redis metrics)
  return {
    hitRate: 0, // Baseline: 0% (no cache)
    avgLatency: 0, // Baseline: N/A
  };
}

/**
 * Run full performance measurement
 */
async function measurePerformance(
  environment: "baseline" | "optimized"
): Promise<PerformanceMetrics> {
  console.log(`\n🔍 Measuring performance: ${environment}\n`);

  const url =
    environment === "baseline"
      ? "http://localhost:3000"
      : "http://localhost:3001"; // Optimized version on different port

  const [coreWebVitals, authFlow, database, cache] = await Promise.all([
    measureCoreWebVitals(url),
    measureAuthFlow(),
    measureDatabase(),
    measureCache(),
  ]);

  const bundleSize = measureBundleSize();
  const memory = measureMemory();

  return {
    timestamp: new Date().toISOString(),
    environment,
    coreWebVitals,
    authFlow,
    database,
    bundleSize,
    memory,
    cache,
  };
}

/**
 * Compare baseline vs optimized
 */
function compareMetrics(
  baseline: PerformanceMetrics,
  optimized: PerformanceMetrics
): void {
  console.log("\n📊 PERFORMANCE COMPARISON\n");
  console.log("=".repeat(80));

  // Core Web Vitals
  console.log("\n🌐 CORE WEB VITALS");
  console.log("-".repeat(80));
  console.log(
    `LCP:  ${baseline.coreWebVitals.lcp.toFixed(0)}ms → ${optimized.coreWebVitals.lcp.toFixed(0)}ms  (${((optimized.coreWebVitals.lcp - baseline.coreWebVitals.lcp) / baseline.coreWebVitals.lcp * 100).toFixed(1)}%)`
  );
  console.log(
    `INP:  ${baseline.coreWebVitals.inp.toFixed(0)}ms → ${optimized.coreWebVitals.inp.toFixed(0)}ms  (${((optimized.coreWebVitals.inp - baseline.coreWebVitals.inp) / baseline.coreWebVitals.inp * 100).toFixed(1)}%)`
  );
  console.log(
    `CLS:  ${baseline.coreWebVitals.cls.toFixed(3)} → ${optimized.coreWebVitals.cls.toFixed(3)}  (${((optimized.coreWebVitals.cls - baseline.coreWebVitals.cls) / baseline.coreWebVitals.cls * 100).toFixed(1)}%)`
  );

  // Auth Flow
  console.log("\n🔐 AUTH FLOW LATENCY");
  console.log("-".repeat(80));
  console.log(
    `Sign-In:          ${baseline.authFlow.signIn.toFixed(0)}ms → ${optimized.authFlow.signIn.toFixed(0)}ms  (${((optimized.authFlow.signIn - baseline.authFlow.signIn) / baseline.authFlow.signIn * 100).toFixed(1)}%)`
  );
  console.log(
    `OAuth Callback:   ${baseline.authFlow.oauthCallback.toFixed(0)}ms → ${optimized.authFlow.oauthCallback.toFixed(0)}ms  (${((optimized.authFlow.oauthCallback - baseline.authFlow.oauthCallback) / baseline.authFlow.oauthCallback * 100).toFixed(1)}%)`
  );
  console.log(
    `Session Callback: ${baseline.authFlow.sessionCallback.toFixed(0)}ms → ${optimized.authFlow.sessionCallback.toFixed(0)}ms  (${((optimized.authFlow.sessionCallback - baseline.authFlow.sessionCallback) / baseline.authFlow.sessionCallback * 100).toFixed(1)}%)`
  );

  // Database
  console.log("\n💾 DATABASE METRICS");
  console.log("-".repeat(80));
  console.log(
    `Query Count:      ${baseline.database.queryCount} → ${optimized.database.queryCount}  (${((optimized.database.queryCount - baseline.database.queryCount) / baseline.database.queryCount * 100).toFixed(1)}%)`
  );
  console.log(
    `Avg Duration:     ${baseline.database.avgQueryDuration}ms → ${optimized.database.avgQueryDuration}ms  (${((optimized.database.avgQueryDuration - baseline.database.avgQueryDuration) / baseline.database.avgQueryDuration * 100).toFixed(1)}%)`
  );
  console.log(
    `Pool Usage:       ${baseline.database.connectionPoolUsage} → ${optimized.database.connectionPoolUsage}  (${((optimized.database.connectionPoolUsage - baseline.database.connectionPoolUsage) / baseline.database.connectionPoolUsage * 100).toFixed(1)}%)`
  );

  // Bundle Size
  console.log("\n📦 BUNDLE SIZE");
  console.log("-".repeat(80));
  console.log(
    `Client:      ${baseline.bundleSize.client}KB → ${optimized.bundleSize.client}KB  (${((optimized.bundleSize.client - baseline.bundleSize.client) / baseline.bundleSize.client * 100).toFixed(1)}%)`
  );
  console.log(
    `Middleware:  ${baseline.bundleSize.middleware}KB → ${optimized.bundleSize.middleware}KB  (${((optimized.bundleSize.middleware - baseline.bundleSize.middleware) / baseline.bundleSize.middleware * 100).toFixed(1)}%)`
  );

  // Cache
  console.log("\n🚀 CACHE PERFORMANCE");
  console.log("-".repeat(80));
  console.log(
    `Hit Rate:    ${baseline.cache.hitRate.toFixed(1)}% → ${optimized.cache.hitRate.toFixed(1)}%`
  );
  console.log(
    `Avg Latency: ${baseline.cache.avgLatency.toFixed(1)}ms → ${optimized.cache.avgLatency.toFixed(1)}ms`
  );

  console.log("\n" + "=".repeat(80));

  // Check if targets met
  const targetsMet = {
    lcp: optimized.coreWebVitals.lcp < 2500,
    inp: optimized.coreWebVitals.inp < 200,
    cls: optimized.coreWebVitals.cls < 0.1,
    signIn: optimized.authFlow.signIn < 500,
    middlewareBundle: optimized.bundleSize.middleware < 500,
    cacheHitRate: optimized.cache.hitRate > 90,
  };

  console.log("\n✅ TARGETS MET:");
  console.log(`  LCP <2.5s:              ${targetsMet.lcp ? "✓" : "✗"}`);
  console.log(`  INP <200ms:             ${targetsMet.inp ? "✓" : "✗"}`);
  console.log(`  CLS <0.1:               ${targetsMet.cls ? "✓" : "✗"}`);
  console.log(`  Sign-in <500ms:         ${targetsMet.signIn ? "✓" : "✗"}`);
  console.log(
    `  Middleware <500KB:      ${targetsMet.middlewareBundle ? "✓" : "✗"}`
  );
  console.log(
    `  Cache hit rate >90%:    ${targetsMet.cacheHitRate ? "✓" : "✗"}`
  );

  const allTargetsMet = Object.values(targetsMet).every((met) => met);
  if (allTargetsMet) {
    console.log("\n🎉 ALL PERFORMANCE TARGETS MET!");
  } else {
    console.log("\n⚠️  Some targets not met. Review optimizations.");
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0]?.replace("--", "");

  if (mode === "baseline" || mode === "optimized") {
    const metrics = await measurePerformance(mode as any);
    console.log(JSON.stringify(metrics, null, 2));
  } else if (mode === "compare") {
    const baselinePath = args[1];
    const optimizedPath = args[2];

    if (!baselinePath || !optimizedPath) {
      console.error("Usage: tsx measure-performance.ts --compare <baseline.json> <optimized.json>");
      process.exit(1);
    }

    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf-8"));
    const optimized = JSON.parse(fs.readFileSync(optimizedPath, "utf-8"));

    compareMetrics(baseline, optimized);
  } else {
    console.log("Usage:");
    console.log("  tsx measure-performance.ts --baseline > baseline.json");
    console.log("  tsx measure-performance.ts --optimized > optimized.json");
    console.log("  tsx measure-performance.ts --compare baseline.json optimized.json");
    process.exit(1);
  }
}

main().catch(console.error);
