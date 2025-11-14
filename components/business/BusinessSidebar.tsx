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
  LayoutGridIcon,
  SettingsIcon,
  HelpCircleIcon,
} from 'lucide-react';

interface BusinessSidebarProps {
  locale: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BusinessSidebar({ locale }: BusinessSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
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
      label: 'Services',
      href: `/${locale}/business/settings/services`,
      icon: LayoutGridIcon,
    },
    {
      label: 'Settings',
      href: `/${locale}/business/settings`,
      icon: SettingsIcon,
    },
    {
      label: 'Help',
      href: `/${locale}/business/help`,
      icon: HelpCircleIcon,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/${locale}/business`) {
      return pathname === href;
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/business`} className="text-2xl font-bold text-neutral-900">
          Massava
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#D4A89F] text-[#B56550]'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
