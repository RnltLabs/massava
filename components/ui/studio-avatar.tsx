/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Avatar Component
 * Displays studio logo with generative fallback using boring-avatars
 */

'use client';

import React from 'react';
import Avatar from 'boring-avatars';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StudioAvatarProps {
  /**
   * Studio logo URL (if uploaded)
   */
  logoUrl?: string | null;

  /**
   * Studio name (used to generate unique avatar)
   */
  studioName: string;

  /**
   * Studio ID (fallback for avatar generation)
   */
  studioId?: string;

  /**
   * Size of the avatar
   */
  size?: number;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Avatar variant (style)
   * @default 'bauhaus'
   */
  variant?: 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
}

/**
 * Studio Avatar with generative fallback
 *
 * - If logoUrl exists: Shows uploaded logo
 * - If no logo: Generates unique geometric pattern based on studio name
 * - Uses Terracotta color palette for consistency
 */
export function StudioAvatar({
  logoUrl,
  studioName,
  studioId,
  size = 128,
  className,
  variant = 'bauhaus',
}: StudioAvatarProps): React.JSX.Element {
  // Terracotta-inspired color palette (warm, earthy, wellness tones)
  const colors = [
    '#B56550', // Primary Terracotta
    '#D4836F', // Light Terracotta
    '#8B4E3C', // Dark Terracotta
    '#E6A88F', // Peach
    '#C9997A', // Warm Beige
  ];

  // Use studio name as seed for consistent avatar generation
  const seed = studioName || studioId || 'default-studio';

  if (logoUrl) {
    // Show uploaded logo
    return (
      <ShadcnAvatar className={cn('border-2 border-gray-200', className)} style={{ width: size, height: size }}>
        <AvatarImage src={logoUrl} alt={`${studioName} logo`} />
        <AvatarFallback className="bg-terracotta-100">
          <Avatar
            size={size}
            name={seed}
            variant={variant}
            colors={colors}
          />
        </AvatarFallback>
      </ShadcnAvatar>
    );
  }

  // Show generative avatar (no logo uploaded)
  return (
    <div
      className={cn('rounded-full overflow-hidden border-2 border-gray-200', className)}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={seed}
        variant={variant}
        colors={colors}
      />
    </div>
  );
}
