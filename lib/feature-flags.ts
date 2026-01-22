/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Feature Flags
 *
 * Central configuration for feature toggles.
 * Allows gradual rollout and safe rollback of new features.
 */

/**
 * Feature flags configuration
 */
export const FEATURE_FLAGS = {
  /**
   * Dynamic Slots Feature
   *
   * When enabled, time slots are calculated dynamically based on:
   * - Studio opening hours
   * - Existing bookings (CONFIRMED and PENDING)
   * - Blocked times
   * - Studio capacity
   *
   * When disabled, falls back to static TimeSlot table.
   *
   * @default true
   * @env FEATURE_DYNAMIC_SLOTS
   */
  DYNAMIC_SLOTS_ENABLED:
    process.env.FEATURE_DYNAMIC_SLOTS === 'false' ? false : true,
} as const;

/**
 * Type-safe feature flag keys
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 *
 * @param flag - Feature flag key
 * @returns Whether the feature is enabled
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('DYNAMIC_SLOTS_ENABLED')) {
 *   // Use dynamic slot calculation
 * }
 * ```
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all feature flags and their status
 *
 * @returns Object containing all feature flags
 */
export function getFeatureFlags(): Record<FeatureFlagKey, boolean> {
  return { ...FEATURE_FLAGS };
}
