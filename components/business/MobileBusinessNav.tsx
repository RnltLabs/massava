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
  MessageSquareIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

interface MobileBusinessNavProps {
  locale: string;
  pendingCount?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
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
      className="flex flex-col items-center justify-center gap-1 px-3 min-w-[64px] h-full focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-inset rounded-lg"
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
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B56550] text-[10px] font-bold text-white"
            aria-label={`${item.badge} pending requests`}
          >
            {item.badge > 9 ? '9+' : item.badge}
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
NavItemComponent.displayName = 'NavItem';

function MobileBusinessNavComponent({ locale, pendingCount = 0 }: MobileBusinessNavProps): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('business.nav');

  // Memoize nav items configuration
  const navItems = useMemo<NavItem[]>(
    () => [
      {
        label: t('today'),
        href: `/${locale}/business`,
        icon: HomeIcon,
      },
      {
        label: t('calendar'),
        href: `/${locale}/business/calendar`,
        icon: CalendarDaysIcon,
      },
      {
        label: t('requests'),
        href: `/${locale}/business/bookings`,
        icon: MessageSquareIcon,
        badge: pendingCount,
      },
      {
        label: t('more'),
        href: `/${locale}/business/more`,
        icon: MoreHorizontalIcon,
      },
    ],
    [locale, pendingCount, t]
  );

  const isActive = useCallback(
    (href: string): boolean => {
      if (href === `/${locale}/business`) {
        return pathname === href;
      }
      return pathname?.startsWith(href) ?? false;
    },
    [locale, pathname]
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg"
      aria-label="Mobile navigation"
      role="navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}
      </div>
    </nav>
  );
}

// Memoized export for performance
export const MobileBusinessNav = React.memo(MobileBusinessNavComponent);
