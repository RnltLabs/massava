/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Radar Geocoding API Route
 * Server-side proxy for Radar API with rate limiting
 *
 * This route handles:
 * - Secure API key management (server-side only)
 * - Rate limiting per IP (100 requests/minute)
 * - Input validation with Zod
 * - Response transformation to unified AddressSuggestion format
 * - Error handling with correlation IDs
 *
 * @module app/api/geocoding/radar/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  logger,
  generateCorrelationId,
  getClientIP,
  getCorrelationId,
} from '@/lib/logger';
import type { AddressSuggestion } from '@/lib/services/geocoding/types';
import { prioritizeDACHAddresses } from '@/lib/services/geocoding/utils/dach-prioritizer';

/**
 * Radar API configuration
 */
const RADAR_CONFIG = {
  apiUrl: 'https://api.radar.io/v1/search/autocomplete',
  timeout: 5000,
  defaultLimit: 8,
  maxLimit: 10,
  minLimit: 1,
  minQueryLength: 2,
  maxQueryLength: 200,
  defaultCountryCodes: 'DE,AT,CH',
} as const;

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // Max 100 requests per minute per IP
} as const;

/**
 * In-memory rate limit store
 * Note: In production, use Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Query parameter validation schema
 */
const queryParamsSchema = z.object({
  query: z
    .string()
    .min(RADAR_CONFIG.minQueryLength, `Query must be at least ${RADAR_CONFIG.minQueryLength} characters`)
    .max(RADAR_CONFIG.maxQueryLength, `Query must be at most ${RADAR_CONFIG.maxQueryLength} characters`)
    .transform((val) => val.trim()),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return RADAR_CONFIG.defaultLimit;
      const num = parseInt(val, 10);
      if (isNaN(num)) return RADAR_CONFIG.defaultLimit;
      return Math.min(Math.max(num, RADAR_CONFIG.minLimit), RADAR_CONFIG.maxLimit);
    }),
  countryCode: z
    .string()
    .optional()
    .default(RADAR_CONFIG.defaultCountryCodes)
    .transform((val) => val.toUpperCase()),
});

/**
 * Radar API response types
 */
interface RadarAddress {
  readonly addressLabel?: string;
  readonly formattedAddress?: string;
  readonly street?: string;
  readonly number?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly countryCode?: string;
  readonly latitude: number;
  readonly longitude: number;
}

interface RadarAutocompleteResponse {
  readonly meta: {
    readonly code: number;
  };
  readonly addresses: readonly RadarAddress[];
}

/**
 * API response structure
 */
interface ApiResponse {
  readonly ok: boolean;
  readonly data?: readonly AddressSuggestion[];
  readonly error?: {
    readonly type: string;
    readonly message: string;
    readonly correlationId: string;
  };
}

/**
 * Transform Radar address to unified AddressSuggestion format
 */
function transformRadarAddress(address: RadarAddress): AddressSuggestion {
  const street = address.number
    ? `${address.street ?? ''} ${address.number}`.trim()
    : address.street ?? '';

  const city = address.city ?? '';
  const postalCode = address.postalCode ?? '';
  const country = address.country ?? 'Germany';

  const displayText = postalCode
    ? `${street}, ${postalCode} ${city}`
    : `${street}, ${city}`;

  return {
    street,
    city,
    postalCode,
    country,
    displayText,
    lat: address.latitude,
    lng: address.longitude,
  };
}

/**
 * Check rate limit for IP
 *
 * @param ip - Client IP address
 * @returns Object with allowed status and remaining requests
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  // New entry or expired entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + RATE_LIMIT_CONFIG.windowMs;
    rateLimitStore.set(ip, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetAt,
    };
  }

  // Existing entry within window
  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create error response
 */
function createErrorResponse(
  type: string,
  message: string,
  correlationId: string,
  status: number
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: { type, message, correlationId },
    },
    { status }
  );
}

