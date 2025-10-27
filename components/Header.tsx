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
import { CustomerAuthModal } from './CustomerAuthModal';
import LanguageSwitcher from './LanguageSwitcher';
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
  const [showStudioAuthModal, setShowStudioAuthModal] = useState(false);
  const [showCustomerAuthModal, setShowCustomerAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [authContext, setAuthContext] = useState<'general' | 'register'>('general');
  const [studios, setStudios] = useState<Studio[]>([]);

  // Determine if user is a studio owner or customer
  const isStudioOwner = session?.user?.email && studios.length > 0;

  const handleLogout = async () => {
    await signOut({ callbackUrl: getAuthCallbackUrl(`/${locale}`) });
  };

  const openStudioAuthModal = (context: 'general' | 'register' = 'general') => {
    setAuthContext(context);
    setShowStudioAuthModal(true);
  };

  const openCustomerAuthModal = () => {
    setShowCustomerAuthModal(true);
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

            {/* Right Section: Language Switcher + Auth Buttons */}
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
                    {isStudioOwner ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline max-w-[150px] truncate">{getDisplayName()}</span>
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
                          href={`/${locale}/${isStudioOwner ? 'dashboard' : 'customer/dashboard'}`}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors text-foreground"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {t('dashboard')}
                        </Link>
                        {isStudioOwner && (
                          <Link
                            href={`/${locale}/studios/register`}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors text-foreground"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Building2 className="h-4 w-4" />
                            {t('register_studio')}
                          </Link>
                        )}
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
                // Not logged in - Show both auth buttons
                <>
                  {/* Customer Login Button */}
                  <button
                    onClick={openCustomerAuthModal}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-accent/20 hover:bg-accent/30 transition-colors rounded-2xl"
                    title={t('customer_login')}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('customer_login_button')}</span>
                  </button>

                  {/* Studio Login Button (Primary CTA) */}
                  <button
                    onClick={() => openStudioAuthModal('general')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors rounded-2xl wellness-shadow"
                    title={t('for_studios_button')}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('for_studios_button')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Studio Auth Modal */}
      {showStudioAuthModal && (
        <AuthModal
          onClose={() => setShowStudioAuthModal(false)}
          locale={locale}
          context={authContext}
        />
      )}

      {/* Customer Auth Modal */}
      {showCustomerAuthModal && (
        <CustomerAuthModal
          onClose={() => setShowCustomerAuthModal(false)}
          locale={locale}
        />
      )}
    </>
  );
}
