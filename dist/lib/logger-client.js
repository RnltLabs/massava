"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Client-Side Structured Logging
 * Phase 2: Code Quality - Browser-Safe Logging
 *
 * This logger is used in browser/Edge runtime where Winston is not available.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.generateCorrelationId = generateCorrelationId;
exports.createLogger = createLogger;
exports.anonymizeIP = anonymizeIP;
exports.getCorrelationId = getCorrelationId;
exports.getClientIP = getClientIP;
exports.getUserAgent = getUserAgent;
exports.logRequest = logRequest;
exports.logResponse = logResponse;
const Sentry = __importStar(require("@sentry/nextjs"));
const crypto_1 = require("crypto");
/**
 * Generate a unique correlation ID for request tracing
 */
function generateCorrelationId() {
    return (0, crypto_1.randomBytes)(16).toString('hex');
}
/**
 * Simple Client-Side Logger
 */
class SimpleLogger {
    log(level, message, context) {
        const correlationId = context?.correlationId || generateCorrelationId();
        // Anonymize IP if present
        const sanitizedContext = context ? { ...context } : {};
        if (sanitizedContext.ipAddress) {
            sanitizedContext.ipAddress = anonymizeIPInternal(sanitizedContext.ipAddress);
        }
        // Extract error details
        if (sanitizedContext.error) {
            if (sanitizedContext.error instanceof Error) {
                const error = sanitizedContext.error;
                sanitizedContext.errorMessage = error.message;
                sanitizedContext.errorStack = error.stack;
                delete sanitizedContext.error;
            }
            else if (typeof sanitizedContext.error === 'string') {
                sanitizedContext.errorMessage = sanitizedContext.error;
                delete sanitizedContext.error;
            }
        }
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            correlationId,
            ...sanitizedContext,
        };
        // Console output (structured JSON for production, pretty for development)
        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify(logEntry));
        }
        else {
            console.log(`[${level.toUpperCase()}] ${message}`, sanitizedContext);
        }
        // Send errors to Sentry
        if (level === 'error') {
            Sentry.captureException(new Error(message), {
                level: 'error',
                contexts: {
                    custom: sanitizedContext,
                },
                tags: {
                    correlationId,
                    action: sanitizedContext.action,
                    resource: sanitizedContext.resource,
                },
            });
        }
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, context) {
        this.log('error', message, context);
    }
    debug(message, context) {
        if (process.env.NODE_ENV !== 'production') {
            this.log('debug', message, context);
        }
    }
    http(message, context) {
        this.log('http', message, context);
    }
    getWinston() {
        // Not available in client
        return null;
    }
}
/**
 * Anonymize IP address for GDPR compliance
 */
function anonymizeIPInternal(ip) {
    if (!ip || ip === 'unknown') {
        return 'unknown';
    }
    try {
        if (ip.includes('.') && !ip.includes(':')) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
            }
        }
        if (ip.includes(':')) {
            const parts = ip.split(':');
            if (parts.length >= 3) {
                return `${parts[0]}:${parts[1]}:${parts[2]}::`;
            }
        }
        return 'anonymized';
    }
    catch {
        return 'anonymized';
    }
}
/**
 * Singleton logger instance
 */
exports.logger = new SimpleLogger();
/**
 * Create a logger with default context
 */
function createLogger(defaultContext) {
    return {
        info: (message, context) => exports.logger.info(message, { ...defaultContext, ...context }),
        warn: (message, context) => exports.logger.warn(message, { ...defaultContext, ...context }),
        error: (message, context) => exports.logger.error(message, { ...defaultContext, ...context }),
        debug: (message, context) => exports.logger.debug(message, { ...defaultContext, ...context }),
        http: (message, context) => exports.logger.http(message, { ...defaultContext, ...context }),
        getWinston: () => null,
    };
}
/**
 * Anonymize IP address for GDPR compliance (exported version)
 */
function anonymizeIP(ip) {
    if (!ip || ip === 'unknown') {
        return 'unknown';
    }
    try {
        // IPv4 address
        if (ip.includes('.') && !ip.includes(':')) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
            }
        }
        // IPv6 address
        if (ip.includes(':')) {
            const parts = ip.split(':');
            if (parts.length >= 3) {
                return `${parts[0]}:${parts[1]}:${parts[2]}::`;
            }
        }
        return 'anonymized';
    }
    catch {
        return 'anonymized';
    }
}
function getCorrelationId(request) {
    const header = request.headers.get('x-correlation-id');
    return header || generateCorrelationId();
}
function getClientIP(request) {
    const rawIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
    return anonymizeIP(rawIP);
}
function getUserAgent(request) {
    return request.headers.get('user-agent') || 'unknown';
}
function logRequest(request, context) {
    const correlationId = getCorrelationId(request);
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);
    exports.logger.http(`${request.method} ${request.url}`, {
        correlationId,
        ipAddress,
        userAgent,
        ...context,
    });
    return correlationId;
}
function logResponse(request, statusCode, duration, correlationId, context) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    exports.logger[level](`${request.method} ${request.url} ${statusCode} ${duration}ms`, {
        correlationId,
        statusCode,
        duration,
        ...context,
    });
}
