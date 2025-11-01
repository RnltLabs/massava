/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Bottom Tab Navigation
 * Mobile-first navigation bar with 4 tabs and badge counts
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Package, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BottomTabNavProps {
  locale: string;
  activeTab: 'dashboard' | 'calendar' | 'services' | 'more';
  pendingCount?: number;
  todayCount?: number;
  servicesCount?: number;
}

export function BottomTabNav({
  locale,
  activeTab,
  pendingCount = 0,
  todayCount = 0,
  servicesCount = 0,
}: BottomTabNavProps): React.JSX.Element {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: `/${locale}/dashboard/owner`,
      badge: pendingCount,
      badgeVariant: 'destructive' as const,
    },
    {
      id: 'calendar',
      label: 'Kalender',
      icon: Calendar,
      href: `/${locale}/dashboard/owner/calendar`,
      badge: todayCount,
      badgeVariant: 'default' as const,
    },
    {
      id: 'services',
      label: 'Services',
      icon: Package,
      href: `/${locale}/dashboard/owner/services`,
      badge: servicesCount,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'more',
      label: 'Mehr',
      icon: MoreHorizontal,
      href: `/${locale}/dashboard/owner/more`,
      badge: 0,
      badgeVariant: 'secondary' as const,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="h-6 w-6 mb-1" aria-hidden="true" />
                {tab.badge > 0 && (
                  <Badge
                    variant={tab.badgeVariant}
                    className="absolute -top-2 -right-3 h-5 min-w-5 flex items-center justify-center px-1 text-xs"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
