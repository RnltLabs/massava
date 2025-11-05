/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React, { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BusinessSidebar } from '@/components/business/BusinessSidebar';
import { BusinessNav } from '@/components/business/BusinessNav';
import { MobileBusinessNav } from '@/components/business/MobileBusinessNav';
import { UserRole } from '@/app/generated/prisma';

/**
 * Runtime Configuration: Node.js
 *
 * The business portal requires Node.js runtime for:
 * 1. Prisma Client (binary engine, not WASM)
 * 2. GDPR encryption middleware (crypto APIs for health data)
 * 3. NextAuth session management
 * 4. Direct database queries in Server Components
 *
 * This declaration applies to all child routes automatically.
 * Do not override with 'edge' in child routes unless migrating to API abstraction.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
 */
export const runtime = 'nodejs';

interface BusinessLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function BusinessLayout({
  children,
  params,
}: BusinessLayoutProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  // P0.7 FIX: Protect business portal - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business`);
  }

  // P0.7 FIX: RBAC - Verify user has business access (STUDIO_OWNER or SUPER_ADMIN role)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any)?.primaryRole;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles = (session.user as any)?.roles || [];

  const hasBusinessAccess =
    userRole === UserRole.STUDIO_OWNER ||
    userRole === UserRole.SUPER_ADMIN ||
    userRoles.includes(UserRole.STUDIO_OWNER) ||
    userRoles.includes(UserRole.SUPER_ADMIN);

  if (!hasBusinessAccess) {
    // Redirect to customer dashboard - insufficient permissions
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <BusinessSidebar locale={locale} />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Top Navigation */}
          <BusinessNav session={session} locale={locale} />

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Navigation */}
        <BusinessNav session={session} locale={locale} />

        {/* Page Content */}
        <main className="pb-20 pt-16 px-4">{children}</main>

        {/* Bottom Navigation */}
        <MobileBusinessNav locale={locale} />
      </div>
    </div>
  );
}
