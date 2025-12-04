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

  // Determine if any mobile nav will be shown (customer OR business)
  const shouldShowMobileNav = (() => {
    // Not authenticated or loading
    if (status !== 'authenticated' || !session?.user) {
      return false;
    }

    // Auth pages don't show nav
    if (pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/verify')) {
      return false;
    }

    // Get user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryRole = (session.user as any)?.primaryRole || 'CUSTOMER';

    // Studio owners on /business routes - business layout handles padding
    if (primaryRole === 'STUDIO_OWNER' && pathname?.includes('/business')) {
      return false;
    }

    // Studio owners outside /business - show business nav, need padding
    if (primaryRole === 'STUDIO_OWNER') {
      return true;
    }

    // Customers on /business routes shouldn't happen, but handle it
    if (pathname?.includes('/business')) {
      return false;
    }

    // Customers everywhere else - show customer nav
    return true;
  })();

  return (
    <main
      className={cn(
        'pt-14 md:pt-16',
        // Add bottom padding on mobile when nav is shown (h-16 + safe-area)
        shouldShowMobileNav && 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0'
      )}
    >
      {children}
    </main>
  );
}
