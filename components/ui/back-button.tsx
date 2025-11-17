/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Back Button Component
 * Reusable back navigation button for mobile settings pages
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Optional custom href to navigate to. If not provided, uses router.back() */
  href?: string;
  /** Optional label to display next to the arrow. Defaults to "Zurück" */
  label?: string;
  /** Optional className for custom styling */
  className?: string;
  /** Optional onClick handler for custom behavior */
  onClick?: () => void;
}

export function BackButton({
  href,
  label = 'Zurück',
  className,
  onClick,
}: BackButtonProps): React.JSX.Element {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (href) {
      e.preventDefault();
      router.push(href);
    } else {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 px-2 py-2 -ml-2 rounded-lg transition-colors',
        'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2',
        'active:bg-gray-200',
        className
      )}
      aria-label={label}
    >
      <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
