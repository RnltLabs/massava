/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Client Helper
 * Since migration to massava.app domain, no basePath is used
 */

/**
 * Get the basePath for the application
 * Since migration to massava.app: always returns '' (no basePath)
 * Previously: returned '/massava' for rnltlabs.de/massava subdomain
 */
export function getBasePath(): string {
  // Since migration to massava.app, no basePath is used
  // Legacy support: Check if we're still on old domain
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/massava')) {
    return '/massava';
  }
  return '';
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
