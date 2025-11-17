/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Password Reset Request Page - Massava Design
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { BLOB_ANIMATION_DELAY_FAST } from '@/lib/constants/animations';

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'de';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // ACCESSIBILITY FIX #18: Use Zod for email validation
  const validateEmail = (email: string): boolean => {
    return z.string().email().safeParse(email).success;
  };

  // ACCESSIBILITY FIX #15: Focus management on error states
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError(locale === 'de' ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein' : 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.error || (locale === 'de' ? 'Ein Fehler ist aufgetreten' : 'An error occurred'));
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(locale === 'de' ? 'Ein Fehler ist aufgetreten' : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Decorative background blobs */}
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

        {/* Content */}
        <div className="relative z-10 max-w-md w-full mx-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'de' ? 'E-Mail gesendet' : 'Email Sent'}
            </h1>
            <p className="text-gray-600 mb-8">
              {locale === 'de'
                ? 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet. Bitte überprüfen Sie Ihr Postfach.'
                : 'If an account with that email exists, we have sent you a password reset link. Please check your inbox.'}
            </p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'de' ? 'Zur Startseite' : 'Back to Home'}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Decorative background blobs */}
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

      {/* Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sage-100 mb-6">
              <Mail className="h-10 w-10 text-sage-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {locale === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}
            </h1>
            <p className="text-gray-600">
              {locale === 'de'
                ? 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.'
                : 'Enter your email address and we will send you a link to reset your password.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'de' ? 'E-Mail-Adresse' : 'Email Address'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 outline-none transition-all"
                placeholder={locale === 'de' ? 'ihre.email@beispiel.de' : 'your.email@example.com'}
                required
                disabled={isLoading}
              />
              {touched && email && !validateEmail(email) && (
                <p className="mt-2 text-sm text-red-600">
                  {locale === 'de' ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein' : 'Please enter a valid email address'}
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
              disabled={isLoading || !email}
              className="w-full px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-live="polite"
              aria-atomic="true"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>{locale === 'de' ? 'Wird gesendet...' : 'Sending...'}</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" aria-hidden="true" />
                  <span>{locale === 'de' ? 'Link senden' : 'Send Reset Link'}</span>
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
