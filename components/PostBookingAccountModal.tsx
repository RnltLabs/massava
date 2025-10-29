/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, X, Star } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { getAuthCallbackUrl } from '@/lib/navigation';

type Props = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locale: string;
  onClose: () => void;
};

export function PostBookingAccountModal({ customerName, customerEmail, customerPhone, locale, onClose }: Props) {
  const t = useTranslations('post_booking_modal');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Register new customer
      const response = await apiFetch(`/${locale}/api/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Sign in automatically with unified credentials provider
      const result = await signIn('credentials', {
        email: customerEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Login failed');
      }

      // Redirect to dashboard
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Benefits List */}
        <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/20 rounded-2xl">
          <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            {t('benefits_title')}
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>{t('benefit_1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>{t('benefit_2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>{t('benefit_3')}</span>
            </li>
          </ul>
        </div>

        {/* Create Account Form */}
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('password_label')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password_placeholder')}
              className="w-full px-4 py-3 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('password_hint')}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all wellness-shadow"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {t('create_button')}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('skip_button')}
          </button>
        </form>

        {/* Pre-filled info notice */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          {t('prefill_notice')}
        </p>
      </div>
    </div>
  );
}
