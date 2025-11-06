"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Structured Logging System - Universal Logger
 * Phase 2: Code Quality - Browser-Safe Logging
 *
 * This file re-exports from the client-safe logger implementation.
 * The client logger works in both browser and server environments.
 * For server-only advanced features (file rotation, etc.), import logger-winston.ts directly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logResponse = exports.logRequest = exports.getUserAgent = exports.getClientIP = exports.anonymizeIP = exports.getCorrelationId = exports.generateCorrelationId = exports.createLogger = exports.logger = void 0;
var logger_client_1 = require("./logger-client");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_client_1.logger; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_client_1.createLogger; } });
Object.defineProperty(exports, "generateCorrelationId", { enumerable: true, get: function () { return logger_client_1.generateCorrelationId; } });
Object.defineProperty(exports, "getCorrelationId", { enumerable: true, get: function () { return logger_client_1.getCorrelationId; } });
Object.defineProperty(exports, "anonymizeIP", { enumerable: true, get: function () { return logger_client_1.anonymizeIP; } });
Object.defineProperty(exports, "getClientIP", { enumerable: true, get: function () { return logger_client_1.getClientIP; } });
Object.defineProperty(exports, "getUserAgent", { enumerable: true, get: function () { return logger_client_1.getUserAgent; } });
Object.defineProperty(exports, "logRequest", { enumerable: true, get: function () { return logger_client_1.logRequest; } });
Object.defineProperty(exports, "logResponse", { enumerable: true, get: function () { return logger_client_1.logResponse; } });
