/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unified Auth Dialog Component
 * Single modal with tabs for Sign Up and Login
 * Mobile-responsive (uses Sheet on mobile, Dialog on desktop)
 */

'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpForm } from './SignUpForm';
import { LoginForm } from './LoginForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AccountTypeSelector, type AccountType } from './AccountTypeSelector';
import { AccountTypeToggle } from './AccountTypeToggle';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type AuthView = 'main' | 'forgot-password';
type AuthStep = 'select' | 'form';

// Translation types
type AccountTypeTranslations = {
  account_type_selector: {
    customer: {
      title: string;
      subtitle: string;
    };
    studio: {
      title: string;
      subtitle: string;
    };
    welcome_signup: string;
    welcome_login: string;
    subtitle_signup: string;
    subtitle_login: string;
  };
  account_type_toggle: {
    customer: string;
    studio: string;
  };
  tabs: {
    login: string;
    signup: string;
  };
};

// Simple translation helper (can be replaced with next-intl later)
const getTranslations = (locale: string): AccountTypeTranslations => {
  const translations: Record<string, AccountTypeTranslations> = {
    en: {
      account_type_selector: {
        customer: {
          title: 'I want to book',
          subtitle: 'Find massage studios and reserve appointments',
        },
        studio: {
          title: 'I own a studio',
          subtitle: 'Manage my massage studio and receive bookings',
        },
        welcome_signup: 'Welcome to Massava',
        welcome_login: 'Welcome back',
        subtitle_signup: 'Choose how you want to use Massava',
        subtitle_login: 'Continue as customer or studio owner',
      },
      account_type_toggle: {
        customer: 'Customer',
        studio: 'Studio Owner',
      },
      tabs: {
        login: 'Login',
        signup: 'Sign Up',
      },
    },
    de: {
      account_type_selector: {
        customer: {
          title: 'Ich möchte buchen',
          subtitle: 'Massagen finden und Termine online reservieren',
        },
        studio: {
          title: 'Ich habe ein Studio',
          subtitle: 'Mein Massage-Studio verwalten und Kunden empfangen',
        },
        welcome_signup: 'Willkommen bei Massava',
        welcome_login: 'Willkommen zurück',
        subtitle_signup: 'Wähle aus, wie du Massava nutzen möchtest',
        subtitle_login: 'Weiter als Kunde oder Studio-Inhaber',
      },
      account_type_toggle: {
        customer: 'Kunde',
        studio: 'Studio-Inhaber',
      },
      tabs: {
        login: 'Anmelden',
        signup: 'Registrieren',
      },
    },
    th: {
      account_type_selector: {
        customer: {
          title: 'ฉันต้องการจองนวด',
          subtitle: 'ค้นหาร้านนวดและจองคิวออนไลน์',
        },
        studio: {
          title: 'ฉันเป็นเจ้าของร้าน',
          subtitle: 'จัดการร้านนวดและรับจองลูกค้า',
        },
        welcome_signup: 'ยินดีต้อนรับสู่ Massava',
        welcome_login: 'ยินดีต้อนรับกลับมา',
        subtitle_signup: 'เลือกวิธีที่คุณต้องการใช้ Massava',
        subtitle_login: 'ดำเนินการต่อในฐานะลูกค้าหรือเจ้าของร้าน',
      },
      account_type_toggle: {
        customer: 'ลูกค้า',
        studio: 'เจ้าของร้าน',
      },
      tabs: {
        login: 'เข้าสู่ระบบ',
        signup: 'ลงทะเบียน',
      },
    },
  };

  return translations[locale] || translations.en;
};

export function UnifiedAuthDialog({
  open,
  onOpenChange,
  defaultTab = 'login',
  locale = 'en',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
  locale?: string;
}) {
  const [currentTab, setCurrentTab] = useState<'login' | 'signup'>(defaultTab);
  const [view, setView] = useState<AuthView>('main');
  const [step, setStep] = useState<AuthStep>('select');
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const t = getTranslations(locale);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset view when dialog closes
  useEffect(() => {
    if (!open) {
      setView('main');
      setStep('select');
      setAccountType(null);
      setCurrentTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Update tab when defaultTab changes
  useEffect(() => {
    setCurrentTab(defaultTab);
  }, [defaultTab]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleForgotPassword = () => {
    setView('forgot-password');
  };

  const handleBackToLogin = () => {
    setView('main');
    setCurrentTab('login');
  };

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep('form');
  };

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
  };

  const handleBackToSelect = () => {
    setStep('select');
    setAccountType(null);
  };

  const content = (
    <div className="w-full">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      {/* Back button (when on form step) */}
      {view === 'main' && step === 'form' && (
        <button
          onClick={handleBackToSelect}
          className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </button>
      )}

      {/* Main view - Account Type Selection */}
      {view === 'main' && step === 'select' && (
        <AccountTypeSelector
          onSelect={handleAccountTypeSelect}
          mode={currentTab}
          translations={t.account_type_selector}
        />
      )}

      {/* Main view - Forms with Tabs */}
      {view === 'main' && step === 'form' && accountType && (
        <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as 'login' | 'signup')}>
          <div className="space-y-6">
            {/* Account Type Toggle (small, allows correction) */}
            <AccountTypeToggle
              value={accountType}
              onChange={handleAccountTypeChange}
              translations={t.account_type_toggle}
            />

            {/* Tabs */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t.tabs.login}</TabsTrigger>
              <TabsTrigger value="signup">{t.tabs.signup}</TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="login" className="mt-6">
              <LoginForm
                locale={locale}
                accountType={accountType}
                onForgotPassword={handleForgotPassword}
              />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <SignUpForm locale={locale} accountType={accountType} />
            </TabsContent>
          </div>
        </Tabs>
      )}

      {/* Forgot Password view */}
      {view === 'forgot-password' && (
        <ForgotPasswordForm locale={locale} onBack={handleBackToLogin} />
      )}
    </div>
  );

  // Mobile: Use Sheet (full-screen bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>Authentication</SheetTitle>
          </VisuallyHidden>
          <div className="p-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Authentication</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
