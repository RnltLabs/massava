/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function SettingsSection({
  title,
  children,
  variant = 'default',
}: SettingsSectionProps): React.JSX.Element {
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section className="space-y-2">
      {/* Section Header */}
      <h3
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wider px-4",
          variant === 'danger' ? 'text-red-600' : 'text-muted-foreground'
        )}
        id={sectionId}
      >
        {title}
      </h3>

      {/* Grouped Card Container */}
      <div
        className={cn(
          "rounded-xl overflow-hidden shadow-sm",
          variant === 'danger'
            ? 'bg-red-50/50 border-2 border-red-200'
            : 'bg-card'
        )}
        role="group"
        aria-labelledby={sectionId}
      >
        {children}
      </div>
    </section>
  );
}
