/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MobileBusinessNav } from './MobileBusinessNav';

/**
 * Wrapper component that conditionally renders the MobileBusinessNav
 * for Studio Owners when they are OUTSIDE the /business routes.
 *
 * This ensures Studio Owners always have access to their business navigation,
 * even when browsing the customer-facing parts of the app (like the landing page).
 *
 * Shows the bottom navigation for:
 * - Authenticated users with STUDIO_OWNER role
 * - NOT on /business routes (business layout handles its own nav)
 * - NOT on auth pages
 * - Mobile viewport only (handled by MobileBusinessNav itself)
 */
export function MobileBusinessNavWrapper(): React.JSX.Element | null {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const locale = useLocale();

  // Don't render while loading
  if (status === 'loading') {
    return null;
  }

  // Only show for authenticated users
  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  // Get user role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryRole = (session.user as any)?.primaryRole || 'CUSTOMER';

  // Only show for studio owners
  if (primaryRole !== 'STUDIO_OWNER') {
    return null;
  }

  // Don't show on business routes - the business layout handles its own nav
  if (pathname?.includes('/business')) {
    return null;
  }

  // Don't show on auth-related pages
  if (pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/verify')) {
    return null;
  }

  // Note: pendingCount is not available here (would require server query)
  // Studio owners will see the actual count when they navigate to /business
  return <MobileBusinessNav locale={locale} pendingCount={0} />;
}
