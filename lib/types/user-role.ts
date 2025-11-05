/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * User Role Enum - Edge-Compatible
 * Duplicated from Prisma schema for use in Edge Runtime (middleware)
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STUDIO_OWNER = 'STUDIO_OWNER',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST',
}
