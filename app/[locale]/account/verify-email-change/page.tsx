/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Change Verification Page
 * Route: /[locale]/account/verify-email-change
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2Icon, CheckCircle2Icon, XCircleIcon, MailIcon } from 'lucide-react';

export default function VerifyEmailChangePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/user/verify-email-change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email address changed successfully!');

          // Start countdown for redirect
          let counter = 3;
          const interval = setInterval(() => {
            counter -= 1;
            setCountdown(counter);

            if (counter === 0) {
              clearInterval(interval);
              router.push(data.redirectUrl || '/de/auth/login');
            }
          }, 1000);

          return () => clearInterval(interval);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email change');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email change');
        console.error('Verification error:', error);
      }
    };

    verifyToken();
  }, [token, router]);

  const handleReturnToLogin = () => {
    router.push('/de/auth/login');
  };

  const handleReturnToSettings = () => {
    router.push('/de/business/settings/account');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <Card className="w-full max-w-md rounded-[1.5rem] border border-border bg-background shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2Icon className="h-12 w-12 text-primary animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2Icon className="h-12 w-12 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-full bg-red-100 p-4">
                <XCircleIcon className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'E-Mail wird verifiziert...'}
            {status === 'success' && 'E-Mail erfolgreich geändert!'}
            {status === 'error' && 'Verifizierung fehlgeschlagen'}
          </CardTitle>

          <CardDescription className="text-base mt-2">
            {status === 'loading' && 'Bitte warten Sie, während wir Ihre E-Mail-Änderung verifizieren.'}
            {status === 'success' && message}
            {status === 'error' && message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  <MailIcon className="inline h-4 w-4 mr-2" />
                  Ihre E-Mail-Adresse wurde erfolgreich aktualisiert. Aus Sicherheitsgründen wurden alle aktiven Sitzungen beendet.
                </p>
              </div>

              <p className="text-sm font-medium text-primary">
                Weiterleitung zum Login in {countdown} Sekunden...
              </p>

              <Button
                onClick={handleReturnToLogin}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
              >
                Jetzt anmelden
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">
                  <strong>Mögliche Gründe:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Der Link ist abgelaufen (gültig für 24 Stunden)</li>
                  <li>Der Link wurde bereits verwendet</li>
                  <li>Der Link ist ungültig oder beschädigt</li>
                  <li>Die E-Mail-Adresse wird bereits verwendet</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReturnToSettings}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  Zu Einstellungen
                </Button>
                <Button
                  onClick={handleReturnToLogin}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full"
                >
                  Zum Login
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Dies kann einige Sekunden dauern...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
