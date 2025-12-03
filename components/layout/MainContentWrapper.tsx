/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MainContentWrapperProps {
  children: React.ReactNode;
}

/**
 * Main content wrapper that adds bottom padding when the mobile customer
 * navigation bar is visible. This prevents content from being hidden
 * behind the fixed bottom navigation.
 *
 * The padding is applied when:
 * - User is authenticated with CUSTOMER role
 * - Not on business portal routes
 * - Not on auth-related pages
 *
 * On desktop (md+), the mobile nav is hidden, so no padding is needed.
 */
export function MainContentWrapper({ children }: MainContentWrapperProps): React.JSX.Element {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Determine if mobile customer nav will be shown
  const shouldShowMobileNav = (() => {
    // Not authenticated or loading
    if (status !== 'authenticated' || !session?.user) {
      return false;
    }

    // Get user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryRole = (session.user as any)?.primaryRole || 'CUSTOMER';

    // Studio owners have their own nav
    if (primaryRole === 'STUDIO_OWNER') {
      return false;
    }

    // Business routes have their own layout
    if (pathname?.includes('/business')) {
      return false;
    }

    // Auth pages don't show nav
    if (pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/verify')) {
      return false;
    }

    return true;
  })();

  return (
    <main
      className={cn(
        'pt-14 md:pt-16',
        // Add bottom padding on mobile when customer nav is shown
        shouldShowMobileNav && 'pb-20 md:pb-0'
      )}
    >
      {children}
    </main>
  );
}
