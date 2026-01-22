/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MobileCustomerNav } from './MobileCustomerNav';

/**
 * Wrapper component that conditionally renders the MobileCustomerNav
 * based on authentication status, user role, and current route.
 *
 * Shows the bottom navigation for:
 * - Authenticated users with CUSTOMER role
 * - Not on business portal routes
 * - Mobile viewport only (handled by MobileCustomerNav itself)
 */
export function MobileCustomerNavWrapper(): React.JSX.Element | null {
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

  // Get user role - default to CUSTOMER if not set
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryRole = (session.user as any)?.primaryRole || 'CUSTOMER';

  // Don't show for studio owners - they have their own nav in business layout
  if (primaryRole === 'STUDIO_OWNER') {
    return null;
  }

  // Don't show on business portal routes (studio owners have their own nav)
  if (pathname?.includes('/business')) {
    return null;
  }

  // Don't show on auth-related pages
  if (pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/verify')) {
    return null;
  }

  return <MobileCustomerNav locale={locale} />;
}
