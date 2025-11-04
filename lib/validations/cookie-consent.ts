/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Consent Validation Schema
 */

import { z } from 'zod';

/**
 * Cookie Consent Schema
 * Validates cookie consent preferences according to ePrivacy Directive
 */
export const cookieConsentSchema = z.object({
  necessary: z.literal(true, {
    errorMap: () => ({ message: 'Necessary cookies must always be accepted' }),
  }),
  analytics: z.boolean(),
  marketing: z.boolean(),
  timestamp: z.string().datetime(),
});

/**
 * Type inference for cookie consent
 */
export type CookieConsentInput = z.infer<typeof cookieConsentSchema>;

/**
 * Partial schema for updates (without timestamp)
 */
export const cookieConsentUpdateSchema = z.object({
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
});

export type CookieConsentUpdate = z.infer<typeof cookieConsentUpdateSchema>;
