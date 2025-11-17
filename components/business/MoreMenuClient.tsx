/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import {
  LayoutGridIcon,
  ClockIcon,
  MapPinIcon,
  BarChartIcon,
  HelpCircleIcon,
  LogOutIcon,
  ChevronRightIcon,
  ImageIcon,
  UserIcon,
} from 'lucide-react';

interface StudioProfile {
  servicesCount: number;
}

interface MoreMenuClientProps {
  locale: string;
  studioProfile: StudioProfile;
}

interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// Memoized menu item component
const MenuItemComponent = React.memo(({
  item,
  isLast,
}: {
  item: MenuItem;
  isLast: boolean;
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-4 transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-inset rounded-lg"
      aria-label={item.label}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-[#D4A89F] flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Icon className="h-5 w-5 text-[#B56550]" />
      </div>

      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.label}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" aria-hidden="true" />

      {/* Divider */}
      {!isLast && (
        <div className="absolute left-14 right-0 bottom-0 h-px bg-gray-200" />
      )}
    </Link>
  );
});
MenuItemComponent.displayName = 'MenuItem';

function MoreMenuClientComponent({ locale, studioProfile }: MoreMenuClientProps): React.JSX.Element {
  const t = useTranslations('business.more');

  // Memoize sign out handler
  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut({ callbackUrl: `/${locale}/auth/login` });
  }, [locale]);

  // Memoize menu sections configuration
  const menuSections = useMemo<MenuSection[]>(
    () => [
      {
        title: 'Services',
        items: [
          {
            key: 'services',
            label: t('services'),
            href: `/${locale}/business/settings/services`,
            icon: LayoutGridIcon,
            description: t('servicesCount', { count: studioProfile.servicesCount }),
          },
        ],
      },
      {
        title: 'Geschäftsdaten',
        items: [
          {
            key: 'studio',
            label: t('studio'),
            href: `/${locale}/business/settings/studio`,
            icon: MapPinIcon,
            description: t('studioDescription'),
          },
        ],
      },
      {
        title: 'Einstellungen',
        items: [
          {
            key: 'account',
            label: t('account'),
            href: `/${locale}/business/settings/account`,
            icon: UserIcon,
            description: t('accountDescription'),
          },
        ],
      },
      {
        title: 'Support',
        items: [
          {
            key: 'help',
            label: t('help'),
            href: `/${locale}/business/help`,
            icon: HelpCircleIcon,
          },
        ],
      },
    ],
    [locale, studioProfile.servicesCount, t]
  );

  return (
    <main className="space-y-6 pb-6">
      {/* Menu Sections */}
      {menuSections.map((section) => (
        <section key={section.title} className="space-y-2" aria-labelledby={`section-${section.title}`}>
          <h2
            id={`section-${section.title}`}
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1"
          >
            {section.title}
          </h2>
          <nav className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm" role="navigation">
            {section.items.map((item, index) => (
              <MenuItemComponent
                key={item.key}
                item={item}
                isLast={index === section.items.length - 1}
              />
            ))}
          </nav>
        </section>
      ))}

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 shadow-sm transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        aria-label="Sign out of account"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center" aria-hidden="true">
            <LogOutIcon className="h-5 w-5 text-red-600" />
          </div>
          <span className="text-sm font-medium text-red-600">{t('signOut')}</span>
        </div>
      </button>
    </main>
  );
}

// Memoized export for performance
export const MoreMenuClient = React.memo(MoreMenuClientComponent);
