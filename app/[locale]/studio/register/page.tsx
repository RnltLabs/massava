/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RedirectPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Redirect page from old studio registration URL
 * Automatically redirects to new business onboarding page
 */
export default function StudioRegisterRedirect({ params }: RedirectPageProps): React.JSX.Element {
  const { locale } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push(`/${locale}/business/onboarding`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [locale, router]);

  const handleImmediateRedirect = (): void => {
    router.push(`/${locale}/business/onboarding`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Page Moved</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Studio registration has moved to the Business Portal.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <span>Redirecting to</span>
            <code className="px-2 py-1 bg-neutral-100 rounded text-xs">
              /business/onboarding
            </code>
            <ArrowRight className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">
            You will be redirected automatically in 3 seconds...
          </p>
          <button
            onClick={handleImmediateRedirect}
            className="text-sm text-primary hover:underline"
          >
            Click here to redirect now
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
