/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  CalendarIcon,
  ClipboardListIcon,
  SettingsIcon,
  HelpCircleIcon,
} from 'lucide-react';

interface MobileBusinessNavProps {
  locale: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MobileBusinessNav({ locale }: MobileBusinessNavProps): React.JSX.Element {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: `/${locale}/business`,
      icon: HomeIcon,
    },
    {
      label: 'Bookings',
      href: `/${locale}/business/bookings`,
      icon: ClipboardListIcon,
    },
    {
      label: 'Calendar',
      href: `/${locale}/business/calendar`,
      icon: CalendarIcon,
    },
    {
      label: 'Settings',
      href: `/${locale}/business/settings/profile`,
      icon: SettingsIcon,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/${locale}/business`) {
      return pathname === href;
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                active ? 'text-neutral-900' : 'text-neutral-600'
              )}
            >
              <Icon className={cn('h-6 w-6', active && 'fill-neutral-900')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
