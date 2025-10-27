/**
 * Navigation utilities for handling basePath in different environments
 *
 * In production, the app runs under /massava basePath on staging.rnltlabs.de/massava
 * In development, there's no basePath
 */

/**
 * Get the basePath for the current environment
 * @returns The basePath string (e.g., '/massava' in production, '' in development)
 */
export function getBasePath(): string {
  return process.env.NODE_ENV === 'production' ? '/massava' : '';
}

/**
 * Get a route with the correct basePath prepended
 * @param path - The path without basePath (e.g., '/dashboard', '/auth/signin')
 * @returns The full path with basePath (e.g., '/massava/dashboard' in production)
 */
export function getRouteWithBasePath(path: string): string {
  const basePath = getBasePath();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return basePath + normalizedPath;
}

/**
 * Get a URL with basePath for server-side redirects using NextResponse.redirect()
 * @param path - The path without basePath (e.g., '/dashboard', '/auth/signin')
 * @param baseUrl - The base URL (e.g., from request.url)
 * @returns A complete URL object with basePath included
 */
export function getRedirectUrl(path: string, baseUrl: string | URL): URL {
  const fullPath = getRouteWithBasePath(path);
  return new URL(fullPath, baseUrl);
}

/**
 * Get a callbackUrl for NextAuth with basePath
 * Useful for signIn(), signOut(), etc.
 * @param path - The path without basePath (e.g., '/dashboard')
 * @returns The full path with basePath
 */
export function getAuthCallbackUrl(path: string): string {
  return getRouteWithBasePath(path);
}
