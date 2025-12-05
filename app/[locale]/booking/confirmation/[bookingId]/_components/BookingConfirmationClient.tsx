/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Confirmation Client Component
 *
 * Client-side logic for booking confirmation page:
 * - Contextual push notification prompt after first booking
 * - Only shown to authenticated users who haven't enabled push notifications
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GdprPushConsentDialog } from '@/components/notifications/GdprPushConsentDialog';
import { usePushRegistration } from '@/hooks/usePushRegistration';

interface BookingConfirmationClientProps {
  bookingId: string;
  customerEmail: string;
}

/**
 * Client component that handles contextual push notification prompt
 * after successful booking confirmation.
 *
 * Logic:
 * 1. Only shows for authenticated users
 * 2. Only shows if user hasn't enabled push notifications
 * 3. Only shows if this is the user's first booking
 * 4. Uses localStorage to prevent showing multiple times
 */
export function BookingConfirmationClient({
  bookingId,
  customerEmail,
}: BookingConfirmationClientProps): React.JSX.Element | null {
  const { data: session } = useSession();
  const { isRegistered, isSupported } = usePushRegistration();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [isFirstBooking, setIsFirstBooking] = useState(false);

  // Check if user is authenticated and matches the booking customer
  const isAuthenticatedCustomer =
    session?.user?.email && session.user.email === customerEmail;

  useEffect(() => {
    // Only proceed if user is authenticated, push is supported, and not already registered
    if (!isAuthenticatedCustomer || !isSupported || isRegistered) {
      return;
    }

    // Check if we've already shown the prompt for first booking
    const hasSeenFirstBookingPrompt = localStorage.getItem(
      'push-prompt-first-booking-shown'
    );

    if (hasSeenFirstBookingPrompt) {
      return;
    }

    // Check if this is the first booking
    const checkFirstBooking = async (): Promise<void> => {
      try {
        const response = await fetch('/api/bookings/customer/count');
        if (!response.ok) {
          console.error('Failed to fetch booking count');
          return;
        }

        const data = await response.json();
        const bookingCount = data.count || 0;

        // If this is the first booking, show the prompt
        if (bookingCount === 1) {
          setIsFirstBooking(true);
          // Delay showing the dialog slightly for better UX
          setTimeout(() => {
            setShowPushPrompt(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking first booking:', error);
      }
    };

    checkFirstBooking();
  }, [isAuthenticatedCustomer, isSupported, isRegistered]);

  const handleClose = (): void => {
    setShowPushPrompt(false);
    // Mark as shown so we don't show it again
    localStorage.setItem('push-prompt-first-booking-shown', 'true');
  };

  const handleConsent = (selectedCategories: string[]): void => {
    console.log('User consented to push notifications:', selectedCategories);
    // Mark as shown
    localStorage.setItem('push-prompt-first-booking-shown', 'true');
  };

  if (!isFirstBooking) {
    return null;
  }

  return (
    <GdprPushConsentDialog
      isOpen={showPushPrompt}
      onClose={handleClose}
      onConsent={handleConsent}
      trigger="FIRST_BOOKING"
      userRole="CUSTOMER"
    />
  );
}
