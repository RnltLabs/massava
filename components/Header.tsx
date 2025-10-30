/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard, ChevronDown, Calendar, Briefcase } from 'lucide-react';
import { UnifiedAuthDialog } from './auth/UnifiedAuthDialog';
import LanguageSwitcher from './LanguageSwitcher';
import { MobileNav } from './MobileNav';
import { apiFetch } from '@/lib/api-client';
import { getAuthCallbackUrl } from '@/lib/navigation';

type Studio = {
  id: string;
  name: string;
};

export default function Header() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [studios, setStudios] = useState<Studio[]>([]);

  // Unified Auth Dialog State
  const [authDialog, setAuthDialog] = useState<{
    open: boolean;
    tab: 'login' | 'signup';
  }>({
    open: false,
    tab: 'login',
  });


  // Auto-open auth dialog if openAuth or openLogin query param is present
  useEffect(() => {
    const openAuth = searchParams.get('openAuth');
    const openLogin = searchParams.get('openLogin');

    if ((openAuth || openLogin) && !session) {
      setAuthDialog({
        open: true,
        tab: openAuth === 'signup' ? 'signup' : 'login',
      });

      // Remove query param from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('openAuth');
      url.searchParams.delete('openLogin');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, session]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: getAuthCallbackUrl(`/${locale}`) });
  };

  // Fetch user's studios when logged in
  useEffect(() => {
    if (session?.user) {
      apiFetch(`/${locale}/api/user/studios`)
        .then((res) => res.json())
        .then((data) => {
          if (data.studios) {
            setStudios(data.studios);
          }
        })
        .catch((err) => console.error('Failed to fetch studios:', err));
    } else {
      setStudios([]);
    }
  }, [session, locale]);

  // Determine display name
  const getDisplayName = () => {
    if (studios.length > 0) {
      return studios[0].name; // Show first studio name
    }
    return session?.user?.name || session?.user?.email || t('my_account');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-b border-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Massava</div>
            </Link>

            {/* Desktop Navigation - Hidden on Mobile */}
            <div className="hidden sm:flex items-center gap-3">
              <LanguageSwitcher />

              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : session ? (
                // Logged in - Show user menu
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-accent/20 hover:bg-accent/30 transition-colors rounded-2xl"
                    aria-label="Open user menu"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">{getDisplayName()}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-card wellness-shadow rounded-2xl overflow-hidden z-50">
                        <Link
                          href={`/${locale}/dashboard`}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors text-foreground"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        {studios.length > 0 && (
                          <>
                            <Link
                              href={`/${locale}/dashboard/owner/calendar`}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors text-foreground"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Calendar className="h-4 w-4" />
                              Kalender
                            </Link>
                            <Link
                              href={`/${locale}/dashboard/owner/services`}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors text-foreground"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Briefcase className="h-4 w-4" />
                              Leistungen
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Not logged in - Show unified auth buttons
                <>
                  <button
                    onClick={() =>
                      setAuthDialog({ open: true, tab: 'login' })
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/20 transition-colors rounded-2xl"
                    aria-label="Sign in to your account"
                  >
                    Anmelden
                  </button>

                  <button
                    onClick={() =>
                      setAuthDialog({ open: true, tab: 'signup' })
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors rounded-2xl wellness-shadow"
                    aria-label="Create a new account"
                  >
                    Registrieren
                  </button>
                </>
              )}
            </div>

            {/* Mobile Navigation - Hamburger Menu */}
            <MobileNav
              locale={locale}
              isAuthenticated={!!session}
              displayName={session ? getDisplayName() : undefined}
              hasStudio={studios.length > 0}
              onLoginClick={() => setAuthDialog({ open: true, tab: 'login' })}
              onSignupClick={() => setAuthDialog({ open: true, tab: 'signup' })}
              onLogoutClick={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Unified Auth Dialog */}
      <UnifiedAuthDialog
        isOpen={authDialog.open}
        onClose={() => setAuthDialog({ ...authDialog, open: false })}
        initialMode={authDialog.tab}
      />
    </>
  );
}
