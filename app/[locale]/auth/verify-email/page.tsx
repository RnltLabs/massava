/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Verification Page - Massava Design
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { verifyEmailVerificationToken } from '@/lib/email-verification';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';

async function VerifyEmailContent({
  searchParams,
  locale,
}: {
  searchParams: { token?: string };
  locale: string;
}) {
  const t = await getTranslations('VerifyEmail');
  const token = searchParams.token;

  if (!token) {
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
            animationDelay: '3s',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ungültiger Link
            </h1>
            <p className="text-gray-600 mb-8">
              Dieser Verifizierungslink ist ungültig. Bitte überprüfen Sie den Link in Ihrer E-Mail.
            </p>
            <Link
              href={`/${locale}`}
              className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Verify token
  const email = await verifyEmailVerificationToken(token);

  if (!email) {
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
            animationDelay: '3s',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
              <Mail className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Link abgelaufen
            </h1>
            <p className="text-gray-600 mb-2">
              Dieser Verifizierungslink ist abgelaufen.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Bitte fordern Sie einen neuen Verifizierungslink an.
            </p>
            <Link
              href={`/${locale}`}
              className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Update unified User model with email verification
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
  } else {
    // Fallback: Check legacy models (for users who haven't been migrated yet)
    const customer = await prisma.customer.findUnique({ where: { email } });
    const studioOwner = await prisma.studioOwner.findUnique({ where: { email } });

    if (customer) {
      await prisma.customer.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
    } else if (studioOwner) {
      await prisma.studioOwner.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
    }
  }

  // Success - no auto-redirect, user clicks to go to login
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Decorative background blobs - Success theme (green) */}
      <div
        className="organic-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'oklch(0.62 0.08 140 / 0.2)',
          top: '-100px',
          right: '-150px',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '400px',
          height: '400px',
          background: 'oklch(0.88 0.03 120 / 0.25)',
          bottom: '-100px',
          left: '-100px',
          animationDelay: '3s',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
          {/* Success checkmark with animation */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            E-Mail verifiziert!
          </h1>
          <p className="text-gray-600 mb-2">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Sie können sich jetzt mit Ihrem Account anmelden.
          </p>

          <Link
            href={`/${locale}`}
            className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <VerifyEmailContent searchParams={search} locale={locale} />
    </Suspense>
  );
}
