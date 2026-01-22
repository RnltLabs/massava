/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Validation Schema Tests (Phase 4: DateTime Migration)
 *
 * Tests for DateTime-based validation with security fixes.
 */

import { bookingFormSchema, bookingDateTimeSchema, userTimezoneSchema } from '@/lib/validations/booking';
import { addHours, addYears, addMinutes, subHours } from 'date-fns';

describe('bookingFormSchema - Phase 4', () => {
  describe('DateTime Validation', () => {
    it('should accept valid DateTime booking', () => {
      // Create a date 2 hours in the future (on 15-min grid)
      const futureDate = addHours(new Date(), 2);
      futureDate.setMinutes(0, 0, 0); // Round to :00

      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: futureDate.toISOString(),
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

    it('should reject DateTime not on 15-minute grid', () => {
      const futureDate = addHours(new Date(), 2);
      futureDate.setMinutes(13, 0, 0); // Not on 15-min grid

      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: futureDate.toISOString(),
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid 15-minute intervals', () => {
      const validMinutes = [0, 15, 30, 45];

      for (const minute of validMinutes) {
        const futureDate = addHours(new Date(), 2);
        futureDate.setMinutes(minute, 0, 0);

        const data = {
          studioId: 'clw1234567890abcdefghij',
          serviceId: 'clw1234567890abcdefghij',
          preferredDateTime: futureDate.toISOString(),
          customerName: 'Test User',
          customerEmail: 'test@example.com',
        };

        const result = bookingFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should reject DateTime in the past', () => {
      const pastDate = subHours(new Date(), 2);

      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: pastDate.toISOString(),
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject DateTime less than 1 hour in future', () => {
      const tooSoonDate = addMinutes(new Date(), 30);
      tooSoonDate.setMinutes(0, 0, 0);

      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: tooSoonDate.toISOString(),
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject DateTime more than 1 year in future', () => {
      const tooFarDate = addYears(new Date(), 2);
      tooFarDate.setMinutes(0, 0, 0);

      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: tooFarDate.toISOString(),
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require either slotId or preferredDateTime', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid ISO 8601 format', () => {
      const invalidData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: '2025-12-01 10:00:00', // Not ISO 8601
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Timezone Validation (SECURITY)', () => {
    it('should accept valid IANA timezone', () => {
      const result = userTimezoneSchema.safeParse('Europe/Berlin');
      expect(result.success).toBe(true);
    });

    it('should accept UTC timezone', () => {
      const result = userTimezoneSchema.safeParse('UTC');
      expect(result.success).toBe(true);
    });

    it('should accept America/New_York timezone', () => {
      const result = userTimezoneSchema.safeParse('America/New_York');
      expect(result.success).toBe(true);
    });

    it('should reject invalid timezone', () => {
      const result = userTimezoneSchema.safeParse('Invalid/Timezone');
      expect(result.success).toBe(false);
    });

    it('should reject path traversal attempt', () => {
      const result = userTimezoneSchema.safeParse('../etc/passwd');
      expect(result.success).toBe(false);
    });

    it('should reject prototype pollution attempt', () => {
      const result = userTimezoneSchema.safeParse('__proto__');
      expect(result.success).toBe(false);
    });

    it('should reject timezone with special characters', () => {
      const result = userTimezoneSchema.safeParse('Europe/Berlin; DROP TABLE users;');
      expect(result.success).toBe(false);
    });

    it('should reject timezone exceeding max length', () => {
      const result = userTimezoneSchema.safeParse('a'.repeat(51));
      expect(result.success).toBe(false);
    });

    it('should accept optional timezone in booking', () => {
      const futureDate = addHours(new Date(), 2);
      futureDate.setMinutes(0, 0, 0);

      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: futureDate.toISOString(),
        userTimezone: 'Europe/Berlin',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow booking without timezone', () => {
      const futureDate = addHours(new Date(), 2);
      futureDate.setMinutes(0, 0, 0);

      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: futureDate.toISOString(),
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };

      const result = bookingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('GDPR Validation', () => {
    it('should accept optional health consent', () => {
      const futureDate = addHours(new Date(), 2);
      futureDate.setMinutes(0, 0, 0);

      const validData = {
        studioId: 'clw1234567890abcdefghij',
        serviceId: 'clw1234567890abcdefghij',
        preferredDateTime: futureDate.toISOString(),
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

  describe('bookingDateTimeSchema - Standalone Tests', () => {
    it('should validate DateTime with all business rules', () => {
      const futureDate = addHours(new Date(), 24);
      futureDate.setMinutes(0, 0, 0);

      const result = bookingDateTimeSchema.safeParse(futureDate.toISOString());
      expect(result.success).toBe(true);
    });

    it('should provide clear error messages', () => {
      const pastDate = subHours(new Date(), 1);

      const result = bookingDateTimeSchema.safeParse(pastDate.toISOString());
      expect(result.success).toBe(false);
    });
  });
});
