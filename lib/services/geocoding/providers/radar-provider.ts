/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Radar Geocoding Provider (Client-Side)
 * Commercial geocoding service with high accuracy
 *
 * This provider is designed for client-side usage and communicates
 * with the local API route proxy at /api/geocoding/radar.
 * The API key is securely stored on the server.
 *
 * **NOTE**: This provider is stateless regarding failure tracking.
 * Circuit breaker logic and health monitoring are handled by the
 * GeocodingOrchestrator, which is the single source of truth for
 * provider health decisions.
 *
 * API Documentation: https://radar.io/documentation/geocoding
 *
 * @module lib/services/geocoding/providers/radar-provider
 */

import { logger, generateCorrelationId } from "@/lib/logger";
import { createGeocodingError, exceptionToGeocodingError } from "../errors";
import type { GeocodingError } from "../errors";
import type { AddressSuggestion, GeocodingSearchOptions } from "../types";
import type {
  GeocodingProvider,
  GeocodingProviderConfig,
  GeocodingProviderResult,
} from "./geocoding-provider";
import { createProviderConfig } from "./geocoding-provider";

/**
 * Gets the base URL for API requests in an SSR-compatible way.
 * Uses window.location.origin on client-side, falls back to environment
 * variable or localhost on server-side.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Server-side: use environment variable or default to localhost
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Response structure from the local API route
 */
interface RadarProxyResponse {
  readonly ok: boolean;
  readonly data?: readonly AddressSuggestion[];
  readonly error?: {
    readonly type: string;
    readonly message: string;
  };
}

/**
 * Default configuration for Radar provider
 */
const RADAR_DEFAULTS = {
  // Local API route (server handles actual Radar API call)
  baseUrl: "/api/geocoding/radar",
  timeout: 8000, // Slightly higher to account for proxy overhead
  maxRetries: 1,
  defaultLimit: 8,
  defaultLang: "de",
  minQueryLength: 2,
} as const;

/**
 * Radar Geocoding Provider Implementation (Client-Side)
 *
 * Features:
 * - Client-side provider using local API route proxy
 * - API key securely stored on server
 * - Higher accuracy than OSM-based services
 * - Rate limiting handled by server
 *
 * **NOTE**: This provider is stateless regarding failure tracking.
 * Circuit breaker logic and health monitoring are handled by the
 * GeocodingOrchestrator, which is the single source of truth for
 * provider health decisions.
 *
 * @example
 * ```typescript
 * const provider = new RadarProvider();
 *
 * const result = await provider.search('Karlstraße 12 Karlsruhe', {
 *   limit: 8,
 *   lang: 'de',
 * });
 *
 * if (result.ok) {
 *   console.log(result.data);
 * }
 * ```
 */
export class RadarProvider implements GeocodingProvider {
  readonly name = "radar" as const;
  readonly config: GeocodingProviderConfig;

  /**
   * Create a new Radar provider instance
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<GeocodingProviderConfig>) {
    this.config = createProviderConfig({
      baseUrl: config?.baseUrl ?? RADAR_DEFAULTS.baseUrl,
      timeout: config?.timeout ?? RADAR_DEFAULTS.timeout,
      maxRetries: config?.maxRetries ?? RADAR_DEFAULTS.maxRetries,
    });
  }

  /**
   * Search for address suggestions using Radar API via local proxy
   *
   * @param query - Search query string
   * @param options - Search options
   * @returns Result with address suggestions or error
   */
  async search(
    query: string,
    options: GeocodingSearchOptions,
  ): Promise<GeocodingProviderResult> {
    const correlationId = options.correlationId ?? generateCorrelationId();
    const limit = options.limit ?? RADAR_DEFAULTS.defaultLimit;
    const timeout = options.timeout ?? this.config.timeout;

    // Validate input
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < RADAR_DEFAULTS.minQueryLength) {
      return {
        ok: false,
        error: createGeocodingError("INVALID_INPUT", "Query too short", {
          correlationId,
          provider: this.name,
          field: "query",
          value: trimmedQuery,
          constraint: `Minimum ${RADAR_DEFAULTS.minQueryLength} characters required`,
        }),
      };
    }

