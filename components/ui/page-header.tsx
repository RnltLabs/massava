/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Page Header Component
 * Consistent page header with optional back button for mobile settings pages
 */

'use client';

import React from 'react';
import { BackButton } from './back-button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional breadcrumb (e.g., "Einstellungen") */
  breadcrumb?: string;
  /** Show back button (default: true on mobile) */
  showBackButton?: boolean;
  /** Optional custom back button href */
  backHref?: string;
  /** Optional back button label */
  backLabel?: string;
  /** Optional className for custom styling */
  className?: string;
  /** Optional actions to display on the right side */
  actions?: React.ReactNode;
  /** Action button placement: 'inline' (default) or 'stacked' (mobile-first) */
  actionPlacement?: 'inline' | 'stacked';
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  showBackButton = true,
  backHref,
  backLabel,
  className,
  actions,
  actionPlacement = 'inline',
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('pb-4 border-b border-gray-200', className)}>
      <div className="space-y-3">
        {/* Back Button + Breadcrumb (Navigation Row) */}
        {showBackButton && (
          <div className={cn(
            'flex items-center',
            actionPlacement === 'inline' ? 'justify-between' : 'gap-2'
          )}>
            <div className="flex items-center gap-2">
              <BackButton href={backHref} label={backLabel} />
              {breadcrumb && (
                <>
                  <span className="text-gray-400" aria-hidden="true">/</span>
                  <span className="text-sm text-gray-600">{breadcrumb}</span>
                </>
              )}
            </div>
            {/* Actions inline with navigation (default behavior) */}
            {actions && actionPlacement === 'inline' && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}

        {/* Title + Subtitle + Actions Section */}
        <div className={cn(
          'flex gap-4',
          actionPlacement === 'stacked'
            ? 'flex-col'
            : 'flex-col md:flex-row md:items-start md:justify-between'
        )}>
          {/* Title Block */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Actions stacked below title (when actionPlacement='stacked') */}
          {actions && actionPlacement === 'stacked' && (
            <div className="w-full md:w-auto md:flex-shrink-0">
              <div className="flex gap-2">{actions}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
