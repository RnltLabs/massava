/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Verification Page
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { verifyEmailVerificationToken } from '@/lib/email-verification';
import { prisma } from '@/lib/prisma';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {t('invalidLink.title', { default: 'Ungültiger Link' })}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('invalidLink.message', {
                default: 'Der Verifizierungslink ist ungültig. Bitte überprüfen Sie Ihre E-Mail erneut.',
              })}
            </p>
            <Link
              href={`/${locale}`}
              className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('backToHome', { default: 'Zur Startseite' })}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {t('expired.title', { default: 'Link abgelaufen' })}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('expired.message', {
                default: 'Dieser Verifizierungslink ist abgelaufen oder wurde bereits verwendet.',
              })}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t('expired.hint', {
                default: 'Bitte fordern Sie einen neuen Verifizierungslink an.',
              })}
            </p>
            <Link
              href={`/${locale}`}
              className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('backToHome', { default: 'Zur Startseite' })}
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

  // Success - redirect to appropriate dashboard based on role
  const dashboardPath =
    user?.primaryRole === 'STUDIO_OWNER' ? `/${locale}/dashboard` : `/${locale}/customer/dashboard`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {t('success.title', { default: 'E-Mail verifiziert!' })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('success.message', {
              default: 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt.',
            })}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            {t('success.redirecting', {
              default: 'Sie werden in wenigen Sekunden weitergeleitet...',
            })}
          </p>
          <Link
            href={dashboardPath}
            className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('success.goToDashboard', { default: 'Zum Dashboard' })}
          </Link>
        </div>
      </div>
      <meta httpEquiv="refresh" content={`3;url=${dashboardPath}`} />
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <VerifyEmailContent searchParams={search} locale={locale} />
    </Suspense>
  );
}
