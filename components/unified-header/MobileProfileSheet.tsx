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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-[20px] px-4 pb-8 overflow-y-auto flex flex-col gap-0"
      >
        {/* Drag Handle (accessibility + affordance) */}
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-4 mt-2" />

        {/* Accessible Title (required for screen readers) */}
        <SheetHeader className="sr-only">
          <SheetTitle>Profile Menu</SheetTitle>
        </SheetHeader>

        {/* User Info Header (Compact) */}
        <div className="flex items-center gap-3 pb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getUserInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{user?.name || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Separator className="mb-2" />

        {/* Primary Navigation */}
        <nav className="flex flex-col gap-1 mb-2">
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
                  href={`/${locale}/business/settings`}
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
                href={`/${locale}/customer/bookings`}
                icon={Calendar}
                label="My Bookings"
                onClick={() => onOpenChange(false)}
              />
              <SheetMenuItem
                href={`/${locale}/customer/profile`}
                icon={User}
                label="My Account"
                onClick={() => onOpenChange(false)}
              />
            </>
          )}
        </nav>

        <Separator className="my-2" />

        {/* Secondary Actions - Language Selection */}
        <div className="flex flex-col gap-1 mb-2">
          <p className="px-4 py-2 text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language
          </p>
          <button
            onClick={() => handleLocaleChange('de')}
            className="w-full h-12 px-4 flex items-center justify-between rounded-xl hover:bg-accent transition-colors"
          >
            <span className="font-medium">Deutsch</span>
            {locale === 'de' && <Check className="h-4 w-4 text-primary" />}
          </button>
          <button
            onClick={() => handleLocaleChange('en')}
            className="w-full h-12 px-4 flex items-center justify-between rounded-xl hover:bg-accent transition-colors"
          >
            <span className="font-medium">English</span>
            {locale === 'en' && <Check className="h-4 w-4 text-primary" />}
          </button>

          {isStudioOwner && (
            <Link
              href={`/${locale}/business/help`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 h-12 px-4 rounded-xl hover:bg-accent transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="flex-1 font-medium">Help</span>
            </Link>
          )}
        </div>

        <Separator className="my-2" />

        {/* Logout (Destructive Action) */}
        <button
          onClick={handleLogout}
          className="w-full h-12 px-4 flex items-center gap-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>

        {/* Bottom padding for safe area */}
        <div className="h-2" />
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
      className="flex items-center gap-3 h-12 px-4 rounded-xl hover:bg-accent transition-colors"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs ml-auto">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
