/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  preview?: React.ReactNode;
  onEdit: () => void;
  variant?: 'default' | 'featured';
  iconBg?: string;
  iconColor?: string;
}

export function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  preview,
  onEdit,
  variant = 'default',
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
}: SettingsCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-5",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20",
        variant === 'featured' && "md:col-span-2 bg-gradient-to-br from-primary/5 to-accent/5"
      )}
    >
      {/* Decorative blur for featured variant */}
      {variant === 'featured' && (
        <div
          className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            "group-hover:scale-105 transition-transform duration-300",
            iconBg
          )}
          aria-hidden="true"
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {title}
            </h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              className={cn(
                "h-8 w-8 shrink-0 rounded-full",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-primary/10"
              )}
              aria-label={`${title} bearbeiten`}
            >
              <Edit2Icon className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}

          {preview && (
            <div className="mt-3 text-sm text-foreground">
              {preview}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
