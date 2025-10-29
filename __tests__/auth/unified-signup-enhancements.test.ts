/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Tests for Unified Sign Up Form Enhancements
 * - Optional phone number field
 * - Terms checkbox requirement for submit button
 * - Phone number validation
 */

import { describe, it, expect } from 'vitest';
import { unifiedRegistrationSchema } from '@/lib/validation';

describe('Unified Registration Schema - Phone Number', () => {
  it('should accept valid registration without phone number', () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept valid registration with phone number', () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      phone: '+49 123 456789',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+49 123 456789');
    }
  });

  it('should accept empty phone number string (optional)', () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      phone: '',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
    }
  });

  it('should accept various international phone formats', () => {
    const validPhoneNumbers = [
      '+49 123 456789',
      '+1 (555) 123-4567',
      '0049 123 456789',
      '123456789',
      '+33123456789',
    ];

    validPhoneNumbers.forEach((phone) => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'ValidPassword123',
        phone,
        terms: true,
        accountType: 'customer' as const,
      };

      const result = unifiedRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  it('should reject phone number with invalid characters', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      phone: 'abc123def',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('phone');
    }
  });

  it('should reject phone number that is too short', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      phone: '12345',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('phone');
    }
  });

  it('should reject phone number that is too long', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      phone: '123456789012345678901',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('phone');
    }
  });

  it('should require terms to be checked', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      phone: '+49 123 456789',
      terms: false,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('terms');
    }
  });

  it('should accept both customer and studio account types', () => {
    const customerData = {
      name: 'Test Customer',
      email: 'customer@example.com',
      password: 'ValidPassword123',
      phone: '+49 123 456789',
      terms: true,
      accountType: 'customer' as const,
    };

    const studioData = {
      name: 'Test Studio Owner',
      email: 'studio@example.com',
      password: 'ValidPassword123',
      phone: '+49 987 654321',
      terms: true,
      accountType: 'studio' as const,
    };

    const customerResult = unifiedRegistrationSchema.safeParse(customerData);
    const studioResult = unifiedRegistrationSchema.safeParse(studioData);

    expect(customerResult.success).toBe(true);
    expect(studioResult.success).toBe(true);
  });
});

describe('Password Validation Requirements', () => {
  it('should enforce minimum 10 characters', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Short1A',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should require at least one uppercase letter', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'lowercase123',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should require at least one number', () => {
    const invalidData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'NoNumbersHere',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept password meeting all requirements', () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPassword123',
      terms: true,
      accountType: 'customer' as const,
    };

    const result = unifiedRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
