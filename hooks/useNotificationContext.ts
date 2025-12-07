/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Hook to detect user role and notification context
 * Used by NotificationsPopup to show role-specific categories
 */

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export type NotificationContext = 'STUDIO_OWNER' | 'CUSTOMER';

export interface NotificationContextResult {
  /** Current notification context based on role and route */
  context: NotificationContext;
  /** User is a studio owner (owns at least one studio) */
  isStudioOwner: boolean;
  /** User is a customer */
  isCustomer: boolean;
  /** User has both roles */
  isDualRole: boolean;
  /** Session is loading */
  isLoading: boolean;
}

/**
 * Determines the notification context based on:
 * 1. User's primary role
 * 2. Whether user owns a studio
 * 3. Current route (business vs customer area)
 *
 * @returns NotificationContextResult with context and role flags
 *
 * @example
 * ```typescript
 * const { context, isStudioOwner, isLoading } = useNotificationContext();
 *
 * if (isLoading) return <Skeleton />;
 *
 * const categories = context === 'STUDIO_OWNER'
 *   ? STUDIO_OWNER_CATEGORIES
 *   : CUSTOMER_CATEGORIES;
 * ```
 */
export function useNotificationContext(): NotificationContextResult {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isLoading = status === 'loading';

  // Check if we're in the business area
  const isBusinessContext = pathname?.includes('/business') ?? false;

  // Get role info from session
  const primaryRole = session?.user?.primaryRole;
  const hasStudio = session?.user?.hasStudio ?? false;

  // Determine role flags
  // NOTE: If user is in /business area and logged in, they MUST be a studio owner
  // (middleware protects these routes). Use this as fallback for older sessions.
  const isStudioOwner =
    primaryRole === 'STUDIO_OWNER' ||
    hasStudio ||
    (isBusinessContext && !!session?.user);
  const isCustomer = !isStudioOwner || primaryRole === 'CUSTOMER';
  const isDualRole = isStudioOwner && isCustomer;

  // Context is determined by the current route
  // If in /business -> STUDIO_OWNER context (user must be owner to access this area)
  // Otherwise -> CUSTOMER context
  const context: NotificationContext = isBusinessContext
    ? 'STUDIO_OWNER'
    : 'CUSTOMER';

  return {
    context,
    isStudioOwner,
    isCustomer,
    isDualRole,
    isLoading,
  };
}
