/**
 * JSON Helper Functions
 *
 * Type-safe utilities for converting between Prisma's Json type
 * and TypeScript types using Zod validation.
 */

import type { Prisma } from '@/app/generated/prisma';
import { logger } from '@/lib/logger';
import {
  statusHistorySchema,
  typePreferencesSchema,
  genericMetadataSchema,
  type StatusHistory,
} from '@/lib/schemas/notification.schema';
import type { TypePreferences } from '@/lib/notifications/notification-types';

// ============================================
// Status History Helpers
// ============================================

/**
 * Safely parse status history from Prisma Json
 */
export function parseStatusHistory(json: Prisma.JsonValue | null): StatusHistory {
  if (!json) {
    return [];
  }

  const result = statusHistorySchema.safeParse(json);

  if (!result.success) {
    logger.error('Invalid status history JSON:', {
      error: result.error,
      json,
    });
    return [];
  }

  return result.data;
}

/**
 * Convert status history to Prisma Json
 */
export function toStatusHistoryJson(history: StatusHistory): Prisma.JsonArray {
  return history.map((entry) => ({
    status: entry.status,
    timestamp: entry.timestamp,
    ...(entry.reason && { reason: entry.reason }),
    ...(entry.channel && { channel: entry.channel }),
  })) as Prisma.JsonArray;
}

// ============================================
// Type Preferences Helpers
// ============================================

/**
 * Safely parse type preferences from Prisma Json
 */
export function parseTypePreferences(json: Prisma.JsonValue | null): TypePreferences {
  if (!json) {
    return {};
  }

  const result = typePreferencesSchema.safeParse(json);

  if (!result.success) {
    logger.error('Invalid type preferences JSON:', {
      error: result.error,
      json,
    });
    return {};
  }

  return result.data;
}

/**
 * Convert type preferences to Prisma Json
 */
export function toTypePreferencesJson(preferences: TypePreferences): Prisma.JsonObject {
  return preferences as Prisma.JsonObject;
}

// ============================================
// Metadata Helpers
// ============================================

/**
 * Safely parse notification metadata from Prisma Json
 */
export function parseMetadata(json: Prisma.JsonValue | null): Record<string, unknown> {
  if (!json) {
    return {};
  }

  const result = genericMetadataSchema.safeParse(json);

  if (!result.success) {
    logger.error('Invalid metadata JSON:', {
      error: result.error,
      json,
    });
    return {};
  }

  return result.data;
}

/**
 * Convert metadata to Prisma Json
 */
export function toMetadataJson(
  metadata: Record<string, unknown> | undefined
): Prisma.JsonObject | undefined {
  if (!metadata || Object.keys(metadata).length === 0) {
    return undefined;
  }

  return metadata as Prisma.JsonObject;
}

// ============================================
// Type Guards
// ============================================

/**
 * Type guard to check if value is a valid Prisma JsonValue
 */
export function isPrismaJsonValue(value: unknown): value is Prisma.JsonValue {
  if (value === null) return true;

  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;

  if (Array.isArray(value)) {
    return value.every((item) => isPrismaJsonValue(item));
  }

  if (typeof value === 'object') {
    return Object.values(value).every((item) => isPrismaJsonValue(item));
  }

  return false;
}

/**
 * Type guard to check if value is a Prisma JsonObject
 */
export function isPrismaJsonObject(value: unknown): value is Prisma.JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => isPrismaJsonValue(item))
  );
}

/**
 * Type guard to check if value is a Prisma JsonArray
 */
export function isPrismaJsonArray(value: unknown): value is Prisma.JsonArray {
  return Array.isArray(value) && value.every((item) => isPrismaJsonValue(item));
}
