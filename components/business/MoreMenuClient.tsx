/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import {
  LayoutGridIcon,
  MapPinIcon,
  UserIcon,
  HelpCircleIcon,
  LogOutIcon,
} from 'lucide-react';
import { SettingsHeroCard, SettingsListGroup } from '@/components/business/settings';
import { cn } from '@/lib/utils';

interface StudioProfile {
  servicesCount: number;
  studioName: string;
  studioLogo?: string | null;
}

interface MoreMenuClientProps {
  locale: string;
  studioProfile: StudioProfile;
}

/**
 * Icon color styles for different menu categories
 */
const iconStyles = {
  services: { bg: 'bg-orange-100', color: 'text-orange-600' },
  studio: { bg: 'bg-emerald-100', color: 'text-emerald-600' },
  account: { bg: 'bg-blue-100', color: 'text-blue-600' },
  help: { bg: 'bg-purple-100', color: 'text-purple-600' },
} as const;

function MoreMenuClientComponent({ locale, studioProfile }: MoreMenuClientProps): React.JSX.Element {
  const t = useTranslations('business.more');

  // Memoize sign out handler
  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut({ callbackUrl: `/${locale}/auth/login` });
  }, [locale]);

  // Memoize menu sections configuration
  const studioMenuItems = useMemo(
    () => [
      {
        key: 'services',
        label: t('services'),
        description: t('servicesCount', { count: studioProfile.servicesCount }),
        href: `/${locale}/business/settings/services`,
        icon: LayoutGridIcon,
        iconBg: iconStyles.services.bg,
        iconColor: iconStyles.services.color,
        badge: studioProfile.servicesCount,
      },
      {
        key: 'studio',
        label: t('studio'),
        description: t('studioDescription'),
        href: `/${locale}/business/settings/studio`,
        icon: MapPinIcon,
        iconBg: iconStyles.studio.bg,
        iconColor: iconStyles.studio.color,
      },
    ],
    [locale, studioProfile.servicesCount, t]
  );

  const accountMenuItems = useMemo(
    () => [
      {
        key: 'account',
        label: t('account'),
        description: t('accountDescription'),
        href: `/${locale}/business/settings/account`,
        icon: UserIcon,
        iconBg: iconStyles.account.bg,
        iconColor: iconStyles.account.color,
      },
    ],
    [locale, t]
  );

  const supportMenuItems = useMemo(
    () => [
      {
        key: 'help',
        label: t('help'),
        href: `/${locale}/business/help`,
        icon: HelpCircleIcon,
        iconBg: iconStyles.help.bg,
        iconColor: iconStyles.help.color,
      },
    ],
    [locale, t]
  );

  return (
    <main className="space-y-6 pt-4 pb-6">
      {/* Hero Card with Studio Avatar and Name */}
      <SettingsHeroCard
        studioName={studioProfile.studioName}
        studioLogo={studioProfile.studioLogo}
        servicesCount={studioProfile.servicesCount}
        locale={locale}
      />

      {/* DEIN STUDIO Section */}
      <SettingsListGroup title="Dein Studio" items={studioMenuItems} />

      {/* KONTO Section */}
      <SettingsListGroup title="Konto" items={accountMenuItems} />

      {/* SUPPORT Section */}
      <SettingsListGroup title="Support" items={supportMenuItems} />

      {/* Sign Out Button - Standalone */}
      <button
        onClick={handleSignOut}
        className={cn(
          'w-full bg-card rounded-xl px-4 py-3.5 shadow-sm',
          'flex items-center gap-3',
          'transition-all duration-200',
          'hover:bg-red-50 active:bg-red-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
        )}
        aria-label={t('signOut')}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100"
          aria-hidden="true"
        >
          <LogOutIcon className="h-5 w-5 text-red-600" />
        </div>
        <span className="text-[15px] font-medium text-red-600">{t('signOut')}</span>
      </button>
    </main>
  );
}

// Memoized export for performance
export const MoreMenuClient = React.memo(MoreMenuClientComponent);
