/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { StudioRegistrationForm } from './StudioRegistrationForm';

export default function ProtectedStudioRegister() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // If not authenticated and not loading, show auth modal immediately
    if (status === 'unauthenticated') {
      setShowAuthModal(true);
    }
  }, [status]);

  // Not authenticated - show auth modal immediately without loading screen
  if (status === 'unauthenticated' || (!session && status !== 'loading')) {
    return (
      <>
        {/* Show form skeleton/placeholder while auth modal is open */}
        <div className="opacity-50 pointer-events-none">
          <StudioRegistrationForm />
        </div>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            locale={locale}
            context="register"
          />
        )}
      </>
    );
  }

  // Loading state - show form skeleton
  if (status === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-muted rounded-2xl"></div>
        <div className="h-12 bg-muted rounded-2xl"></div>
        <div className="h-12 bg-muted rounded-2xl"></div>
        <div className="h-24 bg-muted rounded-2xl"></div>
      </div>
    );
  }

  // Authenticated - show registration form
  return <StudioRegistrationForm />;
}
