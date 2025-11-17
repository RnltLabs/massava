"use strict";
/**
 * Result<T, E> Pattern Implementation
 *
 * A functional approach to error handling that makes errors explicit
 * and forces callers to handle them.
 *
 * BENEFITS:
 * - No thrown exceptions in business logic
 * - Errors are part of the type signature
 * - Compiler forces error handling
 * - Better composability
 *
 * USAGE:
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return err("Division by zero");
 *   }
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.err = err;
exports.isOk = isOk;
exports.isErr = isErr;
exports.map = map;
exports.mapErr = mapErr;
exports.andThen = andThen;
exports.unwrapOr = unwrapOr;
exports.unwrap = unwrap;
exports.match = match;
/**
 * Create a successful result
 */
function ok(value) {
    return { ok: true, value };
}
/**
 * Create an error result
 */
function err(error) {
    return { ok: false, error };
}
/**
 * Check if result is Ok
 */
function isOk(result) {
    return result.ok === true;
}
/**
 * Check if result is Err
 */
function isErr(result) {
    return result.ok === false;
}
/**
 * Map a successful result to a new value
 */
function map(result, fn) {
    if (result.ok) {
        return ok(fn(result.value));
    }
    return result;
}
/**
 * Map an error result to a new error
 */
function mapErr(result, fn) {
    if (!result.ok) {
        return err(fn(result.error));
    }
    return result;
}
/**
 * Chain operations that return Results (flatMap/bind)
 */
function andThen(result, fn) {
    if (result.ok) {
        return fn(result.value);
    }
    return result;
}
/**
 * Unwrap a result or return a default value
 */
function unwrapOr(result, defaultValue) {
    if (result.ok) {
        return result.value;
    }
    return defaultValue;
}
/**
 * Unwrap a result or throw an error
 * Use sparingly - defeats the purpose of Result pattern
 */
function unwrap(result) {
    if (result.ok) {
        return result.value;
    }
    throw new Error(`Unwrap failed: ${JSON.stringify(result.error)}`);
}
/**
 * Match on a result (like Rust's match)
 */
function match(result, handlers) {
    if (result.ok) {
        return handlers.ok(result.value);
    }
    return handlers.err(result.error);
}
