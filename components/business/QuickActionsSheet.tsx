/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  BanIcon,
  EditIcon,
  BarChart3Icon,
  ClockIcon,
} from 'lucide-react';

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: () => void;
}

// Memoized action button component
const ActionButton = React.memo(({
  action,
  onClick,
}: {
  action: QuickAction;
  onClick: () => void;
}) => {
  const Icon = action.icon;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2"
      aria-label={action.title}
    >
      <div
        className="flex-shrink-0 w-12 h-12 bg-[#D4A89F] rounded-full flex items-center justify-center"
        aria-hidden="true"
      >
        <Icon className="h-6 w-6 text-[#B56550]" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-base font-semibold text-gray-900">
          {action.title}
        </h3>
        <p className="text-sm text-gray-600 mt-0.5">
          {action.description}
        </p>
      </div>
    </button>
  );
});
ActionButton.displayName = 'ActionButton';

function QuickActionsSheetComponent({
  open,
  onOpenChange,
  locale,
}: QuickActionsSheetProps): React.JSX.Element {
  const t = useTranslations('business.quickActions');
  const router = useRouter();

  // Memoize navigation handlers
  const handleNavigate = useCallback(
    (path: string) => () => {
      onOpenChange(false);
      router.push(path);
    },
    [onOpenChange, router]
  );

  // Memoize quick actions configuration
  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        icon: BanIcon,
        title: t('blockTime'),
        description: t('blockTimeDesc'),
        action: handleNavigate(`/${locale}/business/calendar?action=block`),
      },
      {
        icon: EditIcon,
        title: t('editService'),
        description: t('editServiceDesc'),
        action: handleNavigate(`/${locale}/business/settings/services`),
      },
      {
        icon: BarChart3Icon,
        title: t('viewStats'),
        description: t('viewStatsDesc'),
        action: handleNavigate(`/${locale}/business/analytics`),
      },
      {
        icon: ClockIcon,
        title: t('editHours'),
        description: t('editHoursDesc'),
        action: handleNavigate(`/${locale}/business/settings/studio?tab=hours`),
      },
    ],
    [t, locale, handleNavigate]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[85dvh] rounded-t-3xl p-6 overflow-y-auto"
        showCloseButton={true}
        aria-describedby="quick-actions-description"
      >
        <VisuallyHidden>
          <SheetTitle>{t('title')}</SheetTitle>
        </VisuallyHidden>

        <div className="space-y-4">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900" id="quick-actions-description">
              {t('title')}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3" role="menu" aria-label="Quick actions menu">
            {quickActions.map((action, index) => (
              <ActionButton
                key={index}
                action={action}
                onClick={action.action}
              />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Memoized export for performance
export const QuickActionsSheet = React.memo(QuickActionsSheetComponent);
