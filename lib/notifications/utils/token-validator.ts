/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Device Token Validator
 *
 * Validates device tokens for FCM and APNS to prevent storage
 * of malformed or malicious tokens.
 *
 * Security considerations:
 * - Reject tokens with invalid format
 * - Prevent SQL injection attempts in tokens
 * - Validate length to prevent DoS attacks
 * - Check character sets to prevent XSS
 */

import type { DevicePlatform } from '@/app/generated/prisma';

/**
 * FCM token validation rules:
 * - Length: 100-300 characters (typical: 152-163)
 * - Characters: Alphanumeric + colon + underscore + hyphen
 * - Prefixes: May start with common FCM prefixes
 */
const FCM_TOKEN_MIN_LENGTH = 100;
const FCM_TOKEN_MAX_LENGTH = 300;
const FCM_TOKEN_PATTERN = /^[A-Za-z0-9:_-]+$/;

/**
 * Common FCM token prefixes (not exhaustive, just common patterns)
 * FCM tokens don't have a strict prefix requirement, but these are common
 */
const FCM_TOKEN_COMMON_PREFIXES = ['c', 'd', 'e', 'f'];

/**
 * APNS token validation rules:
 * - Length: Exactly 64 characters (hex format)
 * - Characters: Hexadecimal only (0-9, a-f, A-F)
 * - No spaces or special characters
 */
const APNS_TOKEN_LENGTH = 64;
const APNS_TOKEN_PATTERN = /^[0-9a-fA-F]{64}$/;

/**
 * Web push token validation (Web Push API)
 * - Length: Variable, typically 150-300 characters
 * - Format: Base64url encoded (RFC 4648)
 */
const WEB_TOKEN_MIN_LENGTH = 50;
const WEB_TOKEN_MAX_LENGTH = 500;
const WEB_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/; // Base64url

/**
 * Result type for token validation
 */
export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

/**
 * Validates an FCM (Firebase Cloud Messaging) token
 *
 * @param token - The FCM token to validate
 * @returns Validation result with error details if invalid
 */
