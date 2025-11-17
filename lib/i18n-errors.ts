/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Internationalized Error Messages
 *
 * Provides localized error messages for API responses based on Accept-Language header.
 *
 * Usage:
 * ```typescript
 * import { getErrorMessage } from '@/lib/i18n-errors';
 *
 * const errorMessage = getErrorMessage('INVALID_EMAIL', 'de');
 * ```
 */

export type ErrorMessageKey =
  | 'INVALID_EMAIL'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_ALREADY_USED'
  | 'USER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'WEAK_PASSWORD'
  | 'PASSWORDS_DO_NOT_MATCH'
  | 'ACCOUNT_INACTIVE'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS';

export type SupportedLocale = 'de' | 'en';

/**
 * Error message translations
 */
const errorMessages: Record<SupportedLocale, Record<ErrorMessageKey, string>> = {
  de: {
    INVALID_EMAIL: 'Ungültige E-Mail-Adresse',
    TOKEN_EXPIRED: 'Der Token ist abgelaufen',
    TOKEN_INVALID: 'Ungültiger Token',
    TOKEN_ALREADY_USED: 'Dieser Token wurde bereits verwendet',
    USER_NOT_FOUND: 'Benutzer nicht gefunden',
    UNAUTHORIZED: 'Nicht autorisiert',
    FORBIDDEN: 'Zugriff verweigert',
    RATE_LIMIT_EXCEEDED: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    INTERNAL_SERVER_ERROR: 'Ein Fehler ist aufgetreten',
    VALIDATION_ERROR: 'Validierungsfehler',
    WEAK_PASSWORD: 'Das Passwort ist zu schwach',
    PASSWORDS_DO_NOT_MATCH: 'Die Passwörter stimmen nicht überein',
    ACCOUNT_INACTIVE: 'Das Konto ist nicht aktiv',
    EMAIL_ALREADY_EXISTS: 'Diese E-Mail-Adresse ist bereits registriert',
    INVALID_CREDENTIALS: 'Ungültige Anmeldedaten',
  },
  en: {
    INVALID_EMAIL: 'Invalid email address',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    TOKEN_ALREADY_USED: 'This token has already been used',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Access forbidden',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
    INTERNAL_SERVER_ERROR: 'An error occurred',
    VALIDATION_ERROR: 'Validation error',
    WEAK_PASSWORD: 'Password is too weak',
    PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
    ACCOUNT_INACTIVE: 'Account is not active',
    EMAIL_ALREADY_EXISTS: 'This email address is already registered',
    INVALID_CREDENTIALS: 'Invalid credentials',
  },
};

/**
 * Get localized error message
 *
 * @param key - Error message key
 * @param locale - Locale code (defaults to 'de')
 * @returns Localized error message
 *
 * @example
 * ```typescript
 * const message = getErrorMessage('INVALID_EMAIL', 'de');
 * // Returns: "Ungültige E-Mail-Adresse"
 * ```
 */
export function getErrorMessage(
  key: ErrorMessageKey,
  locale: string = 'de'
): string {
  // Normalize locale (e.g., 'de-DE' -> 'de')
  const normalizedLocale = locale.split('-')[0].toLowerCase();

  // Fallback to 'de' if locale is not supported
  const supportedLocale: SupportedLocale =
    normalizedLocale === 'en' ? 'en' : 'de';

  return errorMessages[supportedLocale][key] || errorMessages.de[key];
}

/**
 * Extract locale from Accept-Language header
 *
 * @param acceptLanguageHeader - Accept-Language header value
 * @returns Extracted locale code (defaults to 'de')
 *
 * @example
 * ```typescript
 * const locale = extractLocaleFromHeader('en-US,en;q=0.9,de;q=0.8');
 * // Returns: 'en'
 * ```
 */
export function extractLocaleFromHeader(
  acceptLanguageHeader: string | null | undefined
): SupportedLocale {
  if (!acceptLanguageHeader) {
    return 'de';
  }

  // Parse Accept-Language header (e.g., 'en-US,en;q=0.9,de;q=0.8')
  const languages = acceptLanguageHeader
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      return { code: code.split('-')[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language
  const supportedLanguage = languages.find(
    (lang) => lang.code === 'en' || lang.code === 'de'
  );

  return (supportedLanguage?.code as SupportedLocale) || 'de';
}

/**
 * Get error message from request headers
 *
 * @param key - Error message key
 * @param request - Next.js request object
 * @returns Localized error message based on Accept-Language header
 *
 * @example
 * ```typescript
 * import { NextRequest } from 'next/server';
 *
 * export async function POST(request: NextRequest) {
 *   const errorMessage = getErrorMessageFromRequest('INVALID_EMAIL', request);
 *   return NextResponse.json({ error: errorMessage }, { status: 400 });
 * }
 * ```
 */
export function getErrorMessageFromRequest(
  key: ErrorMessageKey,
  request: { headers: Headers }
): string {
  const acceptLanguage = request.headers.get('accept-language');
  const locale = extractLocaleFromHeader(acceptLanguage);
  return getErrorMessage(key, locale);
}
