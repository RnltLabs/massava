/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * NextAuth Type Extensions
 * Extends NextAuth types to include RBAC and unified user model properties
 */

import { DefaultSession } from 'next-auth';
import { UserRole } from '@/app/generated/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      primaryRole?: UserRole;
      roles?: UserRole[];
      accountType?: 'customer' | 'studio';
      hasStudio?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    primaryRole?: UserRole;
    roles?: UserRole[];
    accountType?: 'customer' | 'studio';
    hasStudio?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    primaryRole?: UserRole;
    roles?: UserRole[];
    accountType?: 'customer' | 'studio';
    hasStudio?: boolean;
  }
}
