/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Verification Client Component - Auto-Login after verification
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function VerifyEmailSuccess({
  email,
  locale,
}: {
  email: string;
  locale: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-login after email verification
    const autoLogin = async () => {
      try {
        // We can't login without password in NextAuth credentials provider
        // So we'll just redirect to login with a success message
        setTimeout(() => {
          router.push(`/${locale}?openAuth=login&verified=true`);
        }, 2000);
      } catch (err) {
        console.error('Auto-login failed:', err);
        setError('Failed to log you in automatically. Please log in manually.');
      }
    };

    autoLogin();
  }, [email, locale, router]);

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Decorative background blobs */}
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
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been verified. Please log in to continue.
            </p>

            <Link
              href={`/${locale}?openAuth=login`}
              className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Email Verified!
          </h1>
          <p className="text-gray-600 mb-2">
            Your email address has been successfully verified.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you to login...
          </p>

          {/* Auto-redirect indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
            <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <Link
            href={`/${locale}?openAuth=login&verified=true`}
            className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Continue to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
