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
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('pb-4 border-b border-gray-200 bg-white', className)}>
      <div className="space-y-3">
        {/* Back Button + Breadcrumb */}
        {showBackButton && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BackButton href={backHref} label={backLabel} />
              {breadcrumb && (
                <>
                  <span className="text-gray-400" aria-hidden="true">/</span>
                  <span className="text-sm text-gray-600">{breadcrumb}</span>
                </>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* Title + Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
