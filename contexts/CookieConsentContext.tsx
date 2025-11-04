/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Consent Context Provider
 * ePrivacy Directive & GDPR Compliant Cookie Management
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CookieConsent {
  necessary: true; // Always true (required)
  analytics: boolean;
  marketing: boolean;
  timestamp: string; // ISO date
}

interface CookieConsentContextType {
  consent: CookieConsent | null;
  hasConsent: boolean;
  updateConsent: (consent: Omit<CookieConsent, 'timestamp'>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  clearConsent: () => void;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (storedConsent) {
        const parsed = JSON.parse(storedConsent) as CookieConsent;
        setConsent(parsed);
        setHasConsent(true);
        applyConsent(parsed);
      } else {
        setHasConsent(false);
      }
    } catch (error) {
      console.error('Failed to load cookie consent:', error);
      setHasConsent(false);
    }
  }, []);

  // Apply consent to third-party services
  const applyConsent = useCallback((consent: CookieConsent): void => {
    // Google Analytics Consent Mode V2
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied',
      });
    }

    // Trigger custom event for other services
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cookieConsentUpdate', {
          detail: consent,
        })
      );
    }
  }, []);

  // Save consent to localStorage and apply
  const saveConsent = useCallback(
    (newConsent: Omit<CookieConsent, 'timestamp'>): void => {
      const consentWithTimestamp: CookieConsent = {
        ...newConsent,
        necessary: true, // Always true
        timestamp: new Date().toISOString(),
      };

      try {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
        setConsent(consentWithTimestamp);
        setHasConsent(true);
        applyConsent(consentWithTimestamp);

        // Send to API for logging/audit trail
        fetch('/api/cookie-consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(consentWithTimestamp),
        }).catch((error) => {
          console.error('Failed to save consent to server:', error);
        });
      } catch (error) {
        console.error('Failed to save cookie consent:', error);
      }
    },
    [applyConsent]
  );

  const updateConsent = useCallback(
    (newConsent: Omit<CookieConsent, 'timestamp'>): void => {
      saveConsent(newConsent);
    },
    [saveConsent]
  );

  const acceptAll = useCallback((): void => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  }, [saveConsent]);

  const rejectAll = useCallback((): void => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  }, [saveConsent]);

  const clearConsent = useCallback((): void => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setConsent(null);
      setHasConsent(false);
    } catch (error) {
      console.error('Failed to clear cookie consent:', error);
    }
  }, []);

  const value: CookieConsentContextType = {
    consent,
    hasConsent,
    updateConsent,
    acceptAll,
    rejectAll,
    clearConsent,
  };

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent(): CookieConsentContextType {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: Record<string, string>
    ) => void;
  }
}
