/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  CalendarDaysIcon,
  UserIcon,
  BellIcon,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';

interface MobileCustomerNavProps {
  locale: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

// Memoized Nav Item component
const NavItemComponent = React.memo(({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="flex flex-col items-center gap-1 px-3 min-w-[64px] py-1 focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-inset rounded-lg"
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Icon
          className={cn(
            'h-6 w-6 transition-colors',
            isActive ? 'text-[#B56550]' : 'text-gray-600'
          )}
          aria-hidden="true"
        />
        {/* Badge for unread notifications */}
        {item.badgeCount !== undefined && item.badgeCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B56550] px-1 text-[10px] font-bold text-white"
            aria-label={`${item.badgeCount} neue Benachrichtigungen`}
          >
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          isActive ? 'text-[#B56550]' : 'text-gray-600'
        )}
      >
        {item.label}
      </span>
    </Link>
  );
});
NavItemComponent.displayName = 'CustomerNavItem';

function MobileCustomerNavComponent({ locale }: MobileCustomerNavProps): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('customer.nav');
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  // Memoize nav items configuration
  const navItems = useMemo<NavItem[]>(
    () => [
      {
        label: t('discover'),
        href: `/${locale}`,
        icon: HomeIcon,
      },
      {
        label: t('bookings'),
        href: `/${locale}/customer/bookings`,
        icon: CalendarDaysIcon,
      },
      {
        label: t('notifications'),
        href: `/${locale}/customer/account`,
        icon: BellIcon,
        badgeCount: unreadCount,
      },
      {
        label: t('account'),
        href: `/${locale}/customer/account`,
        icon: UserIcon,
      },
    ],
    [locale, t, unreadCount]
  );

  const isActive = useCallback(
    (href: string): boolean => {
      if (href === `/${locale}`) {
        // Home is active only on landing page (exact match)
        return pathname === href;
      }
      return pathname?.startsWith(href) ?? false;
    },
    [locale, pathname]
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white shadow-lg md:hidden"
      aria-label="Mobile navigation"
      role="navigation"
    >
      {/* Content area with icons positioned at top */}
      <div className="flex items-center justify-around pt-2 pb-3">
        {navItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}
      </div>
      {/* Safe area spacer for iOS home indicator */}
      <div className="pb-safe" />
    </nav>
  );
}

// Memoized export for performance
export const MobileCustomerNav = React.memo(MobileCustomerNavComponent);
