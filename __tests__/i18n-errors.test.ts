/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unit Tests: Internationalized Error Messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  getErrorMessage,
  extractLocaleFromHeader,
  getErrorMessageFromRequest,
  type ErrorMessageKey,
} from '@/lib/i18n-errors';

describe('i18n-errors', () => {
  describe('getErrorMessage', () => {
    it('should return German error message by default', () => {
      const message = getErrorMessage('INVALID_EMAIL');
      expect(message).toBe('Ungültige E-Mail-Adresse');
    });

    it('should return German error message when locale is "de"', () => {
      const message = getErrorMessage('INVALID_EMAIL', 'de');
      expect(message).toBe('Ungültige E-Mail-Adresse');
    });

    it('should return English error message when locale is "en"', () => {
      const message = getErrorMessage('INVALID_EMAIL', 'en');
      expect(message).toBe('Invalid email address');
    });

    it('should handle locale with region code (de-DE)', () => {
      const message = getErrorMessage('TOKEN_EXPIRED', 'de-DE');
      expect(message).toBe('Der Token ist abgelaufen');
    });

    it('should handle locale with region code (en-US)', () => {
      const message = getErrorMessage('TOKEN_EXPIRED', 'en-US');
      expect(message).toBe('Token has expired');
    });

    it('should fallback to German for unsupported locales', () => {
      const message = getErrorMessage('INVALID_EMAIL', 'fr');
      expect(message).toBe('Ungültige E-Mail-Adresse');
    });

    it('should return all error message keys correctly in German', () => {
      const keys: ErrorMessageKey[] = [
        'INVALID_EMAIL',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'TOKEN_ALREADY_USED',
        'USER_NOT_FOUND',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'VALIDATION_ERROR',
        'WEAK_PASSWORD',
        'PASSWORDS_DO_NOT_MATCH',
        'ACCOUNT_INACTIVE',
        'EMAIL_ALREADY_EXISTS',
        'INVALID_CREDENTIALS',
      ];

      keys.forEach((key) => {
        const message = getErrorMessage(key, 'de');
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should return all error message keys correctly in English', () => {
      const keys: ErrorMessageKey[] = [
        'INVALID_EMAIL',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'TOKEN_ALREADY_USED',
        'USER_NOT_FOUND',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'VALIDATION_ERROR',
        'WEAK_PASSWORD',
        'PASSWORDS_DO_NOT_MATCH',
        'ACCOUNT_INACTIVE',
        'EMAIL_ALREADY_EXISTS',
        'INVALID_CREDENTIALS',
      ];

      keys.forEach((key) => {
        const message = getErrorMessage(key, 'en');
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('extractLocaleFromHeader', () => {
    it('should return "de" when header is null', () => {
      const locale = extractLocaleFromHeader(null);
      expect(locale).toBe('de');
    });

    it('should return "de" when header is undefined', () => {
      const locale = extractLocaleFromHeader(undefined);
      expect(locale).toBe('de');
    });

    it('should return "de" when header is empty string', () => {
      const locale = extractLocaleFromHeader('');
      expect(locale).toBe('de');
    });

    it('should extract "en" from simple header', () => {
      const locale = extractLocaleFromHeader('en');
      expect(locale).toBe('en');
    });

    it('should extract "de" from simple header', () => {
      const locale = extractLocaleFromHeader('de');
      expect(locale).toBe('de');
    });

    it('should extract "en" from header with region code', () => {
      const locale = extractLocaleFromHeader('en-US');
      expect(locale).toBe('en');
    });

    it('should extract "de" from header with region code', () => {
      const locale = extractLocaleFromHeader('de-DE');
      expect(locale).toBe('de');
    });

    it('should extract "en" from complex header with quality values', () => {
      const locale = extractLocaleFromHeader('en-US,en;q=0.9,de;q=0.8');
      expect(locale).toBe('en');
    });

    it('should extract "de" from complex header with quality values', () => {
      const locale = extractLocaleFromHeader('de-DE,de;q=0.9,en;q=0.8');
      expect(locale).toBe('de');
    });

    it('should prioritize higher quality value', () => {
      const locale = extractLocaleFromHeader('fr;q=0.9,en;q=0.8,de;q=0.7');
      expect(locale).toBe('en');
    });

    it('should fallback to "de" for unsupported languages', () => {
      const locale = extractLocaleFromHeader('fr-FR,fr;q=0.9,es;q=0.8');
      expect(locale).toBe('de');
    });

    it('should handle malformed headers gracefully', () => {
      const locale = extractLocaleFromHeader('invalid-header-format');
      expect(locale).toBe('de');
    });
  });

  describe('getErrorMessageFromRequest', () => {
    it('should return German error message when no Accept-Language header', () => {
      const mockRequest = {
        headers: new Headers(),
      };

      const message = getErrorMessageFromRequest('INVALID_EMAIL', mockRequest);
      expect(message).toBe('Ungültige E-Mail-Adresse');
    });

    it('should return English error message when Accept-Language is "en"', () => {
      const mockRequest = {
        headers: new Headers({ 'accept-language': 'en' }),
      };

      const message = getErrorMessageFromRequest('INVALID_EMAIL', mockRequest);
      expect(message).toBe('Invalid email address');
    });

    it('should return German error message when Accept-Language is "de"', () => {
      const mockRequest = {
        headers: new Headers({ 'accept-language': 'de' }),
      };

      const message = getErrorMessageFromRequest('INVALID_EMAIL', mockRequest);
      expect(message).toBe('Ungültige E-Mail-Adresse');
    });

    it('should handle complex Accept-Language header', () => {
      const mockRequest = {
        headers: new Headers({
          'accept-language': 'en-US,en;q=0.9,de;q=0.8',
        }),
      };

      const message = getErrorMessageFromRequest('TOKEN_EXPIRED', mockRequest);
      expect(message).toBe('Token has expired');
    });

    it('should fallback to German for unsupported languages', () => {
      const mockRequest = {
        headers: new Headers({ 'accept-language': 'fr-FR' }),
      };

      const message = getErrorMessageFromRequest('INVALID_EMAIL', mockRequest);
      expect(message).toBe('Ungültige E-Mail-Adresse');
    });
  });

  describe('Error Message Consistency', () => {
    it('should have same keys in both German and English', () => {
      const germanKeys: ErrorMessageKey[] = [
        'INVALID_EMAIL',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'TOKEN_ALREADY_USED',
        'USER_NOT_FOUND',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'VALIDATION_ERROR',
        'WEAK_PASSWORD',
        'PASSWORDS_DO_NOT_MATCH',
        'ACCOUNT_INACTIVE',
        'EMAIL_ALREADY_EXISTS',
        'INVALID_CREDENTIALS',
      ];

      germanKeys.forEach((key) => {
        const germanMessage = getErrorMessage(key, 'de');
        const englishMessage = getErrorMessage(key, 'en');

        expect(germanMessage).toBeTruthy();
        expect(englishMessage).toBeTruthy();
        expect(germanMessage).not.toBe(englishMessage); // Should be different languages
      });
    });

    it('should not return empty strings', () => {
      const keys: ErrorMessageKey[] = [
        'INVALID_EMAIL',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'TOKEN_ALREADY_USED',
        'USER_NOT_FOUND',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'VALIDATION_ERROR',
        'WEAK_PASSWORD',
        'PASSWORDS_DO_NOT_MATCH',
        'ACCOUNT_INACTIVE',
        'EMAIL_ALREADY_EXISTS',
        'INVALID_CREDENTIALS',
      ];

      keys.forEach((key) => {
        expect(getErrorMessage(key, 'de')).not.toBe('');
        expect(getErrorMessage(key, 'en')).not.toBe('');
      });
    });
  });
});
