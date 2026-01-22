/**
 * Central Environment Configuration Module
 *
 * Provides type-safe environment detection and configuration for the application.
 * Supports server-side and client-side environment detection with fallbacks.
 *
 * @module lib/config/environment
 */

/**
 * Supported application environments
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Environment-specific configuration interface
 */
export interface EnvironmentConfig {
  /** Current environment name */
  name: Environment;
  /** Application base URL */
  appUrl: string;
  /** API base URL */
  apiUrl: string;
  /** Is production environment */
  isProduction: boolean;
  /** Is staging environment */
  isStaging: boolean;
  /** Is development environment */
  isDevelopment: boolean;
}

/**
 * Environment-specific URL mappings
 */
const ENVIRONMENT_URLS: Record<Environment, { appUrl: string; apiUrl: string }> = {
  development: {
    appUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api',
  },
  staging: {
    appUrl: 'https://staging.massava.app',
    apiUrl: 'https://staging.massava.app/api',
  },
  production: {
    appUrl: 'https://massava.app',
    apiUrl: 'https://massava.app/api',
  },
};

/**
 * Detects the current environment from environment variables
 *
 * Priority order:
 * 1. NEXT_PUBLIC_VERCEL_ENV (works on both server and client)
 * 2. APP_ENV (custom environment variable)
 * 3. NODE_ENV (Node.js standard)
 * 4. Default: 'development'
 *
 * @returns {Environment} The detected environment
 */
export function getEnvironment(): Environment {
  // Check NEXT_PUBLIC_VERCEL_ENV first (works on both server and client)
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv === 'production' || vercelEnv === 'staging' || vercelEnv === 'development') {
    return vercelEnv;
  }

  // Check custom APP_ENV (server-side only)
  const appEnv = process.env.APP_ENV;
  if (appEnv === 'production' || appEnv === 'staging' || appEnv === 'development') {
    return appEnv;
  }

  // Check NODE_ENV (server-side only)
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    return 'production';
  }

  // Default to development
  return 'development';
}

/**
 * Gets the complete environment configuration
 *
 * @returns {EnvironmentConfig} Environment-specific configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = getEnvironment();
  const urls = ENVIRONMENT_URLS[environment];

  return {
    name: environment,
    appUrl: urls.appUrl,
    apiUrl: urls.apiUrl,
    isProduction: environment === 'production',
    isStaging: environment === 'staging',
    isDevelopment: environment === 'development',
  };
}

/**
 * Pre-calculated environment configuration for fast access
 *
 * Use this exported constant for most cases to avoid repeated function calls.
 *
 * @example
 * ```typescript
 * import { env } from '@/lib/config/environment';
 *
 * if (env.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 *
 * const apiEndpoint = `${env.apiUrl}/users`;
 * ```
 */
export const env = getEnvironmentConfig();