    // NOTE: Circuit breaker check is handled by the GeocodingOrchestrator
    // This provider just executes the request

    // Build URL with query parameters
    const url = new URL(this.config.baseUrl, getBaseUrl());
    url.searchParams.set("query", trimmedQuery);
    url.searchParams.set("limit", String(limit));

    // Add DACH country restriction
    if (options.restrictToDACH !== false) {
      url.searchParams.set("countryCode", "DE,AT,CH");
    }

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    // Combine with user-provided signal
    const combinedSignal = options.signal
      ? this.combineAbortSignals(options.signal, abortController.signal)
      : abortController.signal;

    const startTime = Date.now();

    try {
      logger.debug("Radar: Fetching address suggestions via proxy", {
        correlationId,
        query: trimmedQuery,
        limit,
        restrictToDACH: options.restrictToDACH !== false,
      });

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Correlation-ID": correlationId,
        },
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          ok: false,
          error: this.handleHttpError(response.status, correlationId),
        };
      }

      const data: RadarProxyResponse = await response.json();

      // Handle error response from proxy
      if (!data.ok || !data.data) {
        const errorType = data.error?.type ?? "NETWORK_ERROR";
        const errorMessage = data.error?.message ?? "Unknown error from proxy";

        return {
          ok: false,
          error: createGeocodingError(
            errorType as GeocodingError["type"],
            errorMessage,
            {
              correlationId,
              provider: this.name,
            },
          ),
        };
      }

      const duration = Date.now() - startTime;

      logger.debug("Radar: Successfully fetched address suggestions", {
        correlationId,
        query: trimmedQuery,
        resultCount: data.data.length,
        durationMs: duration,
      });

      return {
        ok: true,
        data: data.data,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const geocodingError = exceptionToGeocodingError(
        error,
        this.name,
        correlationId,
      );

      logger.warn("Radar: Request failed", {
        correlationId,
        query: trimmedQuery,
        errorType: geocodingError.type,
        message: geocodingError.message,
      });

      return {
        ok: false,
        error: geocodingError,
      };
    }
  }

  /**
   * Check if the provider is properly configured
   *
   * For Radar (client-side), this checks if the base URL is configured.
   * The actual API key validation happens on the server.
   * Circuit breaker state is managed by the GeocodingOrchestrator.
   *
   * @returns True if provider is configured
   */
  isConfigured(): boolean {
    // Radar client-side provider just needs a base URL
    // The server-side proxy validates the API key
    return Boolean(this.config.baseUrl);
  }

  /**
   * Handle HTTP error responses
   */
  private handleHttpError(
    statusCode: number,
    correlationId: string,
  ): GeocodingError {
    if (statusCode === 429) {
      return createGeocodingError(
        "RATE_LIMITED",
        "Radar API rate limit exceeded",
        {
          correlationId,
          provider: this.name,
          statusCode,
          retryAfterMs: 60000,
        },
      );
    }

    if (statusCode === 401 || statusCode === 403) {
      return createGeocodingError(
        "PROVIDER_UNAVAILABLE",
        "Radar API authentication error",
        {
          correlationId,
          provider: this.name,
          statusCode,
          reason: "Invalid or missing API key",
        },
      );
    }

    if (statusCode >= 500) {
      return createGeocodingError(
        "PROVIDER_UNAVAILABLE",
        "Radar API server error",
        {
          correlationId,
          provider: this.name,
          statusCode,
          reason: `HTTP ${statusCode}`,
        },
      );
    }

    return createGeocodingError(
      "NETWORK_ERROR",
      `Radar proxy returned ${statusCode}`,
      {
        correlationId,
        provider: this.name,
        statusCode,
      },
    );
  }

  /**
   * Combine multiple abort signals into one
   */
  private combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      });
    }

    return controller.signal;
  }
}

/**
 * Create a new Radar provider instance with default configuration
 *
 * @returns Configured RadarProvider instance
 */
export function createRadarProvider(
  config?: Partial<GeocodingProviderConfig>,
): RadarProvider {
  return new RadarProvider(config);
}
