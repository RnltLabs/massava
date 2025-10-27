/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Authentication Error Page
 * NextAuth custom error page for handling authentication failures
 */

import { Suspense } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

// Map NextAuth error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Konfigurationsfehler',
    description: 'Es gibt ein Problem mit der Server-Konfiguration. Bitte kontaktieren Sie den Support.',
  },
  AccessDenied: {
    title: 'Zugriff verweigert',
    description: 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.',
  },
  Verification: {
    title: 'Verifizierung fehlgeschlagen',
    description: 'Der Verifizierungslink ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.',
  },
  OAuthSignin: {
    title: 'OAuth-Anmeldung fehlgeschlagen',
    description: 'Fehler beim Starten der OAuth-Anmeldung. Bitte versuchen Sie es erneut.',
  },
  OAuthCallback: {
    title: 'OAuth-Callback fehlgeschlagen',
    description: 'Fehler beim Verarbeiten der OAuth-Antwort. Bitte versuchen Sie es erneut.',
  },
  OAuthCreateAccount: {
    title: 'Konto konnte nicht erstellt werden',
    description: 'Fehler beim Erstellen Ihres Kontos mit OAuth. Bitte versuchen Sie es erneut.',
  },
  EmailCreateAccount: {
    title: 'Konto konnte nicht erstellt werden',
    description: 'Fehler beim Erstellen Ihres Kontos. Möglicherweise existiert die E-Mail-Adresse bereits.',
  },
  Callback: {
    title: 'Callback-Fehler',
    description: 'Fehler bei der Authentifizierung. Bitte versuchen Sie es erneut.',
  },
  OAuthAccountNotLinked: {
    title: 'E-Mail bereits registriert',
    description: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich mit Ihrer ursprünglichen Anmeldemethode an.',
  },
  EmailSignin: {
    title: 'E-Mail-Anmeldung fehlgeschlagen',
    description: 'Der Magic-Link konnte nicht gesendet werden. Bitte überprüfen Sie Ihre E-Mail-Adresse.',
  },
  CredentialsSignin: {
    title: 'Anmeldung fehlgeschlagen',
    description: 'E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.',
  },
  SessionRequired: {
    title: 'Anmeldung erforderlich',
    description: 'Sie müssen angemeldet sein, um auf diese Seite zuzugreifen.',
  },
  Default: {
    title: 'Authentifizierungsfehler',
    description: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  },
};

function AuthErrorContent({ searchParams }: ErrorPageProps) {
  const errorType = searchParams.error || 'Default';
  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </h1>

          {/* Error Description */}
          <p className="mt-2 text-gray-600">
            {errorInfo.description}
          </p>

          {/* Error Code (for debugging) */}
          {errorType !== 'Default' && (
            <p className="mt-4 text-xs text-gray-400 font-mono">
              Error Code: {errorType}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/auth/signin"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Zurück zur Anmeldung
            </Link>
            <Link
              href="/"
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Zur Startseite
            </Link>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-sm text-gray-500">
            Weiterhin Probleme?{' '}
            <Link href="/support" className="text-blue-600 hover:underline">
              Kontaktieren Sie den Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AuthErrorContent searchParams={searchParams} />
    </Suspense>
  );
}
