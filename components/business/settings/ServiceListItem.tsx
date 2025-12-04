/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceListItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  description?: string;
  preview?: React.ReactNode;
  onClick: () => void;
  onDelete?: () => void;
  showChevron?: boolean;
  showBorder?: boolean;
}

export function ServiceListItem({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  description,
  preview,
  onClick,
  onDelete,
  showChevron = true,
  showBorder = true,
}: ServiceListItemProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 transition-colors",
        showBorder && "border-b border-border last:border-b-0"
      )}
    >
      {/* Clickable area for editing */}
      <button
        onClick={onClick}
        className={cn(
          "flex-1 flex items-center gap-3 min-w-0 text-left",
          "hover:opacity-70 active:opacity-50 transition-opacity",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-lg -ml-2 pl-2 -my-1 py-1"
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
          <p className="text-[15px] font-medium text-foreground">
            {label}
          </p>
          {description && (
            <p className="text-[13px] truncate text-muted-foreground">
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
            className="h-5 w-5 shrink-0 text-muted-foreground/50"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-destructive"
          )}
          aria-label={`${label} löschen`}
        >
          <Trash2Icon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
