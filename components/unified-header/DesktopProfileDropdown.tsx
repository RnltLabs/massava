/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, User, Settings, LayoutDashboard, LogOut, HelpCircle, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Session } from 'next-auth';

interface DesktopProfileDropdownProps {
  user: Session['user'];
  isStudioOwner: boolean;
  hasRegisteredStudio: boolean;
  locale: string;
}

export function DesktopProfileDropdown({
  user,
  isStudioOwner,
  hasRegisteredStudio,
  locale,
}: DesktopProfileDropdownProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth');

  // TODO: Get from API
  const pendingBookingsCount = 0;

  const handleLocaleChange = (newLocale: string): void => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const handleLogout = async (): Promise<void> => {
    await signOut({ callbackUrl: `/${locale}` });
  };

  const getUserInitials = (name?: string | null): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getUserInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getUserInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation Items */}
        {isStudioOwner ? (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/business`} className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                {t('studio_dashboard')}
              </Link>
            </DropdownMenuItem>
            {hasRegisteredStudio && (
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/business/settings`} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('studio_settings')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/business/settings/account?from=header`} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('my_account')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/${locale}/business/bookings`}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('bookings')}
                </span>
                {pendingBookingsCount > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                    {pendingBookingsCount}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/customer/bookings`} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('my_bookings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/customer/account?from=header`} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('my_account')}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Language Submenu */}
        <DropdownMenuLabel className="flex items-center gap-2 font-normal text-sm">
          <Globe className="h-4 w-4" />
          {t('language')}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleLocaleChange('de')}
          className="flex items-center justify-between pl-8"
        >
          Deutsch
          {locale === 'de' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange('en')}
          className="flex items-center justify-between pl-8"
        >
          English
          {locale === 'en' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {isStudioOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/business/help`} className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                {t('help')}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
