/**
 * @fileoverview Custom error types for iCal operations
 * @module lib/errors/ical-errors
 */

/**
 * Custom error class for iCal download failures
 */
export class ICSDownloadError extends Error {
  constructor(
    message: string,
    public readonly code: 'QUOTA_EXCEEDED' | 'UNSUPPORTED_BROWSER' | 'GENERATION_FAILED' | 'UNKNOWN',
    public readonly correlationId: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ICSDownloadError';
    Object.setPrototypeOf(this, ICSDownloadError.prototype);
  }
}

/**
 * Helper to determine error code based on the original error
 */
export function getICSErrorCode(error: unknown): ICSDownloadError['code'] {
  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      return 'QUOTA_EXCEEDED';
    }
    if (error.message.includes('not supported') || error.message.includes('browser')) {
      return 'UNSUPPORTED_BROWSER';
    }
  }
  return 'UNKNOWN';
}