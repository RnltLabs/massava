/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Verification Page
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { Suspense } from 'react';
import { verifyEmailVerificationToken, markEmailAsVerified } from '@/lib/email-verification';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

async function VerifyEmailContent({ searchParams }: { searchParams: { token?: string } }) {
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
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Ungültiger Link</h1>
            <p className="mt-2 text-gray-600">
              Der Verifizierungslink ist ungültig. Bitte überprüfen Sie Ihre E-Mail erneut.
            </p>
            <a
              href="/"
              className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Zur Startseite
            </a>
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
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Link abgelaufen</h1>
            <p className="mt-2 text-gray-600">
              Dieser Verifizierungslink ist abgelaufen oder wurde bereits verwendet.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Bitte fordern Sie einen neuen Verifizierungslink an.
            </p>
            <a
              href="/"
              className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Zur Startseite
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Determine user type and mark as verified
  const customer = await prisma.customer.findUnique({ where: { email } });
  const studioOwner = await prisma.studioOwner.findUnique({ where: { email } });

  if (customer) {
    await markEmailAsVerified(email, 'customer');
  } else if (studioOwner) {
    await markEmailAsVerified(email, 'studio-owner');
  }

  // Success - redirect to appropriate dashboard
  const redirectUrl = studioOwner ? '/studio-owner/dashboard' : '/customer/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">E-Mail verifiziert!</h1>
          <p className="mt-2 text-gray-600">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Sie werden in wenigen Sekunden weitergeleitet...
          </p>
        </div>
      </div>
      <meta httpEquiv="refresh" content={`3;url=${redirectUrl}`} />
    </div>
  );
}

export default function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}
