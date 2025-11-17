/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Google Analytics Client Component
 * Handles GA initialization with consent mode
 */

'use client';

import { useEffect, useState } from 'react';
import { getConsent } from '@/lib/cookie-consent';
import {
  initGoogleAnalytics,
  loadGoogleAnalyticsScript,
  updateGoogleAnalyticsConsent,
  GA_MEASUREMENT_ID,
} from '@/lib/analytics/consent-aware-ga';

export function GoogleAnalytics(): null {
  const [consent, setConsent] = useState<ReturnType<typeof getConsent>>(null);

  // Check consent on mount and set up listener for changes
  useEffect(() => {
    // Initial consent check
    const checkConsent = () => {
      const currentConsent = getConsent();
      setConsent(currentConsent);
    };

    checkConsent();

    // Listen for storage events (consent changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'massava_cookie_consent') {
        checkConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event from banner
    const handleConsentChange = () => checkConsent();
    window.addEventListener('cookie-consent-changed', handleConsentChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cookie-consent-changed', handleConsentChange);
    };
  }, []);

  // Initialize GA on mount (with denied consent by default)
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    initGoogleAnalytics(GA_MEASUREMENT_ID);
  }, []);

  // Update consent when user preferences change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !consent) return;

    updateGoogleAnalyticsConsent(consent.analytics, consent.marketing);

    // Load GA script if analytics consent is granted
    if (consent.analytics) {
      loadGoogleAnalyticsScript(GA_MEASUREMENT_ID);
    }
  }, [consent]);

  return null;
}
