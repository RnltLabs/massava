/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Auth Types - Shared type definitions
 * Used across DAL, guards, and auth logic
 */

import { UserRole } from '@/app/generated/prisma';

/**
 * Simplified User type for auth operations
 * Doesn't include all Prisma relations (avoids circular dependencies)
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  primaryRole: UserRole;
  roles: UserRole[];
  emailVerified: Date | null;
  isActive: boolean;
  isSuspended: boolean;
}

/**
 * Studio ownership info
 */
export interface StudioOwnership {
  studioId: string;
  userId: string;
  canTransfer: boolean;
}

/**
 * Auth error types
 */
export type AuthError =
  | { type: 'UNAUTHORIZED'; message: string }
  | { type: 'FORBIDDEN'; message: string }
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'INVALID_SESSION'; message: string };

/**
 * Result type for auth operations
 */
export type Result<T, E = AuthError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
