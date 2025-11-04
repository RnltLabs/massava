/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Google Analytics Client Component
 * Handles GA initialization with consent mode
 */

'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import {
  initGoogleAnalytics,
  loadGoogleAnalyticsScript,
  updateGoogleAnalyticsConsent,
  GA_MEASUREMENT_ID,
} from '@/lib/analytics/consent-aware-ga';

export function GoogleAnalytics(): null {
  const { consent } = useCookieConsent();

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
