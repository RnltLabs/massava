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
        // Register new customer
        const response = await apiFetch(`/${locale}/api/auth/customer/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Registration failed');
        }
      }

      // Sign in with unified credentials provider
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('error_invalid_credentials'));
        setLoading(false);
        return;
      }

      router.push(getAuthCallbackUrl(`/${locale}/customer/dashboard`));
      router.refresh();
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message || t('error_general'));
      setLoading(false);
    }
  };

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
