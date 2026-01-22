/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Push Notification Prompt Component
 *
 * Automatically prompts business users to enable push notifications
 * if they haven't done so yet. Shows as a dismissable banner.
 *
 * WCAG 2.1 AA Compliant:
 * - role="alertdialog" for screen reader announcement
 * - aria-labelledby and aria-describedby for context
 * - Proper focus management
 * - Keyboard accessible (Tab, Enter, Escape)
 *
 * @module components/notifications/PushNotificationPrompt
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { announceToScreenReader, focusRingOnColor } from '@/lib/utils/accessibility';
import { cn } from '@/lib/utils';

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

  // Ref for focus management
  const promptRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Unique IDs for ARIA relationships
  const titleId = 'push-prompt-title';
  const descriptionId = 'push-prompt-description';

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

  // Announce to screen readers when prompt becomes visible
  useEffect(() => {
    if (isVisible) {
      // Store current focus to restore later
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Announce the prompt to screen readers
      announceToScreenReader(
        'Push-Benachrichtigungen aktivieren: Erhalte sofort eine Nachricht, wenn neue Buchungsanfragen eingehen.',
        'polite'
      );
    }
  }, [isVisible]);

  // Internal dismiss handler (defined first to avoid circular dependency)
  const handleDismissInternal = useCallback((): void => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setIsDismissed(true);
    setIsVisible(false);

    // Restore focus to previous element
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }

    // Announce dismissal
    announceToScreenReader('Benachrichtigung geschlossen', 'polite');
  }, []);

  // Handle keyboard events (Escape to dismiss)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDismissInternal();
      }
    },
    [handleDismissInternal]
  );

  const handleDismiss = (): void => {
    handleDismissInternal();
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
        logger.error('[PushNotificationPrompt] Failed to update notification preferences', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      setIsVisible(false);

      // Announce success and restore focus
      announceToScreenReader('Push-Benachrichtigungen wurden aktiviert', 'polite');
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={promptRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="false"
      onKeyDown={handleKeyDown}
      className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="rounded-xl bg-[#B56550] p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20"
            aria-hidden="true"
          >
            <Bell className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id={titleId}
              className="font-semibold text-white"
            >
              Push-Benachrichtigungen aktivieren
            </h3>
            <p
              id={descriptionId}
              className="mt-1 text-sm text-white/90"
            >
              Erhalte sofort eine Nachricht, wenn neue Buchungsanfragen eingehen.
            </p>
            <div className="mt-3 flex gap-2" role="group" aria-label="Aktionen">
              <Button
                onClick={handleEnable}
                disabled={isRegistering}
                size="sm"
                className={cn(
                  'bg-white text-[#B56550] hover:bg-white/90',
                  focusRingOnColor
                )}
                aria-describedby={descriptionId}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Wird aktiviert...</span>
                  </>
                ) : (
                  'Aktivieren'
                )}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className={cn(
                  'text-white hover:bg-white/20',
                  focusRingOnColor
                )}
              >
                Später
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={cn(
              'shrink-0 rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors',
              focusRingOnColor
            )}
            aria-label="Benachrichtigung schließen"
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PushNotificationPrompt;
