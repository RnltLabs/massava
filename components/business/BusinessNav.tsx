/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import Link from 'next/link';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserIcon, LogOutIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BusinessNavProps {
  session: Session;
  locale: string;
  hasStudio?: boolean;
}

export function BusinessNav({ session, locale, hasStudio = true }: BusinessNavProps): React.JSX.Element {
  const router = useRouter();

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async (): Promise<void> => {
    await signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Logo - Show on mobile always, and on desktop when no studio (onboarding mode) */}
      <Link
        href={`/${locale}/business`}
        className={`flex items-center ${hasStudio ? 'md:hidden' : ''}`}
      >
        <span className="text-xl font-bold text-[#B56550]">Massava</span>
      </Link>

      {/* User Menu - Positioned on the right */}
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={session.user?.image ?? undefined}
                  alt={session.user?.name ?? 'User'}
                />
                <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Settings - Only show when user has a studio */}
            {hasStudio && (
              <DropdownMenuItem onClick={() => router.push(`/${locale}/business/settings/profile`)}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(`/${locale}/account`)}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
