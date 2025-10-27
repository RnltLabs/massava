/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Client Helper
 * Handles basePath for API requests in production environments
 */

/**
 * Get the basePath for the application
 * Returns '/massava' in production, '' in development
 */
export function getBasePath(): string {
  // In production, use /massava basePath
  // In development, use root
  return process.env.NODE_ENV === 'production' ? '/massava' : '';
}

/**
 * Build an API URL with the correct basePath
 * @param path - The API path (e.g., '/de/api/auth/register')
 * @returns Full URL with basePath if needed
 */
export function apiUrl(path: string): string {
  const basePath = getBasePath();

  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${basePath}${cleanPath}`;
}

/**
 * Fetch wrapper that automatically adds basePath
 * @param path - The API path
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  return fetch(url, options);
}
