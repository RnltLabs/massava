/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Validation Schema Tests (Phase 3)
 *
 * Tests for dynamic slot validation.
 */

import { bookingFormSchema } from '@/lib/validations/booking';

describe('bookingFormSchema - Phase 3', () => {
  describe('Dynamic Slot Validation', () => {
    it('should accept valid dynamic slot booking', () => {
      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+49 123 456789',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid legacy slotId booking', () => {
      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject preferredTime not on 15-minute grid', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDate: '2025-12-01',
        preferredTime: '10:13', // Not on grid
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid 15-minute intervals', () => {
      const validTimes = ['10:00', '10:15', '10:30', '10:45'];

      for (const time of validTimes) {
        const data = {
          studioId: 'clw1234567890abcdefghij',
          serviceId: 'clw1234567890abcdefghij',
          preferredDate: '2025-12-01',
          preferredTime: time,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
        };

        const result = bookingFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should reject date in the past', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDate: '2020-01-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require either slotId or (preferredDate + preferredTime)', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject preferredDate without preferredTime', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDate: '2025-12-01',
        // Missing preferredTime
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject preferredTime without preferredDate', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredTime: '10:00',
        // Missing preferredDate
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate invalid date format', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDate: '01-12-2025', // Wrong format
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate invalid time format', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDate: '2025-12-01',
        preferredTime: '10:13', // Not on 15-minute grid
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('GDPR Validation', () => {
    it('should accept optional health consent', () => {
      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        explicitHealthConsent: true,
        message: 'I have back pain',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept booking without health consent', () => {
      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Contact Information Validation', () => {
    it('should accept optional contact fields', () => {
      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
        customerEmail: 'invalid-email',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate phone format', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
        customerPhone: 'abc', // Too short
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate message length', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        slotId: 'clw1234567890abcdefghij',
        message: 'a'.repeat(1001), // Too long
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