/**
 * GET /api/geocoding/radar
 *
 * Proxy endpoint for Radar geocoding API
 *
 * Query Parameters:
 * - query: string (required, 2-200 chars)
 * - limit: number (optional, 1-10, default 8)
 * - countryCode: string (optional, default 'DE,AT,CH')
 *
 * Headers:
 * - X-Correlation-ID: string (optional, for request tracing)
 *
 * Returns:
 * - 200: { ok: true, data: AddressSuggestion[] }
 * - 400: { ok: false, error: { type, message, correlationId } }
 * - 429: { ok: false, error: { type: 'RATE_LIMITED', ... } }
 * - 500: { ok: false, error: { type: 'NETWORK_ERROR', ... } }
 * - 503: { ok: false, error: { type: 'PROVIDER_UNAVAILABLE', ... } }
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const correlationId = getCorrelationId(request);
  const clientIP = getClientIP(request);
  const startTime = Date.now();

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    logger.warn('Radar proxy: Rate limit exceeded', {
      correlationId,
      ipAddress: clientIP,
      resetAt: new Date(rateLimit.resetAt).toISOString(),
    });

    const response = createErrorResponse(
      'RATE_LIMITED',
      'Rate limit exceeded. Please try again later.',
      correlationId,
      429
    );

    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIG.maxRequests));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
    response.headers.set('Retry-After', String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));

    return response;
  }

  // Validate API key
  const apiKey = process.env.RADAR_SECRET_KEY;
  if (!apiKey) {
    logger.error('Radar proxy: Missing RADAR_SECRET_KEY environment variable', {
      correlationId,
    });

    return createErrorResponse(
      'PROVIDER_UNAVAILABLE',
      'Geocoding service is not configured',
      correlationId,
      503
    );
  }

  // Parse and validate query parameters
  const searchParams = request.nextUrl.searchParams;
  const rawParams = {
    query: searchParams.get('query') ?? '',
    limit: searchParams.get('limit') ?? undefined,
    countryCode: searchParams.get('countryCode') ?? undefined,
  };

  const validationResult = queryParamsSchema.safeParse(rawParams);
  if (!validationResult.success) {
    const zodErrors = validationResult.error.issues;
    const firstError = zodErrors[0];
    logger.debug('Radar proxy: Invalid query parameters', {
      correlationId,
      errors: zodErrors,
    });

    return createErrorResponse(
      'INVALID_INPUT',
      firstError?.message ?? 'Invalid query parameters',
      correlationId,
      400
    );
  }

  const { query, limit, countryCode } = validationResult.data;

  logger.debug('Radar proxy: Processing request', {
    correlationId,
    query,
    limit,
    countryCode,
    ipAddress: clientIP,
  });

  // Build Radar API URL
  const radarUrl = new URL(RADAR_CONFIG.apiUrl);
  radarUrl.searchParams.set('query', query);
  radarUrl.searchParams.set('limit', String(limit * 2)); // Request more for prioritization
  radarUrl.searchParams.set('country', countryCode);
  radarUrl.searchParams.set('layers', 'address'); // Only return addresses

  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), RADAR_CONFIG.timeout);

  try {
    const response = await fetch(radarUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
      },
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-2xx responses
    if (!response.ok) {
      const duration = Date.now() - startTime;
      logger.warn('Radar proxy: API returned error', {
        correlationId,
        statusCode: response.status,
        durationMs: duration,
      });

      if (response.status === 401 || response.status === 403) {
        return createErrorResponse(
          'PROVIDER_UNAVAILABLE',
          'Geocoding service authentication failed',
          correlationId,
          503
        );
      }

      if (response.status === 429) {
        return createErrorResponse(
          'RATE_LIMITED',
          'Geocoding service rate limit exceeded',
          correlationId,
          429
        );
      }

      return createErrorResponse(
        'NETWORK_ERROR',
        'Geocoding service returned an error',
        correlationId,
        502
      );
    }

    const data: RadarAutocompleteResponse = await response.json();

    // Validate response structure
    if (!data.addresses || !Array.isArray(data.addresses)) {
      logger.warn('Radar proxy: Invalid response structure', {
        correlationId,
        receivedKeys: Object.keys(data),
      });

      return createErrorResponse(
        'INVALID_RESPONSE',
        'Geocoding service returned invalid data',
        correlationId,
        502
      );
    }

    // Transform addresses
    const suggestions = data.addresses
      .filter((addr): addr is RadarAddress => {
        return typeof addr.latitude === 'number' && typeof addr.longitude === 'number';
      })
      .map(transformRadarAddress);

    // Prioritize DACH addresses
    const prioritized = prioritizeDACHAddresses(suggestions, {
      maxResults: limit,
    });

    const duration = Date.now() - startTime;
    logger.debug('Radar proxy: Request completed', {
      correlationId,
      query,
      rawResultCount: data.addresses.length,
      transformedCount: suggestions.length,
      finalCount: prioritized.length,
      durationMs: duration,
    });

    const successResponse = NextResponse.json<ApiResponse>({
      ok: true,
      data: prioritized,
    });

    // Add rate limit headers
    successResponse.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIG.maxRequests));
    successResponse.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    successResponse.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
    successResponse.headers.set('X-Correlation-ID', correlationId);
    successResponse.headers.set('X-Response-Time', `${duration}ms`);

    return successResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Radar proxy: Request timed out', {
        correlationId,
        query,
        timeoutMs: RADAR_CONFIG.timeout,
        durationMs: duration,
      });

      return createErrorResponse(
        'TIMEOUT',
        'Geocoding service request timed out',
        correlationId,
        504
      );
    }

    // Handle network errors
    logger.error('Radar proxy: Request failed', {
      correlationId,
      query,
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    return createErrorResponse(
      'NETWORK_ERROR',
      'Failed to connect to geocoding service',
      correlationId,
      502
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Correlation-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Export runtime configuration
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
