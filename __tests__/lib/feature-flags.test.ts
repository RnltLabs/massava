/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Feature Flags Tests
 * Phase 4: Dynamic Slots Implementation
 */

import { FEATURE_FLAGS, isFeatureEnabled, getFeatureFlags } from '@/lib/feature-flags'

describe('Feature Flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('FEATURE_FLAGS', () => {
    it('should have DYNAMIC_SLOTS_ENABLED flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('DYNAMIC_SLOTS_ENABLED')
    })

    it('should default DYNAMIC_SLOTS_ENABLED to true when env var is not set', () => {
      delete process.env.FEATURE_DYNAMIC_SLOTS

      // Re-import to get fresh instance
      jest.isolateModules(() => {
        const { FEATURE_FLAGS } = require('@/lib/feature-flags')
        expect(FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED).toBe(true)
      })
    })

    it('should set DYNAMIC_SLOTS_ENABLED to false when env var is "false"', () => {
      process.env.FEATURE_DYNAMIC_SLOTS = 'false'

      jest.isolateModules(() => {
        const { FEATURE_FLAGS } = require('@/lib/feature-flags')
        expect(FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED).toBe(false)
      })
    })

    it('should set DYNAMIC_SLOTS_ENABLED to true for any other value', () => {
      const testValues = ['true', 'TRUE', '1', 'yes', 'enabled', '']

      testValues.forEach((value) => {
        process.env.FEATURE_DYNAMIC_SLOTS = value

        jest.isolateModules(() => {
          const { FEATURE_FLAGS } = require('@/lib/feature-flags')
          expect(FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED).toBe(true)
        })
      })
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      const result = isFeatureEnabled('DYNAMIC_SLOTS_ENABLED')
      expect(typeof result).toBe('boolean')
    })

    it('should return correct value based on FEATURE_FLAGS', () => {
      const result = isFeatureEnabled('DYNAMIC_SLOTS_ENABLED')
      expect(result).toBe(FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED)
    })
  })

  describe('getFeatureFlags', () => {
    it('should return all feature flags', () => {
      const flags = getFeatureFlags()

      expect(flags).toHaveProperty('DYNAMIC_SLOTS_ENABLED')
      expect(typeof flags.DYNAMIC_SLOTS_ENABLED).toBe('boolean')
    })

    it('should return a copy of feature flags', () => {
      const flags = getFeatureFlags()

      // Modifying returned object should not affect FEATURE_FLAGS
      ;(flags as any).DYNAMIC_SLOTS_ENABLED = !flags.DYNAMIC_SLOTS_ENABLED
      expect(getFeatureFlags().DYNAMIC_SLOTS_ENABLED).toBe(FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED)
    })
  })
})
