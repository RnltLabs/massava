/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unauthorized Access Page
 * Task 2.1: Middleware Protection (MASTER_ORCHESTRATION_PLAN.md)
 *
 * Displayed when user attempts to access business portal without proper role
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { ShieldAlert, Home, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BLOB_ANIMATION_DELAY_FAST } from '@/lib/constants/animations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function UnauthorizedContent({
  searchParams,
  locale,
}: {
  searchParams: { requested?: string };
  locale: string;
}) {
  const session = await auth();
  const requestedPath = searchParams.requested;

  // User is signed in but doesn't have access
  const isAuthenticated = !!session?.user;

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
      <div className="relative z-10 max-w-2xl w-full mx-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6">
            <ShieldAlert className="h-12 w-12 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Zugriff nicht erlaubt
          </h1>

          {/* Description */}
          <div className="text-center mb-8">
            {isAuthenticated ? (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Sie haben keine Berechtigung für den Business-Bereich.
                </p>
                <p className="text-gray-600">
                  Der Zugriff auf das Business-Portal ist Studio-Besitzern und Mitarbeitern vorbehalten.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Sie müssen angemeldet sein, um auf diesen Bereich zuzugreifen.
                </p>
                <p className="text-gray-600">
                  Bitte melden Sie sich mit einem Business-Konto an.
                </p>
              </>
            )}
          </div>

          {/* Requested path info (if available) */}
          {requestedPath && (
            <Alert className="mb-6">
              <AlertTitle>Angeforderter Bereich</AlertTitle>
              <AlertDescription className="font-mono text-sm">
                {requestedPath}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {!isAuthenticated && (
              <Link href={`/${locale}/auth/signin?callbackUrl=${requestedPath || '/business'}`} className="block">
                <Button className="w-full" size="lg">
                  <LogIn className="mr-2 h-5 w-5" />
                  Mit Business-Konto anmelden
                </Button>
              </Link>
            )}

            <Link href={`/${locale}`} className="block">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Zur Startseite
              </Button>
            </Link>
          </div>

          {/* Help section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Benötigen Sie Hilfe?
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <ShieldAlert className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Sie sind Studio-Besitzer?
                  </p>
                  <p>
                    Registrieren Sie Ihr Studio in Ihrem Kunden-Dashboard.
                    Nach erfolgreicher Registrierung erhalten Sie automatisch Zugriff auf das Business-Portal.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <LogIn className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Falsches Konto?
                  </p>
                  <p>
                    Wenn Sie mehrere Konten haben, melden Sie sich ab und versuchen Sie es mit einem anderen Konto.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Technische Probleme?
                  </p>
                  <p>
                    Kontaktieren Sie unseren Support unter{' '}
                    <a
                      href="mailto:support@massava.app"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      support@massava.app
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Debug info (development only) */}
          {process.env.NODE_ENV === 'development' && session && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs font-mono text-gray-600 mb-1">
                <strong>Debug Info (dev only):</strong>
              </p>
              <p className="text-xs font-mono text-gray-600">
                User ID: {session.user.id}
              </p>
              <p className="text-xs font-mono text-gray-600">
                Primary Role: {session.user.primaryRole || 'undefined'}
              </p>
              <p className="text-xs font-mono text-gray-600">
                Roles: {JSON.stringify(session.user.roles || [])}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function UnauthorizedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ requested?: string }>;
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
      <UnauthorizedContent searchParams={search} locale={locale} />
    </Suspense>
  );
}

// Metadata for SEO
export const metadata = {
  title: 'Unauthorized Access | Massava',
  description: 'You do not have permission to access this area.',
  robots: 'noindex, nofollow',
};
