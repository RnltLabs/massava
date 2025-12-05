/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Contextual Push Prompt Component
 *
 * Wrapper for GdprPushConsentDialog that manages showing push permission
 * prompts at contextually appropriate times (first booking, onboarding, etc.).
 *
 * Features:
 * - Checks if user already has push enabled
 * - Tracks dismissals per trigger type with 30-day cooldown
 * - Manages dialog open/close state
 * - Integrates with existing GdprPushConsentDialog
 *
 * @module components/notifications/ContextualPushPrompt
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GdprPushConsentDialog } from './GdprPushConsentDialog';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useNotificationContext } from '@/hooks/useNotificationContext';

/**
 * Trigger types for contextual push prompts
 */
export type PushPromptTrigger =
  | 'FIRST_BOOKING'
  | 'FIRST_REQUEST'
  | 'ONBOARDING'
  | 'SETTINGS';

/**
 * localStorage keys for tracking dismissals
 */
const DISMISSAL_KEY_PREFIX = 'push-prompt-dismissed';
const DISMISSAL_DURATION_DAYS = 30;

/**
 * Get localStorage key for specific trigger
 */
function getDismissalKey(trigger: PushPromptTrigger): string {
  return `${DISMISSAL_KEY_PREFIX}-${trigger.toLowerCase()}`;
}

/**
 * Check if a trigger was recently dismissed
 */
function wasRecentlyDismissed(trigger: PushPromptTrigger): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const dismissedAt = localStorage.getItem(getDismissalKey(trigger));
    if (!dismissedAt) return false;

    const dismissedDate = new Date(dismissedAt);
    const daysSinceDismissed =
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceDismissed < DISMISSAL_DURATION_DAYS;
  } catch (error) {
    console.error('[ContextualPushPrompt] Error checking dismissal:', error);
    return false;
  }
}

/**
 * Store dismissal timestamp for specific trigger
 */
function storeDismissal(trigger: PushPromptTrigger): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(getDismissalKey(trigger), new Date().toISOString());
  } catch (error) {
    console.error('[ContextualPushPrompt] Error storing dismissal:', error);
  }
}

/**
 * Hook return type
 */
export interface UseContextualPushPromptReturn {
  /** Whether the prompt should be shown */
  showPrompt: boolean;
  /** Trigger the prompt for a specific context */
  triggerPrompt: (trigger: PushPromptTrigger) => void;
  /** Dismiss the prompt (stores dismissal for 30 days) */
  dismissPrompt: () => void;
  /** Current trigger type (if prompt is showing) */
  currentTrigger: PushPromptTrigger | null;
  /** Whether push is already enabled */
  isPushEnabled: boolean;
  /** Whether the system is checking status */
  isChecking: boolean;
}

/**
 * Hook for managing contextual push prompts
 *
 * Provides a simple API to trigger push permission dialogs at contextually
 * appropriate times (e.g., after first booking, during onboarding).
 *
 * Features:
 * - Automatically checks if push is already enabled
 * - Respects user dismissals (30-day cooldown per trigger)
 * - Prevents showing prompt if permission was denied
 * - Handles unsupported browsers gracefully
 *
 * @returns {UseContextualPushPromptReturn} Hook state and control functions
 *
 * @example
 * ```typescript
 * function BookingConfirmation() {
 *   const { triggerPrompt } = useContextualPushPrompt();
 *
 *   useEffect(() => {
 *     // Trigger after successful booking
 *     triggerPrompt('FIRST_BOOKING');
 *   }, []);
 *
 *   return <div>Booking confirmed!</div>;
 * }
 * ```
 */
export function useContextualPushPrompt(): UseContextualPushPromptReturn {
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<PushPromptTrigger | null>(null);

  const {
    isSupported,
    isRegistered,
    permissionStatus,
  } = usePushRegistration();

  const isPushEnabled = isRegistered && permissionStatus === 'granted';
  const isChecking = isSupported && permissionStatus === 'default';

  /**
   * Trigger the prompt for a specific context
   *
   * Checks:
   * 1. Browser support
   * 2. Current registration status
   * 3. Permission not denied
   * 4. Not recently dismissed for this trigger
   */
  const triggerPrompt = useCallback(
    (trigger: PushPromptTrigger) => {
      // Don't show if not supported
      if (!isSupported) {
        console.log('[ContextualPushPrompt] Push not supported, skipping prompt');
        return;
      }

      // Don't show if already registered
      if (isPushEnabled) {
        console.log('[ContextualPushPrompt] Push already enabled, skipping prompt');
        return;
      }

      // Don't show if permission was explicitly denied
      if (permissionStatus === 'denied') {
        console.log('[ContextualPushPrompt] Permission denied, skipping prompt');
        return;
      }

      // Don't show if recently dismissed for this trigger
      if (wasRecentlyDismissed(trigger)) {
        console.log(
          `[ContextualPushPrompt] Trigger "${trigger}" was recently dismissed, skipping prompt`
        );
        return;
      }

      // All checks passed - show the prompt
      console.log(`[ContextualPushPrompt] Showing prompt for trigger: ${trigger}`);
      setCurrentTrigger(trigger);
      setShowPrompt(true);
    },
    [isSupported, isPushEnabled, permissionStatus]
  );

  /**
   * Dismiss the prompt and store dismissal timestamp
   */
  const dismissPrompt = useCallback(() => {
    if (currentTrigger) {
      storeDismissal(currentTrigger);
      console.log(`[ContextualPushPrompt] Dismissed trigger: ${currentTrigger}`);
    }
    setShowPrompt(false);
    setCurrentTrigger(null);
  }, [currentTrigger]);

  return {
    showPrompt,
    triggerPrompt,
    dismissPrompt,
    currentTrigger,
    isPushEnabled,
    isChecking,
  };
}

