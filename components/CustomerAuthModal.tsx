/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';
import { getAuthCallbackUrl } from '@/lib/navigation';

type Props = {
  onClose: () => void;
  locale: string;
  prefillData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export function CustomerAuthModal({ onClose, locale, prefillData }: Props) {
  const t = useTranslations('customer_auth');
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: prefillData?.email || '',
    password: '',
    name: prefillData?.name || '',
    phone: prefillData?.phone || '',
  });

  const handleCustomerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        console.log('📝 Starting customer registration with:', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '(not provided)',
          passwordLength: formData.password?.length || 0,
        });

        // Register new customer
        const response = await apiFetch(`/${locale}/api/auth/customer/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        console.log('📥 Registration response:', response.status, response.statusText);

        if (!response.ok) {
          const data = await response.json();
          console.error('❌ Registration failed:', data);
          throw new Error(data.error || 'Registration failed');
        }

        console.log('✅ Customer registered successfully');

        // Show success message - user needs to verify email before login
        setRegistrationSuccess(true);
        setLoading(false);
        return;
      }

      // Sign in (only for existing users, not after registration)
      console.log('🔐 Attempting sign in for:', formData.email);

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        console.error('❌ Sign in failed:', result.error);
        setError(t('error_invalid_credentials'));
        setLoading(false);
        return;
      }

      console.log('✅ Sign in successful');
      router.push(getAuthCallbackUrl(`/${locale}/customer/dashboard`));
      router.refresh();
      onClose();
    } catch (err) {
      const error = err as Error;
      console.error('❌ Error during auth:', error);
      setError(error.message || t('error_general'));
      setLoading(false);
    }
  };

  // Registration success view
  if (registrationSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md bg-card rounded-3xl p-8 wellness-shadow text-center">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-4">Registrierung erfolgreich!</h2>
          <p className="text-muted-foreground mb-6">
            Wir haben eine Bestätigungs-E-Mail an <strong>{formData.email}</strong> gesendet.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Bitte überprüfen Sie Ihren Posteingang und klicken Sie auf den Verifizierungslink, um sich anmelden zu können.
          </p>

          <button
            onClick={() => {
              setRegistrationSuccess(false);
              setMode('signin');
              setFormData({ ...formData, password: '' });
            }}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors font-medium"
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md bg-card rounded-3xl p-8 wellness-shadow">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold mb-2">
          {mode === 'signin' ? t('signin_title') : t('signup_title')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {mode === 'signin' ? t('signin_subtitle') : t('signup_subtitle')}
        </p>

        {/* Benefits Box (only for signup) */}
        {mode === 'signup' && (
          <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/20 rounded-2xl">
            <div className="text-sm font-semibold text-primary mb-2">
              {t('benefits_title')}
            </div>
            <ul className="text-sm space-y-1 text-foreground">
              <li>✓ {t('benefit_history')}</li>
              <li>✓ {t('benefit_favorites')}</li>
              <li>✓ {t('benefit_reminders')}</li>
            </ul>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleCustomerAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{t('name')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t('email')}</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('password')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {mode === 'signin' ? t('signin_button') : t('signup_button')}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-sm">
          {mode === 'signin' ? (
            <>
              {t('no_account')}{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="text-primary hover:underline font-semibold"
              >
                {t('signup_link')}
              </button>
            </>
          ) : (
            <>
              {t('have_account')}{' '}
              <button
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className="text-primary hover:underline font-semibold"
              >
                {t('signin_link')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
