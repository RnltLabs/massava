/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard, ChevronDown, Building2 } from 'lucide-react';
import { AuthModal } from './AuthModal';
import LanguageSwitcher from './LanguageSwitcher';

type Studio = {
  id: string;
  name: string;
};

export default function Header() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [authContext, setAuthContext] = useState<'general' | 'register'>('general');
  const [studios, setStudios] = useState<Studio[]>([]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}` });
  };

  const openAuthModal = (context: 'general' | 'register' = 'general') => {
    setAuthContext(context);
    setShowAuthModal(true);
  };

  // Fetch user's studios when logged in
  useEffect(() => {
    if (session?.user) {
      fetch(`/${locale}/api/user/studios`)
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
    return session?.user?.name || session?.user?.email || 'Mein Account';
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

            {/* Right Section: Language Switcher + Auth */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : session ? (
                // Logged in - Show user menu
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-accent/20 hover:bg-accent/30 transition-colors rounded-2xl"
                  >
                    {studios.length > 0 ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
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
                          {t('dashboard')}
                        </Link>
                        <Link
                          href={`/${locale}/studios/register`}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors text-foreground"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Building2 className="h-4 w-4" />
                          {t('register_studio')}
                        </Link>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Not logged in - Show "Für Studios" button
                <button
                  onClick={() => openAuthModal('general')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors rounded-2xl wellness-shadow"
                >
                  <Building2 className="h-4 w-4" />
                  {t('for_studios_button')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          locale={locale}
          context={authContext}
        />
      )}
    </>
  );
}
