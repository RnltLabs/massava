/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileProfileSheet } from './MobileProfileSheet';
import { DesktopProfileDropdown } from './DesktopProfileDropdown';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { UnifiedAuthDialog } from '@/components/auth/UnifiedAuthDialog';

interface UnifiedHeaderProps {
  className?: string;
}

export function UnifiedHeader({ className }: UnifiedHeaderProps): React.JSX.Element {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Unified Auth Dialog State
  const [authDialog, setAuthDialog] = useState<{
    open: boolean;
    tab: 'login' | 'signup';
    accountType?: 'customer' | 'studio';
  }>({
    open: false,
    tab: 'login',
    accountType: undefined,
  });

  // Check for URL params to open auth dialog (e.g., ?signup=studio, ?openAuth=signup)
  useEffect(() => {
    const signupParam = searchParams.get('signup');
    const openAuthParam = searchParams.get('openAuth');
    const openLoginParam = searchParams.get('openLogin');

    // Don't open auth dialog if user is already authenticated
    if (session) return;

    // Handle studio signup
    if (signupParam === 'studio') {
      setAuthDialog({ open: true, tab: 'signup', accountType: 'studio' });
      // Clear the URL param without refresh
      const newUrl = pathname;
      router.replace(newUrl, { scroll: false });
      return;
    }

    // Handle openAuth or openLogin params (for guest booking flow)
    if (openAuthParam || openLoginParam) {
      setAuthDialog({
        open: true,
        tab: openAuthParam === 'signup' ? 'signup' : 'login',
        accountType: undefined,
      });
      // Clear the URL param without refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('openAuth');
      url.searchParams.delete('openLogin');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, pathname, router, session]);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  // Type guard to check user role
  const getUserRole = () => {
    if (!session?.user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (session.user as any)?.primaryRole || null;
  };

  const isStudioOwner = getUserRole() === 'STUDIO_OWNER';

  // Check if user has registered studio
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasRegisteredStudio = (session?.user as any)?.hasStudio === true;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 z-50 w-full',
          'h-14 md:h-16',
          'bg-card/80 backdrop-blur-lg',
          'border-b border-muted/20',
          'wellness-shadow',
          className
        )}
      >
        <div className="container mx-auto h-full px-4 md:px-6">
          <div className="flex h-full items-center justify-between">
            {/* Left Section: Logo */}
            <Logo isMobile={isMobile} isStudioOwner={isStudioOwner} hasStudio={hasRegisteredStudio} />

            {/* Right Section: Auth State Dependent */}
            <div className="flex items-center gap-2 md:gap-3">
              {isLoading ? (
                <LoadingSkeleton />
              ) : isAuthenticated ? (
                <>
                  {!isMobile && <LanguageSwitcher locale={locale} />}
                  {isMobile ? (
                    <MobileProfileSheet
                      user={session.user}
                      isStudioOwner={isStudioOwner}
                      hasRegisteredStudio={hasRegisteredStudio}
                      locale={locale}
                      open={isProfileOpen}
                      onOpenChange={setIsProfileOpen}
                    />
                  ) : (
                    <DesktopProfileDropdown
                      user={session.user}
                      isStudioOwner={isStudioOwner}
                      hasRegisteredStudio={hasRegisteredStudio}
                      locale={locale}
                    />
                  )}
                </>
              ) : (
                <>
                  <LanguageSwitcher locale={locale} compact={isMobile} />
                  <Button
                    variant="ghost"
                    size={isMobile ? 'sm' : 'default'}
                    className="h-9 md:h-10 px-3 md:px-4"
                    onClick={() => setAuthDialog({ open: true, tab: 'login' })}
                  >
                    Login
                  </Button>
                  <Button
                    size={isMobile ? 'sm' : 'default'}
                    className="h-9 md:h-10 px-4 md:px-6 bg-primary hover:bg-primary/90"
                    onClick={() => setAuthDialog({ open: true, tab: 'signup' })}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Unified Auth Dialog */}
      <UnifiedAuthDialog
        isOpen={authDialog.open}
        onClose={() => setAuthDialog({ ...authDialog, open: false, accountType: undefined })}
        initialMode={authDialog.tab}
        initialAccountType={authDialog.accountType}
      />
    </>
  );
}
