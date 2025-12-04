/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
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
  const [pendingCount, setPendingCount] = useState(0);

  // Get user role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryRole = (session?.user as any)?.primaryRole || 'CUSTOMER';
  const isStudioOwner = primaryRole === 'STUDIO_OWNER';
  const isOnBusinessRoute = pathname?.includes('/business');
  const isOnAuthPage = pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/verify');

  // Fetch pending bookings count for studio owners
  useEffect(() => {
    if (status !== 'authenticated' || !isStudioOwner || isOnBusinessRoute) {
      return;
    }

    const fetchPendingCount = async () => {
      try {
        // Use Next.js rewrite-safe path (no locale prefix), include credentials for auth
        const response = await fetch('/api/business/stats?period=day', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.overview?.pendingBookings || 0);
        }
      } catch {
        // Silently fail - badge just won't show
      }
    };

    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [status, isStudioOwner, isOnBusinessRoute]);

  // Don't render while loading
  if (status === 'loading') {
    return null;
  }

  // Only show for authenticated users
  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  // Only show for studio owners
  if (!isStudioOwner) {
    return null;
  }

  // Don't show on business routes - the business layout handles its own nav
  if (isOnBusinessRoute) {
    return null;
  }

  // Don't show on auth-related pages
  if (isOnAuthPage) {
    return null;
  }

  return <MobileBusinessNav locale={locale} pendingCount={pendingCount} />;
}
