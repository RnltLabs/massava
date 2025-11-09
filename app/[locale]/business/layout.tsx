/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React, { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { BusinessSidebar } from '@/components/business/BusinessSidebar';
import { BusinessNav } from '@/components/business/BusinessNav';
import { MobileBusinessNav } from '@/components/business/MobileBusinessNav';
import { UserRole, BookingStatus } from '@/app/generated/prisma';

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

/**
 * Check if user owns a studio
 * Used for progressive onboarding UX (hide sidebar when no studio)
 */
async function checkStudioOwnership(userEmail: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        ownedStudios: true,
      },
    });

    return !!user && user.ownedStudios.length > 0;
  } catch (error) {
    logger.error('Error checking studio ownership', {
      error: error instanceof Error ? error.message : String(error),
      userEmail
    });
    return false;
  }
}

async function getPendingBookingsCount(userEmail: string): Promise<number> {
  try {
    // Get user's studio via User->StudioOwnership->Studio path
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        ownedStudios: {
          include: {
            studio: true,
          },
        },
      },
    });

    if (!user || user.ownedStudios.length === 0) {
      return 0;
    }

    const studioId = user.ownedStudios[0].studioId;

    // Get pending bookings count
    const pendingCount = await prisma.newBooking.count({
      where: {
        studioId,
        status: BookingStatus.PENDING,
      },
    });

    return pendingCount;
  } catch (error) {
    logger.error('Error fetching pending bookings count', {
      error: error instanceof Error ? error.message : String(error),
      userEmail
    });
    return 0;
  }
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

  // Progressive Onboarding: Check if user owns a studio
  const hasStudio = await checkStudioOwnership(session.user?.email ?? '');

  // Get pending bookings count for badge (only if user has studio)
  const pendingCount = hasStudio ? await getPendingBookingsCount(session.user?.email ?? '') : 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar - Only show when user has a studio */}
        {hasStudio && <BusinessSidebar locale={locale} />}

        {/* Main Content */}
        <div className={hasStudio ? "flex-1 ml-64" : "flex-1"}>
          {/* Top Navigation */}
          <BusinessNav session={session} locale={locale} hasStudio={hasStudio} />

          {/* Page Content */}
          <main className={hasStudio ? "p-6" : ""}>{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Navigation */}
        <BusinessNav session={session} locale={locale} hasStudio={hasStudio} />

        {/* Page Content */}
        <main className={hasStudio ? "pb-20 pt-16 px-4" : "pt-16"}>{children}</main>

        {/* Bottom Navigation - Only show when user has a studio */}
        {hasStudio && <MobileBusinessNav locale={locale} pendingCount={pendingCount} />}
      </div>
    </div>
  );
}