/**
 * Props for ContextualPushPrompt component
 */
export interface ContextualPushPromptProps {
  /** Children to render (optional) */
  children?: React.ReactNode;
}

/**
 * Contextual Push Prompt Component
 *
 * Provides the prompt UI via the hook. Can be used as a wrapper component
 * or just use the hook directly in your components.
 *
 * This component doesn't render anything itself - it just provides the hook
 * context. The actual dialog is rendered when you call `triggerPrompt()`.
 *
 * @example
 * ```typescript
 * // Option 1: Use the hook directly
 * function MyComponent() {
 *   const { triggerPrompt } = useContextualPushPrompt();
 *
 *   return (
 *     <button onClick={() => triggerPrompt('FIRST_BOOKING')}>
 *       Show Push Prompt
 *     </button>
 *   );
 * }
 *
 * // Option 2: Use as wrapper (not really needed, hook is sufficient)
 * function App() {
 *   return (
 *     <ContextualPushPrompt>
 *       <MyComponent />
 *     </ContextualPushPrompt>
 *   );
 * }
 * ```
 */
export function ContextualPushPrompt({
  children,
}: ContextualPushPromptProps): React.JSX.Element {
  // Use internal state for this component instance
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<PushPromptTrigger | null>(null);

  const { context } = useNotificationContext();
  const {
    isSupported,
    isRegistered,
    permissionStatus,
  } = usePushRegistration();

  const isPushEnabled = isRegistered && permissionStatus === 'granted';

  // Derive userRole from context
  const userRole = context === 'STUDIO_OWNER' ? 'STUDIO_OWNER' : 'CUSTOMER';

  /**
   * Trigger the prompt (can be called from children via this component's context)
   * This is a component-level trigger, different from the hook
   */
  const triggerPrompt = useCallback(
    (trigger: PushPromptTrigger) => {
      if (!isSupported || isPushEnabled || permissionStatus === 'denied') {
        return;
      }

      if (wasRecentlyDismissed(trigger)) {
        return;
      }

      setCurrentTrigger(trigger);
      setShowPrompt(true);
    },
    [isSupported, isPushEnabled, permissionStatus]
  );

  /**
   * Handle successful consent
   */
  const handleConsent = useCallback(
    (selectedCategories: string[]) => {
      console.log('[ContextualPushPrompt] Consent granted:', {
        trigger: currentTrigger,
        categories: selectedCategories,
      });
      // Close without storing dismissal (user consented, not dismissed)
      setShowPrompt(false);
      setCurrentTrigger(null);
    },
    [currentTrigger]
  );

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    // Store dismissal when closing without consent
    if (currentTrigger) {
      storeDismissal(currentTrigger);
    }
    setShowPrompt(false);
    setCurrentTrigger(null);
  }, [currentTrigger]);

  return (
    <>
      {children}
      {showPrompt && currentTrigger && (
        <GdprPushConsentDialog
          isOpen={showPrompt}
          onClose={handleClose}
          onConsent={handleConsent}
          trigger={currentTrigger}
          userRole={userRole}
        />
      )}
    </>
  );
}

/**
 * Utility function to clear all dismissals (for testing/debugging)
 */
export function clearAllDismissals(): void {
  if (typeof window === 'undefined') return;

  const triggers: PushPromptTrigger[] = [
    'FIRST_BOOKING',
    'FIRST_REQUEST',
    'ONBOARDING',
    'SETTINGS',
  ];

  triggers.forEach((trigger) => {
    try {
      localStorage.removeItem(getDismissalKey(trigger));
    } catch (error) {
      console.error('[ContextualPushPrompt] Error clearing dismissal:', error);
    }
  });

  console.log('[ContextualPushPrompt] Cleared all dismissals');
}

export default ContextualPushPrompt;
