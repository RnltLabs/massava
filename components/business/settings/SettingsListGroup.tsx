/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SettingsListItem {
  key: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: string | number;
}

interface SettingsListGroupProps {
  title: string;
  items: SettingsListItem[];
}

export function SettingsListGroup({ title, items }: SettingsListGroupProps): React.JSX.Element {
  return (
    <section className="space-y-2">
      {/* Section Header */}
      <h3
        className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4"
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {title}
      </h3>

      {/* Grouped Card */}
      <div
        className="bg-card rounded-xl overflow-hidden shadow-sm"
        role="navigation"
        aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 transition-colors",
                "hover:bg-accent/50 active:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                !isLast && "border-b border-border"
              )}
            >
              {/* Icon mit farbigem Background */}
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  item.iconBg
                )}
                aria-hidden="true"
              >
                <Icon className={cn("h-5 w-5", item.iconColor)} />
              </div>

              {/* Label & Description */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-foreground">
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-[13px] text-muted-foreground truncate">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Badge (optional) */}
              {item.badge !== undefined && (
                <Badge variant="secondary" className="shrink-0 rounded-full">
                  {item.badge}
                </Badge>
              )}

              {/* Chevron */}
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
