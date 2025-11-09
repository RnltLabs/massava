/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar, User, Settings, LayoutDashboard, LogOut, HelpCircle, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Session } from 'next-auth';
import type { LucideIcon } from 'lucide-react';

interface MobileProfileSheetProps {
  user: Session['user'];
  isStudioOwner: boolean;
  hasRegisteredStudio: boolean;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileProfileSheet({
  user,
  isStudioOwner,
  hasRegisteredStudio,
  locale,
  open,
  onOpenChange,
}: MobileProfileSheetProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  // TODO: Get from API
  const pendingBookingsCount = 0;

  const handleLocaleChange = (newLocale: string): void => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 w-11 rounded-full p-0"
          aria-label="Open profile menu"
        >
          <Avatar className="h-9 w-9 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getUserInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl p-6 pb-8">
        {/* User Info Header */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getUserInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">{user?.name || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Navigation Items */}
        <nav className="space-y-1">
          {isStudioOwner ? (
            <>
              <SheetMenuItem
                href={`/${locale}/business`}
                icon={LayoutDashboard}
                label="Studio Dashboard"
                onClick={() => onOpenChange(false)}
              />
              {hasRegisteredStudio && (
                <SheetMenuItem
                  href={`/${locale}/business/settings/profile`}
                  icon={Settings}
                  label="Studio Settings"
                  onClick={() => onOpenChange(false)}
                />
              )}
              <SheetMenuItem
                href={`/${locale}/account`}
                icon={User}
                label="My Account"
                onClick={() => onOpenChange(false)}
              />
              <SheetMenuItem
                href={`/${locale}/business/bookings`}
                icon={Calendar}
                label="Bookings"
                badge={pendingBookingsCount > 0 ? pendingBookingsCount : undefined}
                onClick={() => onOpenChange(false)}
              />
            </>
          ) : (
            <>
              <SheetMenuItem
                href={`/${locale}/customer/dashboard`}
                icon={Calendar}
                label="My Bookings"
                onClick={() => onOpenChange(false)}
              />
              <SheetMenuItem
                href={`/${locale}/dashboard`}
                icon={User}
                label="My Account"
                onClick={() => onOpenChange(false)}
              />
            </>
          )}
        </nav>

        <Separator className="my-4" />

        {/* Language Selection */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language
          </p>
          <button
            onClick={() => handleLocaleChange('de')}
            className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-accent transition-colors"
          >
            <span>Deutsch</span>
            {locale === 'de' && <Check className="h-4 w-4 text-primary" />}
          </button>
          <button
            onClick={() => handleLocaleChange('en')}
            className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-accent transition-colors"
          >
            <span>English</span>
            {locale === 'en' && <Check className="h-4 w-4 text-primary" />}
          </button>
        </div>

        {isStudioOwner && (
          <>
            <Separator className="my-4" />
            <SheetMenuItem
              href={`/${locale}/business/help`}
              icon={HelpCircle}
              label="Help"
              onClick={() => onOpenChange(false)}
            />
          </>
        )}

        <Separator className="my-4" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </SheetContent>
    </Sheet>
  );
}

interface SheetMenuItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  onClick?: () => void;
}

function SheetMenuItem({ href, icon: Icon, label, badge, onClick }: SheetMenuItemProps): React.JSX.Element {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors"
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
