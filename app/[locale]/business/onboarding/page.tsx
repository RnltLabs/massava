/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration/StudioRegistrationDialog';

interface OnboardingPageProps {
  params: {
    locale: string;
  };
}

/**
 * Business Onboarding Page
 *
 * Redirects studio owners through the registration wizard
 * Uses the existing StudioRegistrationDialog component
 */
export default function OnboardingPage({ params }: OnboardingPageProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Auto-open the registration dialog on mount
    setIsOpen(true);
  }, []);

  const handleClose = (): void => {
    // Redirect to business dashboard when closed
    router.push(`/${params.locale}/business`);
  };

  const handleSuccess = (studioId: string): void => {
    // Redirect to business dashboard after successful registration
    console.log('Studio registered successfully:', studioId);
    router.push(`/${params.locale}/business?registered=true`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Welcome to Massava Business
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's get your studio set up. This will only take a few minutes.
        </p>
        <p className="text-sm text-muted-foreground">
          Complete the registration wizard to create your studio profile and start accepting bookings.
        </p>
      </div>

      <StudioRegistrationDialog
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
