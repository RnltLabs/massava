/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsListItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  description?: string;
  preview?: React.ReactNode;
  onClick: () => void;
  showChevron?: boolean;
  showBorder?: boolean;
  variant?: 'default' | 'danger';
}

export function SettingsListItem({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  description,
  preview,
  onClick,
  showChevron = true,
  showBorder = true,
  variant = 'default',
}: SettingsListItemProps): React.JSX.Element {
  const isDanger = variant === 'danger';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left",
        isDanger
          ? "hover:bg-red-100/50 active:bg-red-100"
          : "hover:bg-accent/50 active:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
        isDanger ? "focus-visible:ring-red-500" : "focus-visible:ring-primary",
        showBorder && "border-b border-border last:border-b-0"
      )}
    >
      {/* Icon mit farbigem Background */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
          iconBg
        )}
        aria-hidden="true"
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>

      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[15px] font-medium",
          isDanger ? "text-red-600" : "text-foreground"
        )}>
          {label}
        </p>
        {description && (
          <p className={cn(
            "text-[13px] truncate",
            isDanger ? "text-red-600/70" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
      </div>

      {/* Preview (optional) */}
      {preview && (
        <div className="shrink-0 text-[13px] text-muted-foreground max-w-[120px] truncate text-right">
          {preview}
        </div>
      )}

      {/* Chevron */}
      {showChevron && (
        <ChevronRightIcon
          className={cn(
            "h-5 w-5 shrink-0",
            isDanger ? "text-red-400" : "text-muted-foreground/50"
          )}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
