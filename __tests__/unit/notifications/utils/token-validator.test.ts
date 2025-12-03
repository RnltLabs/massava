/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Device Token Validator Tests
 * Unit tests for push notification token validation
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateDeviceToken,
  validateFCMToken,
  validateAPNSToken,
  validateWebToken,
  isFCMToken,
  isAPNSToken,
  sanitizeToken,
} from '@/lib/notifications/utils/token-validator';

describe('Token Validator', () => {
  // ============================================
  // FCM Token Validation Tests
  // ============================================

  describe('validateFCMToken', () => {
    describe('Valid FCM tokens', () => {
      it('should accept valid FCM token (typical length)', () => {
        const validToken = 'c' + 'A'.repeat(151); // 152 characters (typical FCM token length)
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept FCM token with colons', () => {
        const validToken = 'cPdK8zRxQ:APA91bH' + 'a'.repeat(135);
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept FCM token with underscores', () => {
        const validToken = 'c_token_' + 'A'.repeat(145);
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept FCM token with hyphens', () => {
        const validToken = 'c-token-' + 'A'.repeat(145);
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept FCM token at minimum length (100 chars)', () => {
        const validToken = 'c' + 'A'.repeat(99);
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept FCM token at maximum length (300 chars)', () => {
        const validToken = 'c' + 'A'.repeat(299);
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept realistic FCM token format', () => {
        const validToken =
          'cPdK8zRxQ7y:APA91bHsR8zK3L4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8cD9eF0gH1iJ';
        const result = validateFCMToken(validToken);
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid FCM tokens', () => {
      it('should reject token that is too short', () => {
        const shortToken = 'c' + 'A'.repeat(50);
        const result = validateFCMToken(shortToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token too short');
      });

      it('should reject token that is too long', () => {
        const longToken = 'c' + 'A'.repeat(350);
        const result = validateFCMToken(longToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token too long');
      });

      it('should reject token with spaces', () => {
        const tokenWithSpace = 'cPdK8zRxQ:APA91bH' + ' '.repeat(100) + 'abc';
        const result = validateFCMToken(tokenWithSpace);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });

      it('should reject token with special characters', () => {
        const invalidToken = 'c' + 'A'.repeat(100) + '@#$%';
        const result = validateFCMToken(invalidToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });

      it('should reject non-string tokens', () => {
        const result = validateFCMToken(12345 as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token type');
      });

      it('should reject SQL injection attempt', () => {
        const sqlInjection = "c' OR '1'='1" + 'A'.repeat(90);
        const result = validateFCMToken(sqlInjection);
        expect(result.valid).toBe(false);
        // Will fail on character pattern first, before suspicious content check
        expect(['Invalid token format', 'Suspicious token content']).toContain(result.error);
      });

      it('should reject SQL injection with AND keyword', () => {
        const sqlInjection = 'c' + 'A'.repeat(90) + " AND 1=1--";
        const result = validateFCMToken(sqlInjection);
        expect(result.valid).toBe(false);
        // Will fail on character pattern first (space), before suspicious content check
        expect(['Invalid token format', 'Suspicious token content']).toContain(result.error);
      });

      it('should reject XSS attempt with script tag', () => {
        const xssAttempt = '<script>alert(1)</script>' + 'A'.repeat(80);
        const result = validateFCMToken(xssAttempt);
        expect(result.valid).toBe(false);
        // Will fail on character pattern first (angle brackets), before suspicious content check
        expect(['Invalid token format', 'Suspicious token content']).toContain(result.error);
      });

      it('should reject JavaScript protocol injection', () => {
        const jsInjection = 'javascript:alert(1)' + 'A'.repeat(85);
        const result = validateFCMToken(jsInjection);
        expect(result.valid).toBe(false);
        // Will fail on character pattern first (parentheses), before suspicious content check
        expect(['Invalid token format', 'Suspicious token content']).toContain(result.error);
      });

      it('should reject template literal injection', () => {
        const templateInjection = 'c${alert(1)}' + 'A'.repeat(90);
        const result = validateFCMToken(templateInjection);
        expect(result.valid).toBe(false);
        // Will fail on character pattern first (braces), before suspicious content check
        expect(['Invalid token format', 'Suspicious token content']).toContain(result.error);
      });
    });
  });

  // ============================================
  // APNS Token Validation Tests
  // ============================================

  describe('validateAPNSToken', () => {
    describe('Valid APNS tokens', () => {
      it('should accept valid 64-character hex token', () => {
        const validToken = 'a'.repeat(64);
        const result = validateAPNSToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept token with uppercase hex', () => {
        const validToken = 'ABCDEF0123456789' + 'A'.repeat(48);
        const result = validateAPNSToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept token with mixed case hex', () => {
        const validToken = 'AbCdEf0123456789' + 'a'.repeat(48);
        const result = validateAPNSToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept realistic APNS token', () => {
        const validToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const result = validateAPNSToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should handle token with spaces (strips them)', () => {
        const tokenWithSpaces = '1234 5678 90ab cdef 1234 5678 90ab cdef 1234 5678 90ab cdef 1234 5678 90ab cdef';
        const result = validateAPNSToken(tokenWithSpaces);
        expect(result.valid).toBe(true);
      });

      it('should handle token with angle brackets (iOS format)', () => {
        const iosFormattedToken = '<1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef>';
        const result = validateAPNSToken(iosFormattedToken);
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid APNS tokens', () => {
      it('should reject token that is too short', () => {
        const shortToken = 'a'.repeat(32);
        const result = validateAPNSToken(shortToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token length');
      });

      it('should reject token that is too long', () => {
        const longToken = 'a'.repeat(128);
        const result = validateAPNSToken(longToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token length');
      });

      it('should reject token with non-hex characters', () => {
        const invalidToken = 'g'.repeat(64);
        const result = validateAPNSToken(invalidToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });

      it('should reject token with special characters', () => {
        const invalidToken = 'a'.repeat(63) + '@';
        const result = validateAPNSToken(invalidToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });

      it('should reject non-string tokens', () => {
        const result = validateAPNSToken(null as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token type');
      });
    });
  });

  // ============================================
  // Web Token Validation Tests
  // ============================================

  describe('validateWebToken', () => {
    describe('Valid Web tokens', () => {
      it('should accept valid base64url token', () => {
        const validToken = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        const result = validateWebToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept valid HTTPS URL endpoint', () => {
        const validUrl = 'https://fcm.googleapis.com/fcm/send/abc123def456ghi789jkl012mno345';
        const result = validateWebToken(validUrl);
        expect(result.valid).toBe(true);
      });

      it('should accept HTTP URL endpoint (some services)', () => {
        // URL must be at least 50 characters
        const validUrl = 'http://push.example.com/endpoint/12345678901234567890';
        const result = validateWebToken(validUrl);
        expect(result.valid).toBe(true);
      });

      it('should accept token with underscores and hyphens', () => {
        const validToken = 'abc_def-ghi_jkl-' + 'A'.repeat(40);
        const result = validateWebToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept token at minimum length (50 chars)', () => {
        const validToken = 'A'.repeat(50);
        const result = validateWebToken(validToken);
        expect(result.valid).toBe(true);
      });

      it('should accept token at maximum length (500 chars)', () => {
        const validToken = 'A'.repeat(500);
        const result = validateWebToken(validToken);
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid Web tokens', () => {
      it('should reject token that is too short', () => {
        const shortToken = 'A'.repeat(30);
        const result = validateWebToken(shortToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token too short');
      });

      it('should reject token that is too long', () => {
        const longToken = 'A'.repeat(600);
        const result = validateWebToken(longToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token too long');
      });

      it('should reject malformed URL', () => {
        // URL with spaces (50+ chars)
        const malformedUrl = 'https://invalid url with spaces.com/endpoint/12345';
        const result = validateWebToken(malformedUrl);
        expect(result.valid).toBe(false);
        // Might fail on different checks depending on URL parsing
        expect(['Invalid URL format', 'Invalid token format']).toContain(result.error);
      });

      it('should reject token with invalid characters', () => {
        const invalidToken = 'A'.repeat(50) + '@#$%';
        const result = validateWebToken(invalidToken);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });

      it('should reject non-string tokens', () => {
        const result = validateWebToken(undefined as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token type');
      });
    });
  });

  // ============================================
  // Platform-Specific Validation Tests
  // ============================================

  describe('validateDeviceToken', () => {
    describe('iOS platform', () => {
      it('should accept valid APNS token for iOS', () => {
        const apnsToken = 'a'.repeat(64);
        const result = validateDeviceToken(apnsToken, 'IOS');
        expect(result.valid).toBe(true);
      });

      it('should accept valid FCM token for iOS (fallback)', () => {
        const fcmToken = 'c' + 'A'.repeat(151);
        const result = validateDeviceToken(fcmToken, 'IOS');
        expect(result.valid).toBe(true);
      });

      it('should reject invalid token for iOS', () => {
        const invalidToken = 'invalid';
        const result = validateDeviceToken(invalidToken, 'IOS');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid iOS token');
      });
    });

    describe('Android platform', () => {
      it('should accept valid FCM token for Android', () => {
        const fcmToken = 'c' + 'A'.repeat(151);
        const result = validateDeviceToken(fcmToken, 'ANDROID');
        expect(result.valid).toBe(true);
      });

      it('should reject invalid token for Android', () => {
        const invalidToken = 'short';
        const result = validateDeviceToken(invalidToken, 'ANDROID');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token too short');
      });
    });

    describe('Web platform', () => {
      it('should accept valid Web token', () => {
        const webToken = 'A'.repeat(100);
        const result = validateDeviceToken(webToken, 'WEB');
        expect(result.valid).toBe(true);
      });

      it('should accept valid Web URL endpoint', () => {
        // URL must be at least 50 characters
        const webUrl = 'https://push.example.com/endpoint/1234567890123456';
        const result = validateDeviceToken(webUrl, 'WEB');
        expect(result.valid).toBe(true);
      });

      it('should reject invalid token for Web', () => {
        const invalidToken = 'short';
        const result = validateDeviceToken(invalidToken, 'WEB');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token too short');
      });
    });

    describe('Edge cases', () => {
      it('should reject empty token', () => {
        const result = validateDeviceToken('', 'ANDROID');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Empty token');
      });

      it('should reject whitespace-only token', () => {
        const result = validateDeviceToken('   ', 'ANDROID');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Empty token');
      });

      it('should reject invalid platform', () => {
        const result = validateDeviceToken('token', 'INVALID' as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid platform');
      });
    });
  });

  // ============================================
  // Helper Function Tests
  // ============================================

  describe('isFCMToken', () => {
    it('should return true for valid FCM token', () => {
      const fcmToken = 'c' + 'A'.repeat(151);
      expect(isFCMToken(fcmToken)).toBe(true);
    });

    it('should return false for APNS token', () => {
      const apnsToken = 'a'.repeat(64);
      expect(isFCMToken(apnsToken)).toBe(false);
    });

    it('should return false for short token', () => {
      expect(isFCMToken('short')).toBe(false);
    });

    it('should return false for token with invalid characters', () => {
      const invalidToken = 'c' + 'A'.repeat(100) + '@#$';
      expect(isFCMToken(invalidToken)).toBe(false);
    });
  });

  describe('isAPNSToken', () => {
    it('should return true for valid APNS token', () => {
      const apnsToken = 'a'.repeat(64);
      expect(isAPNSToken(apnsToken)).toBe(true);
    });

    it('should return false for FCM token', () => {
      const fcmToken = 'c' + 'A'.repeat(151);
      expect(isAPNSToken(fcmToken)).toBe(false);
    });

    it('should return false for short token', () => {
      expect(isAPNSToken('short')).toBe(false);
    });

    it('should handle token with spaces (strips them)', () => {
      // Create a 64-char token with spaces: "a a a a..." (32 'a' chars + 31 spaces)
      // After stripping spaces, should be 64 'a' chars total
      const tokenWithSpaces = ('a' + ' ').repeat(64).trim();
      expect(isAPNSToken(tokenWithSpaces)).toBe(true);
    });
  });

  describe('sanitizeToken', () => {
    it('should remove leading whitespace', () => {
      expect(sanitizeToken('  token')).toBe('token');
    });

    it('should remove trailing whitespace', () => {
      expect(sanitizeToken('token  ')).toBe('token');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeToken('<token>')).toBe('token');
    });

    it('should remove internal spaces', () => {
      expect(sanitizeToken('to ken')).toBe('token');
    });

    it('should handle combined formatting', () => {
      expect(sanitizeToken('  <to ken>  ')).toBe('token');
    });

    it('should not modify clean tokens', () => {
      expect(sanitizeToken('cleantoken')).toBe('cleantoken');
    });
  });
});
