/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Owner Push Notification Prompt
 *
 * Client-side component for studio owner calendar:
 * - Contextual push notification prompt after first booking request
 * - Only shown to authenticated studio owners who haven't enabled push notifications
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GdprPushConsentDialog } from '@/components/notifications/GdprPushConsentDialog';
import { usePushRegistration } from '@/hooks/usePushRegistration';

interface StudioOwnerPushPromptProps {
  studioId: string;
}

/**
 * Client component that handles contextual push notification prompt
 * for studio owners after receiving their first booking request.
 *
 * Logic:
 * 1. Only shows for authenticated users
 * 2. Only shows if user hasn't enabled push notifications
 * 3. Only shows if this is the studio's first booking request
 * 4. Uses localStorage to prevent showing multiple times
 */
export function StudioOwnerPushPrompt({
  studioId,
}: StudioOwnerPushPromptProps): React.JSX.Element | null {
  const { data: session } = useSession();
  const { isRegistered, isSupported } = usePushRegistration();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [isFirstRequest, setIsFirstRequest] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = !!session?.user?.id;

  useEffect(() => {
    // Only proceed if user is authenticated, push is supported, and not already registered
    if (!isAuthenticated || !isSupported || isRegistered) {
      return;
    }

    // Check if we've already shown the prompt for first request
    const hasSeenFirstRequestPrompt = localStorage.getItem(
      `push-prompt-first-request-shown-${studioId}`
    );

    if (hasSeenFirstRequestPrompt) {
      return;
    }

    // Check if this is the first booking request
    const checkFirstRequest = async (): Promise<void> => {
      try {
        const response = await fetch('/api/studio/bookings/count');
        if (!response.ok) {
          console.error('Failed to fetch booking request count');
          return;
        }

        const data = await response.json();
        const bookingCount = data.count || 0;

        // If this is the first booking request, show the prompt
        if (bookingCount === 1) {
          setIsFirstRequest(true);
          // Delay showing the dialog slightly for better UX
          setTimeout(() => {
            setShowPushPrompt(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking first booking request:', error);
      }
    };

    checkFirstRequest();
  }, [isAuthenticated, isSupported, isRegistered, studioId]);

  const handleClose = (): void => {
    setShowPushPrompt(false);
    // Mark as shown so we don't show it again
    localStorage.setItem(`push-prompt-first-request-shown-${studioId}`, 'true');
  };

  const handleConsent = (selectedCategories: string[]): void => {
    console.log('Studio owner consented to push notifications:', selectedCategories);
    // Mark as shown
    localStorage.setItem(`push-prompt-first-request-shown-${studioId}`, 'true');
  };

  if (!isFirstRequest) {
    return null;
  }

  return (
    <GdprPushConsentDialog
      isOpen={showPushPrompt}
      onClose={handleClose}
      onConsent={handleConsent}
      trigger="FIRST_REQUEST"
      userRole="STUDIO_OWNER"
    />
  );
}
