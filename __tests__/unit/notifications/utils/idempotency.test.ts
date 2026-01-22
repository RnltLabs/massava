/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Idempotency Key Generator Tests
 * Unit tests for notification idempotency key generation
 */

import { describe, it, expect } from '@jest/globals';
import { generateIdempotencyKey } from '@/lib/notifications/utils/idempotency';

describe('generateIdempotencyKey', () => {
  const baseInput = {
    userId: 'user-123',
    type: 'BOOKING_CONFIRMED',
    timestamp: 1609459200000, // 2021-01-01 00:00:00
  };

  describe('Konsistenz', () => {
    it('sollte gleichen Key für identische Inputs generieren', () => {
      const key1 = generateIdempotencyKey(baseInput);
      const key2 = generateIdempotencyKey(baseInput);

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(32);
    });

    it('sollte verschiedene Keys für verschiedene UserIDs generieren', () => {
      const key1 = generateIdempotencyKey(baseInput);
      const key2 = generateIdempotencyKey({
        ...baseInput,
        userId: 'user-456',
      });

      expect(key1).not.toBe(key2);
    });

    it('sollte verschiedene Keys für verschiedene Typen generieren', () => {
      const key1 = generateIdempotencyKey(baseInput);
      const key2 = generateIdempotencyKey({
        ...baseInput,
        type: 'BOOKING_CANCELLED',
      });

      expect(key1).not.toBe(key2);
    });

    it('sollte verschiedene Keys für verschiedene BookingIDs generieren', () => {
      const key1 = generateIdempotencyKey({
        ...baseInput,
        bookingId: 'booking-123',
      });
      const key2 = generateIdempotencyKey({
        ...baseInput,
        bookingId: 'booking-456',
      });

      expect(key1).not.toBe(key2);
    });
  });

  describe('Zeitfenster-basierte Keys (1-Minute-Fenster)', () => {
    it('sollte gleichen Key für Timestamps im selben Zeitfenster generieren', () => {
      const timestamp1 = 1609459200000; // 00:00:00
      const timestamp2 = 1609459259999; // 00:00:59.999

      const key1 = generateIdempotencyKey({
        ...baseInput,
        timestamp: timestamp1,
      });
      const key2 = generateIdempotencyKey({
        ...baseInput,
        timestamp: timestamp2,
      });

      expect(key1).toBe(key2);
    });

    it('sollte verschiedene Keys für Timestamps in verschiedenen Zeitfenstern generieren', () => {
      const timestamp1 = 1609459200000; // 00:00:00
      const timestamp2 = 1609459260000; // 00:01:00

      const key1 = generateIdempotencyKey({
        ...baseInput,
        timestamp: timestamp1,
      });
      const key2 = generateIdempotencyKey({
        ...baseInput,
        timestamp: timestamp2,
      });

      expect(key1).not.toBe(key2);
    });

    it('sollte Timestamp auf volle Minute abrunden', () => {
      // Alle Timestamps in derselben Minute sollten denselben Key erzeugen
      const timestamps = [
        1609459200000, // 00:00:00
        1609459210000, // 00:00:10
        1609459230000, // 00:00:30
        1609459259999, // 00:00:59.999
      ];

      const keys = timestamps.map((timestamp) =>
        generateIdempotencyKey({
          ...baseInput,
          timestamp,
        })
      );

      // Alle Keys sollten identisch sein
      keys.forEach((key) => {
        expect(key).toBe(keys[0]);
      });
    });

    it('sollte Grenzfall am Minutenwechsel korrekt behandeln', () => {
      const timestamp1 = 1609459259999; // 00:00:59.999
      const timestamp2 = 1609459260000; // 00:01:00.000

      const key1 = generateIdempotencyKey({
        ...baseInput,
        timestamp: timestamp1,
      });
      const key2 = generateIdempotencyKey({
        ...baseInput,
        timestamp: timestamp2,
      });

      expect(key1).not.toBe(key2);
    });
  });

  describe('Edge Cases', () => {
    it('sollte mit leerer BookingID umgehen (undefined)', () => {
      const key1 = generateIdempotencyKey({
        ...baseInput,
        bookingId: undefined,
      });

      expect(key1).toHaveLength(32);
      expect(typeof key1).toBe('string');
    });

    it('sollte mit sehr langer UserID umgehen', () => {
      const longUserId = 'user-' + 'a'.repeat(1000);
      const key = generateIdempotencyKey({
        ...baseInput,
        userId: longUserId,
      });

      expect(key).toHaveLength(32);
      expect(typeof key).toBe('string');
    });

    it('sollte mit Sonderzeichen in Inputs umgehen', () => {
      const key = generateIdempotencyKey({
        ...baseInput,
        userId: 'user-äöü-€-😊',
        type: 'TYPE_WITH_EMOJI_🎉',
        bookingId: 'booking-特殊文字',
      });

      expect(key).toHaveLength(32);
      expect(typeof key).toBe('string');
    });

    it('sollte mit negativem Timestamp umgehen', () => {
      const key = generateIdempotencyKey({
        ...baseInput,
        timestamp: -1609459200000,
      });

      expect(key).toHaveLength(32);
      expect(typeof key).toBe('string');
    });

    it('sollte mit Timestamp 0 umgehen', () => {
      const key = generateIdempotencyKey({
        ...baseInput,
        timestamp: 0,
      });

      expect(key).toHaveLength(32);
      expect(typeof key).toBe('string');
    });

    it('sollte mit sehr großem Timestamp umgehen (Jahr 9999)', () => {
      const key = generateIdempotencyKey({
        ...baseInput,
        timestamp: 253402300799999, // 9999-12-31 23:59:59
      });

      expect(key).toHaveLength(32);
      expect(typeof key).toBe('string');
    });
  });

  describe('Hash-Format', () => {
    it('sollte hexadezimalen String zurückgeben', () => {
      const key = generateIdempotencyKey(baseInput);

      // Nur hexadezimale Zeichen (0-9, a-f)
      expect(key).toMatch(/^[0-9a-f]{32}$/);
    });

    it('sollte immer 32 Zeichen lang sein', () => {
      const testCases = [
        baseInput,
        { ...baseInput, userId: 'a' },
        { ...baseInput, userId: 'a'.repeat(1000) },
        { ...baseInput, bookingId: 'booking-123' },
        { ...baseInput, timestamp: 0 },
      ];

      testCases.forEach((input) => {
        const key = generateIdempotencyKey(input);
        expect(key).toHaveLength(32);
      });
    });

    it('sollte deterministisch sein (mehrere Aufrufe)', () => {
      const keys = Array.from({ length: 100 }, () =>
        generateIdempotencyKey(baseInput)
      );

      // Alle Keys sollten identisch sein
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(1);
    });
  });

  describe('Kollisionsresistenz', () => {
    it('sollte keine Kollisionen für verschiedene Inputs haben', () => {
      const keys = new Set<string>();
      const userIds = ['user-1', 'user-2', 'user-3'];
      const types = ['TYPE_A', 'TYPE_B', 'TYPE_C'];
      const timestamps = [1000000000, 2000000000, 3000000000];

      userIds.forEach((userId) => {
        types.forEach((type) => {
          timestamps.forEach((timestamp) => {
            const key = generateIdempotencyKey({
              userId,
              type,
              timestamp,
            });
            keys.add(key);
          });
        });
      });

      // 3 * 3 * 3 = 27 verschiedene Keys
      expect(keys.size).toBe(27);
    });

    it('sollte verschiedene Keys für ähnliche Inputs generieren', () => {
      const keys = [
        generateIdempotencyKey({
          ...baseInput,
          userId: 'user-123',
          type: 'TYPE_A',
        }),
        generateIdempotencyKey({
          ...baseInput,
          userId: 'user-124',
          type: 'TYPE_A',
        }),
        generateIdempotencyKey({
          ...baseInput,
          userId: 'user-123',
          type: 'TYPE_B',
        }),
      ];

      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(3);
    });
  });

  describe('Reale Szenarien', () => {
    it('sollte gleichen Key für Retry innerhalb 1 Minute generieren', () => {
      const originalTimestamp = 1609459200000; // Fixed timestamp
      const retryTimestamp = originalTimestamp + 30000; // 30 Sekunden später

      const key1 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-456',
        timestamp: originalTimestamp,
      });

      const key2 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-456',
        timestamp: retryTimestamp,
      });

      expect(key1).toBe(key2);
    });

    it('sollte verschiedenen Key für Retry nach 1 Minute generieren', () => {
      const originalTimestamp = 1609459200000; // Fixed timestamp
      const retryTimestamp = originalTimestamp + 70000; // 70 Sekunden später

      const key1 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-456',
        timestamp: originalTimestamp,
      });

      const key2 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-456',
        timestamp: retryTimestamp,
      });

      expect(key1).not.toBe(key2);
    });

    it('sollte verschiedene Keys für verschiedene Bookings desselben Users generieren', () => {
      const key1 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-1',
        timestamp: baseInput.timestamp,
      });

      const key2 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-2',
        timestamp: baseInput.timestamp,
      });

      expect(key1).not.toBe(key2);
    });

    it('sollte verschiedene Keys für verschiedene Notification-Types desselben Bookings generieren', () => {
      const key1 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_CONFIRMED',
        bookingId: 'booking-1',
        timestamp: baseInput.timestamp,
      });

      const key2 = generateIdempotencyKey({
        userId: 'user-123',
        type: 'BOOKING_REMINDER_CUSTOMER',
        bookingId: 'booking-1',
        timestamp: baseInput.timestamp,
      });

      expect(key1).not.toBe(key2);
    });
  });
});
