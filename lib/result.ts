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

/**
 * Success result with value
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * Error result with error
 */
export interface Err<E> {
  ok: false;
  error: E;
}

/**
 * Result type - either Ok<T> or Err<E>
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Create a successful result
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Check if result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

/**
 * Check if result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

/**
 * Map a successful result to a new value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Map an error result to a new error
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.ok) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chain operations that return Results (flatMap/bind)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Unwrap a result or return a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwrap a result or throw an error
 * Use sparingly - defeats the purpose of Result pattern
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Unwrap failed: ${JSON.stringify(result.error)}`);
}

/**
 * Match on a result (like Rust's match)
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U {
  if (result.ok) {
    return handlers.ok(result.value);
  }
  return handlers.err(result.error);
}
