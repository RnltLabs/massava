/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Push Notification Prompt Component
 *
 * Automatically prompts business users to enable push notifications
 * if they haven't done so yet. Shows as a dismissable banner.
 *
 * @module components/notifications/PushNotificationPrompt
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useSession } from 'next-auth/react';

const DISMISSED_KEY = 'push-notification-prompt-dismissed';
const DISMISS_DURATION_DAYS = 7;

/**
 * Banner component that prompts users to enable push notifications
 *
 * Only shows for:
 * - Authenticated users
 * - Users who haven't enabled push notifications
 * - Users who haven't dismissed the banner recently
 * - Browsers that support push notifications
 */
export function PushNotificationPrompt(): React.JSX.Element | null {
  const { data: session } = useSession();
  const {
    isSupported,
    isRegistered,
    isRegistering,
    permissionStatus,
    register,
  } = usePushRegistration();

  const [isDismissed, setIsDismissed] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Check if banner was dismissed recently
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < DISMISS_DURATION_DAYS) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  // Determine visibility
  useEffect(() => {
    const shouldShow =
      session?.user &&
      isSupported &&
      !isRegistered &&
      !isDismissed &&
      permissionStatus !== 'denied';

    // Delay showing to avoid flash during page load
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [session, isSupported, isRegistered, isDismissed, permissionStatus]);

  const handleDismiss = (): void => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleEnable = async (): Promise<void> => {
    const success = await register();
    if (success) {
      // Also enable push in notification preferences
      try {
        await fetch('/api/notifications/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pushEnabled: true }),
        });
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
      }
      setIsVisible(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl bg-[#B56550] p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">
              Push-Benachrichtigungen aktivieren
            </h3>
            <p className="mt-1 text-sm text-white/90">
              Erhalte sofort eine Nachricht, wenn neue Buchungsanfragen eingehen.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleEnable}
                disabled={isRegistering}
                size="sm"
                className="bg-white text-[#B56550] hover:bg-white/90"
              >
                {isRegistering ? 'Wird aktiviert...' : 'Aktivieren'}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                Später
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PushNotificationPrompt;
