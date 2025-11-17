/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Password Reset Verification Page - Massava Design
 *
 * SECURITY FIXES:
 * - CR-003: Updated password validation to unified schema (min 10 chars + uppercase + number)
 * - CR-004: Replaced console.error with structured logging
 *
 * ACCESSIBILITY FIXES (WCAG 2.1 AA):
 * - Fix #14: Added ARIA labels to password toggle buttons
 * - Fix #15: Added focus management on error states
 * - Fix #16: Fixed color contrast on disabled buttons
 * - Fix #17: Added loading state announcements for screen readers
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { logger, generateCorrelationId } from '@/lib/logger';
import { BLOB_ANIMATION_DELAY_FAST } from '@/lib/constants/animations';

type VerificationStatus = 'verifying' | 'valid' | 'invalid' | 'expired' | 'updating' | 'success';

export default function ResetPasswordTokenPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'de';
  const token = params?.token as string;

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errorRef = useRef<HTMLDivElement>(null);

  // ACCESSIBILITY FIX #15: Focus management on error states
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
          setStatus('valid');
          setEmail(data.email);
        } else if (data.expired) {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
      } catch (err) {
        // SECURITY FIX #4: Structured logging instead of console.error
        logger.error('Token verification error', {
          action: 'TOKEN_VERIFY_CLIENT_ERROR',
          correlationId: generateCorrelationId(),
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        setStatus('invalid');
      }
    };

    verifyToken();
  }, [token]);

  // SECURITY FIX #3: Use unified password validation (min 10 chars + uppercase + number)
  const validatePassword = (password: string): string => {
    if (password.length < 10) {
      return locale === 'de'
        ? 'Passwort muss mindestens 10 Zeichen lang sein'
        : 'Password must be at least 10 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return locale === 'de'
        ? 'Passwort muss mindestens einen Großbuchstaben enthalten'
        : 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return locale === 'de'
        ? 'Passwort muss mindestens eine Zahl enthalten'
        : 'Password must contain at least one number';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError(locale === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    setStatus('updating');

    try {
      // Send plain password - will be hashed server-side
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 3000);
      } else {
        setError(data.error || (locale === 'de' ? 'Ein Fehler ist aufgetreten' : 'An error occurred'));
        setStatus('valid');
      }
    } catch (err) {
      // SECURITY FIX #4: Structured logging instead of console.error
      logger.error('Password update error', {
        action: 'PASSWORD_UPDATE_CLIENT_ERROR',
        correlationId: generateCorrelationId(),
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(locale === 'de' ? 'Ein Fehler ist aufgetreten' : 'An error occurred');
      setStatus('valid');
    }
  };

  // Loading state
  if (status === 'verifying') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div
          className="organic-blob"
          style={{
            width: '500px',
            height: '500px',
            background: 'oklch(0.50 0.15 20 / 0.15)',
            top: '-100px',
            right: '-150px',
          }}
        />
        <div
          className="organic-blob"
          style={{
            width: '400px',
            height: '400px',
            background: 'oklch(0.88 0.03 80 / 0.2)',
            bottom: '-100px',
            left: '-100px',
            animationDelay: BLOB_ANIMATION_DELAY_FAST,
          }}
        />

        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-sage-700 mx-auto mb-4" />
            <p className="text-gray-600">
              {locale === 'de' ? 'Link wird überprüft...' : 'Verifying link...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (status === 'invalid') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div
          className="organic-blob"
          style={{
            width: '500px',
            height: '500px',
            background: 'oklch(0.50 0.15 20 / 0.15)',
            top: '-100px',
            right: '-150px',
          }}
        />
        <div
          className="organic-blob"
          style={{
            width: '400px',
            height: '400px',
            background: 'oklch(0.88 0.03 80 / 0.2)',
            bottom: '-100px',
            left: '-100px',
            animationDelay: BLOB_ANIMATION_DELAY_FAST,
          }}
        />

        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'de' ? 'Ungültiger Link' : 'Invalid Link'}
            </h1>
            <p className="text-gray-600 mb-8">
              {locale === 'de'
                ? 'Dieser Link zum Zurücksetzen des Passworts ist ungültig. Bitte fordern Sie einen neuen Link an.'
                : 'This password reset link is invalid. Please request a new link.'}
            </p>
            <Link
              href={`/${locale}/auth/reset-password`}
              className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              {locale === 'de' ? 'Neuen Link anfordern' : 'Request New Link'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expired token
  if (status === 'expired') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div
          className="organic-blob"
          style={{
            width: '500px',
            height: '500px',
            background: 'oklch(0.50 0.15 20 / 0.15)',
            top: '-100px',
            right: '-150px',
          }}
        />
        <div
          className="organic-blob"
          style={{
            width: '400px',
            height: '400px',
            background: 'oklch(0.88 0.03 80 / 0.2)',
            bottom: '-100px',
            left: '-100px',
            animationDelay: BLOB_ANIMATION_DELAY_FAST,
          }}
        />

        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
              <AlertCircle className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'de' ? 'Link abgelaufen' : 'Link Expired'}
            </h1>
            <p className="text-gray-600 mb-8">
              {locale === 'de'
                ? 'Dieser Link ist abgelaufen. Links zum Zurücksetzen des Passworts sind nur 1 Stunde gültig.'
                : 'This link has expired. Password reset links are only valid for 1 hour.'}
            </p>
            <Link
              href={`/${locale}/auth/reset-password`}
              className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              {locale === 'de' ? 'Neuen Link anfordern' : 'Request New Link'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div
          className="organic-blob"
          style={{
            width: '500px',
            height: '500px',
            background: 'oklch(0.50 0.15 20 / 0.15)',
            top: '-100px',
            right: '-150px',
          }}
        />
        <div
          className="organic-blob"
          style={{
            width: '400px',
            height: '400px',
            background: 'oklch(0.88 0.03 80 / 0.2)',
            bottom: '-100px',
            left: '-100px',
            animationDelay: BLOB_ANIMATION_DELAY_FAST,
          }}
        />

        <div className="relative z-10 max-w-md w-full mx-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'de' ? 'Passwort aktualisiert' : 'Password Updated'}
            </h1>
            <p className="text-gray-600 mb-8">
              {locale === 'de'
                ? 'Ihr Passwort wurde erfolgreich aktualisiert. Sie werden zur Anmeldeseite weitergeleitet...'
                : 'Your password has been successfully updated. You will be redirected to the login page...'}
            </p>
            <Link
              href={`/${locale}`}
              className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              {locale === 'de' ? 'Jetzt anmelden' : 'Login Now'}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Valid token - show password reset form
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div
        className="organic-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'oklch(0.50 0.15 20 / 0.15)',
          top: '-100px',
          right: '-150px',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '400px',
          height: '400px',
          background: 'oklch(0.88 0.03 80 / 0.2)',
          bottom: '-100px',
          left: '-100px',
          animationDelay: BLOB_ANIMATION_DELAY_FAST,
        }}
      />

      <div className="relative z-10 max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sage-100 mb-6">
              <Lock className="h-10 w-10 text-sage-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {locale === 'de' ? 'Neues Passwort festlegen' : 'Set New Password'}
            </h1>
            <p className="text-gray-600">
              {locale === 'de'
                ? `Passwort zurücksetzen für ${email}`
                : `Reset password for ${email}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'de' ? 'Neues Passwort' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 outline-none transition-all"
                  placeholder={locale === 'de' ? 'Mindestens 10 Zeichen' : 'At least 10 characters'}
                  required
                  disabled={status === 'updating'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showPassword
                      ? (locale === 'de' ? 'Passwort verbergen' : 'Hide password')
                      : (locale === 'de' ? 'Passwort anzeigen' : 'Show password')
                  }
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {touched.password && password && validatePassword(password) && (
                <p className="mt-2 text-sm text-red-600">{validatePassword(password)}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 outline-none transition-all"
                  placeholder={locale === 'de' ? 'Passwort wiederholen' : 'Repeat password'}
                  required
                  disabled={status === 'updating'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword
                      ? (locale === 'de' ? 'Passwort verbergen' : 'Hide password')
                      : (locale === 'de' ? 'Passwort anzeigen' : 'Show password')
                  }
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {locale === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {error && (
              <div
                ref={errorRef}
                tabIndex={-1}
                className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'updating' || !password || !confirmPassword}
              className="w-full px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-live="polite"
              aria-atomic="true"
            >
              {status === 'updating' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>{locale === 'de' ? 'Wird aktualisiert...' : 'Updating...'}</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" aria-hidden="true" />
                  <span>{locale === 'de' ? 'Passwort aktualisieren' : 'Update Password'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm text-sage-700 hover:text-sage-800 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'de' ? 'Zurück zur Anmeldung' : 'Back to Login'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
