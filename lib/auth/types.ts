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
