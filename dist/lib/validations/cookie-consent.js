"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Consent Validation Schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieConsentUpdateSchema = exports.cookieConsentSchema = void 0;
const zod_1 = require("zod");
/**
 * Cookie Consent Schema
 * Validates cookie consent preferences according to ePrivacy Directive
 */
exports.cookieConsentSchema = zod_1.z.object({
    necessary: zod_1.z.literal(true).refine((val) => val === true, {
        message: 'Necessary cookies must always be accepted',
    }),
    analytics: zod_1.z.boolean(),
    marketing: zod_1.z.boolean(),
    timestamp: zod_1.z.string().datetime(),
});
/**
 * Partial schema for updates (without timestamp)
 */
exports.cookieConsentUpdateSchema = zod_1.z.object({
    necessary: zod_1.z.literal(true),
    analytics: zod_1.z.boolean(),
    marketing: zod_1.z.boolean(),
});
