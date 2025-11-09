/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  CalendarDaysIcon,
  PlusCircleIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

// Dynamic import - QuickActionsSheet only loaded when user clicks "New" button
// Reduces initial bundle size by ~5KB
const QuickActionsSheet = dynamic(
  () => import('./QuickActionsSheet').then((mod) => mod.QuickActionsSheet),
  {
    ssr: false, // Client-side only (sheet interactions)
    loading: () => null, // No loading state needed - opens instantly
  }
);

interface MobileBusinessNavProps {
  locale: string;
  pendingCount?: number;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: 'quickActions';
  badge?: number;
}

// Memoized Nav Item component
const NavItemComponent = React.memo(({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => {
  const Icon = item.icon;
  const isMiddleTab = item.action === 'quickActions';

  const content = (
    <>
      <div className="relative">
        <Icon
          className={cn(
            'h-6 w-6 transition-colors',
            isActive && 'text-[#B56550]',
            !isActive && !isMiddleTab && 'text-gray-600',
            isMiddleTab && 'text-[#B56550]'
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
          isActive && 'text-[#B56550]',
          !isActive && !isMiddleTab && 'text-gray-600',
          isMiddleTab && 'text-[#B56550]'
        )}
      >
        {item.label}
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1 px-3 min-w-[64px] h-full focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-inset rounded-lg"
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 px-3 min-w-[64px] h-full focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-inset rounded-lg"
      aria-label={item.label}
    >
      {content}
    </button>
  );
});
NavItemComponent.displayName = 'NavItem';

function MobileBusinessNavComponent({ locale, pendingCount = 0 }: MobileBusinessNavProps): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('business.nav');
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Memoize nav items configuration
  const navItems = useMemo<NavItem[]>(
    () => [
      {
        label: t('today'),
        href: `/${locale}/business`,
        icon: HomeIcon,
      },
      {
        label: t('week'),
        href: `/${locale}/business/calendar`,
        icon: CalendarDaysIcon,
      },
      {
        label: t('new'),
        icon: PlusCircleIcon,
        action: 'quickActions',
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
    (href: string | undefined): boolean => {
      if (!href) return false;
      if (href === `/${locale}/business`) {
        return pathname === href;
      }
      return pathname?.startsWith(href) ?? false;
    },
    [locale, pathname]
  );

  const handleItemClick = useCallback(
    (item: NavItem) => (e: React.MouseEvent) => {
      if (item.action === 'quickActions') {
        e.preventDefault();
        setShowQuickActions(true);
      }
    },
    []
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg"
        aria-label="Mobile navigation"
        role="navigation"
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.href || item.label}
              item={item}
              isActive={isActive(item.href)}
              onClick={handleItemClick(item)}
            />
          ))}
        </div>
      </nav>

      {/* Quick Actions Sheet - Only loaded when showQuickActions is true */}
      {showQuickActions && (
        <QuickActionsSheet
          open={showQuickActions}
          onOpenChange={setShowQuickActions}
          locale={locale}
        />
      )}
    </>
  );
}

// Memoized export for performance
export const MobileBusinessNav = React.memo(MobileBusinessNavComponent);
