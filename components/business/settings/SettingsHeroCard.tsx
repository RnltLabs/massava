/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';

interface SettingsHeroCardProps {
  studioName: string;
  studioLogo?: string | null;
  servicesCount: number;
  publicProfileUrl?: string;
  locale: string;
}

export function SettingsHeroCard({
  studioName,
  studioLogo,
  servicesCount,
  publicProfileUrl,
  locale,
}: SettingsHeroCardProps): React.JSX.Element {
  // Get initials from studio name
  const initials = studioName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 backdrop-blur-sm border border-white/20 shadow-lg p-6">
      {/* Decorative blur elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-accent/15 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

      {/* Content */}
      <div className="relative flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-white shadow-md">
          {studioLogo && <AvatarImage src={studioLogo} alt={studioName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-foreground truncate">
            {studioName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {servicesCount} {servicesCount === 1 ? 'Service' : 'Services'} • {locale.toUpperCase()}
          </p>
        </div>
      </div>

      {publicProfileUrl && (
        <Button
          variant="ghost"
          className="mt-4 w-full justify-center text-primary hover:bg-primary/10"
          asChild
        >
          <a href={publicProfileUrl} target="_blank" rel="noopener noreferrer">
            Öffentliches Profil anzeigen
            <ExternalLinkIcon className="ml-2 h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      )}
    </div>
  );
}