export function validateFCMToken(token: string): TokenValidationResult {
  // Check type
  if (typeof token !== 'string') {
    return {
      valid: false,
      error: 'Invalid token type',
      details: 'Token must be a string',
    };
  }

  // Check length
  if (token.length < FCM_TOKEN_MIN_LENGTH) {
    return {
      valid: false,
      error: 'Token too short',
      details: `FCM tokens must be at least ${FCM_TOKEN_MIN_LENGTH} characters`,
    };
  }

  if (token.length > FCM_TOKEN_MAX_LENGTH) {
    return {
      valid: false,
      error: 'Token too long',
      details: `FCM tokens must not exceed ${FCM_TOKEN_MAX_LENGTH} characters`,
    };
  }

  // Check character set (prevent injection attacks)
  if (!FCM_TOKEN_PATTERN.test(token)) {
    return {
      valid: false,
      error: 'Invalid token format',
      details: 'FCM tokens may only contain alphanumeric characters, colons, underscores, and hyphens',
    };
  }

  // Check for suspicious patterns (SQL injection attempts)
  const suspiciousPatterns = [
    /(\bOR\b|\bAND\b)/i, // SQL keywords
    /['"`;]/,            // SQL quotes/semicolons
    /<script/i,          // XSS attempts
    /javascript:/i,      // JavaScript protocol
    /\$\{/,              // Template literal injection
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(token)) {
      return {
        valid: false,
        error: 'Suspicious token content',
        details: 'Token contains potentially malicious patterns',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an APNS (Apple Push Notification Service) token
 *
 * @param token - The APNS device token to validate
 * @returns Validation result with error details if invalid
 */
export function validateAPNSToken(token: string): TokenValidationResult {
  // Check type
  if (typeof token !== 'string') {
    return {
      valid: false,
      error: 'Invalid token type',
      details: 'Token must be a string',
    };
  }

  // Remove any spaces or angle brackets (iOS sometimes formats with these)
  const cleanToken = token.replace(/[\s<>]/g, '');

  // Check exact length
  if (cleanToken.length !== APNS_TOKEN_LENGTH) {
    return {
      valid: false,
      error: 'Invalid token length',
      details: `APNS tokens must be exactly ${APNS_TOKEN_LENGTH} hexadecimal characters`,
    };
  }

  // Check hexadecimal format
  if (!APNS_TOKEN_PATTERN.test(cleanToken)) {
    return {
      valid: false,
      error: 'Invalid token format',
      details: 'APNS tokens must contain only hexadecimal characters (0-9, a-f)',
    };
  }

  return { valid: true };
}

/**
 * Validates a Web Push token
 *
 * @param token - The Web Push subscription endpoint or token
 * @returns Validation result with error details if invalid
 */
export function validateWebToken(token: string): TokenValidationResult {
  // Check type
  if (typeof token !== 'string') {
    return {
      valid: false,
      error: 'Invalid token type',
      details: 'Token must be a string',
    };
  }

  // Check length
  if (token.length < WEB_TOKEN_MIN_LENGTH) {
    return {
      valid: false,
      error: 'Token too short',
      details: `Web tokens must be at least ${WEB_TOKEN_MIN_LENGTH} characters`,
    };
  }

  if (token.length > WEB_TOKEN_MAX_LENGTH) {
    return {
      valid: false,
      error: 'Token too long',
      details: `Web tokens must not exceed ${WEB_TOKEN_MAX_LENGTH} characters`,
    };
  }

  // Web tokens can be URLs (subscription endpoints) or base64url strings
  // Check if it's a valid URL
  if (token.startsWith('http://') || token.startsWith('https://')) {
    try {
      new URL(token);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format',
        details: 'Web token appears to be a URL but is malformed',
      };
    }
  }

  // Otherwise, check base64url format
  if (!WEB_TOKEN_PATTERN.test(token)) {
    return {
      valid: false,
      error: 'Invalid token format',
      details: 'Web tokens must be valid URLs or base64url-encoded strings',
    };
  }

  return { valid: true };
}

/**
 * Validates a device token based on the platform
 *
 * @param token - The device token to validate
 * @param platform - The device platform (IOS, ANDROID, WEB)
 * @returns Validation result with error details if invalid
 */
export function validateDeviceToken(
  token: string,
  platform: DevicePlatform
): TokenValidationResult {
  // Basic checks
  if (!token || token.trim().length === 0) {
    return {
      valid: false,
      error: 'Empty token',
      details: 'Token cannot be empty',
    };
  }

  // Platform-specific validation
  switch (platform) {
    case 'IOS':
      // iOS can use either APNS tokens or FCM tokens
      // Try APNS format first (native)
      const apnsResult = validateAPNSToken(token);
      if (apnsResult.valid) {
        return apnsResult;
      }

      // Fall back to FCM format (if using FCM for iOS)
      const fcmResult = validateFCMToken(token);
      if (fcmResult.valid) {
        return fcmResult;
      }

      // Neither format worked
      return {
        valid: false,
        error: 'Invalid iOS token',
        details: 'Token must be either a 64-character APNS token or a valid FCM token',
      };

    case 'ANDROID':
      return validateFCMToken(token);

    case 'WEB':
      return validateWebToken(token);

    default:
      return {
        valid: false,
        error: 'Invalid platform',
        details: `Platform "${platform}" is not supported`,
      };
  }
}

/**
 * Checks if a token appears to be an FCM token (vs APNS)
 * Useful for determining token type when platform is iOS
 *
 * @param token - The token to check
 * @returns true if token appears to be FCM format
 */
export function isFCMToken(token: string): boolean {
  return (
    token.length >= FCM_TOKEN_MIN_LENGTH &&
    token.length <= FCM_TOKEN_MAX_LENGTH &&
    FCM_TOKEN_PATTERN.test(token)
  );
}

/**
 * Checks if a token appears to be an APNS token
 *
 * @param token - The token to check
 * @returns true if token appears to be APNS format
 */
export function isAPNSToken(token: string): boolean {
  const cleanToken = token.replace(/[\s<>]/g, '');
  return cleanToken.length === APNS_TOKEN_LENGTH && APNS_TOKEN_PATTERN.test(cleanToken);
}

/**
 * Sanitizes a token by removing whitespace and common formatting
 *
 * @param token - The token to sanitize
 * @returns Sanitized token
 */
export function sanitizeToken(token: string): string {
  return token.trim().replace(/[\s<>]/g, '');
}
