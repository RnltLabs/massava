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
  StarIcon,
} from 'lucide-react';

interface StudioProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  averageRating: number | null;
  totalReviews: number;
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
            key: 'hours',
            label: t('hours'),
            href: `/${locale}/business/settings/hours`,
            icon: ClockIcon,
          },
          {
            key: 'location',
            label: t('location'),
            href: `/${locale}/business/settings/location`,
            icon: MapPinIcon,
          },
          {
            key: 'stats',
            label: t('stats'),
            href: `/${locale}/business/stats`,
            icon: BarChartIcon,
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

  // Memoize computed values
  const hasReviews = studioProfile.totalReviews > 0;
  const rating = studioProfile.averageRating?.toFixed(1) ?? '0.0';

  return (
    <main className="space-y-6 pb-6">
      {/* Studio Profile Card */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm" aria-label="Studio profile">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-xl bg-[#D4A89F] flex items-center justify-center flex-shrink-0 overflow-hidden"
            aria-hidden="true"
          >
            {studioProfile.logoUrl ? (
              <img
                src={studioProfile.logoUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                width={64}
                height={64}
              />
            ) : (
              <LayoutGridIcon className="h-8 w-8 text-[#B56550]" />
            )}
          </div>

          {/* Studio Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{studioProfile.name}</h1>
            {hasReviews ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-900">{rating}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ({studioProfile.totalReviews} Bewertungen)
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Noch keine Bewertungen</p>
            )}
          </div>

          {/* Edit Profile Button */}
          <Link
            href={`/${locale}/business/settings/profile`}
            style={{ backgroundColor: '#B56550' }}
            className="px-4 min-h-[44px] flex items-center text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2"
            aria-label="Edit studio profile"
          >
            Bearbeiten
          </Link>
        </div>
      </section>

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
