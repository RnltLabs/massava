"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Consent-Aware Google Analytics Integration
 * Implements Google Analytics 4 with Consent Mode V2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GA_MEASUREMENT_ID = void 0;
exports.initGoogleAnalytics = initGoogleAnalytics;
exports.loadGoogleAnalyticsScript = loadGoogleAnalyticsScript;
exports.updateGoogleAnalyticsConsent = updateGoogleAnalyticsConsent;
exports.trackPageView = trackPageView;
exports.trackEvent = trackEvent;
exports.isGoogleAnalyticsLoaded = isGoogleAnalyticsLoaded;
exports.getConsentState = getConsentState;
exports.useGoogleAnalytics = useGoogleAnalytics;
/**
 * Initialize Google Analytics with Consent Mode V2
 * This should be called in the root layout before any GA tags load
 *
 * @param measurementId - Google Analytics Measurement ID (e.g., 'G-XXXXXXXXXX')
 */
function initGoogleAnalytics(measurementId) {
    if (typeof window === 'undefined')
        return;
    // Initialize gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args) {
        window.dataLayer.push(args);
    };
    // Set default consent state (denied by default)
    window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted', // Necessary cookies
        personalization_storage: 'denied',
        security_storage: 'granted', // Necessary cookies
        wait_for_update: 500, // Wait 500ms for consent banner interaction
    });
    // Initialize GA
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
        anonymize_ip: true, // Anonymize IP addresses for privacy
        cookie_flags: 'SameSite=None;Secure', // Enhanced cookie security
    });
}
/**
 * Load Google Analytics script tag
 * Only loads the script after user consent
 *
 * @param measurementId - Google Analytics Measurement ID
 */
function loadGoogleAnalyticsScript(measurementId) {
    if (typeof window === 'undefined')
        return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
        return; // Script already loaded
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
}
/**
 * Update consent based on user preferences
 * Called when user changes cookie settings
 *
 * @param analytics - Analytics consent (true/false)
 * @param marketing - Marketing consent (true/false)
 */
function updateGoogleAnalyticsConsent(analytics, marketing) {
    if (typeof window === 'undefined' || !window.gtag)
        return;
    window.gtag('consent', 'update', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied',
    });
}
/**
 * Track page view (respects consent mode)
 *
 * @param url - Page URL
 * @param title - Page title
 */
function trackPageView(url, title) {
    if (typeof window === 'undefined' || !window.gtag)
        return;
    window.gtag('event', 'page_view', {
        page_path: url,
        page_title: title,
    });
}
/**
 * Track custom event (respects consent mode)
 *
 * @param eventName - Event name
 * @param eventParams - Event parameters
 */
function trackEvent(eventName, eventParams) {
    if (typeof window === 'undefined' || !window.gtag)
        return;
    window.gtag('event', eventName, eventParams);
}
/**
 * Check if Google Analytics is loaded
 */
function isGoogleAnalyticsLoaded() {
    return typeof window !== 'undefined' && !!window.gtag;
}
/**
 * Get current consent state from GA
 */
function getConsentState() {
    if (typeof window === 'undefined' || !window.gtag)
        return null;
    // This is a simplified version - GA stores consent in a more complex way
    // For a production app, you'd want to sync this with your localStorage
    return null;
}
// Export measurement ID from environment variable
exports.GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
/**
 * Helper hook to track page views automatically
 * Usage in app layout:
 *
 * import { useGoogleAnalytics } from '@/lib/analytics/consent-aware-ga'
 *
 * export default function RootLayout() {
 *   useGoogleAnalytics()
 *   return (...)
 * }
 */
function useGoogleAnalytics() {
    if (typeof window === 'undefined')
        return;
    // Listen for consent updates
    const handleConsentUpdate = (event) => {
        const { analytics, marketing } = event.detail;
        updateGoogleAnalyticsConsent(analytics, marketing);
        // Load GA script if analytics consent is granted
        if (analytics && exports.GA_MEASUREMENT_ID) {
            loadGoogleAnalyticsScript(exports.GA_MEASUREMENT_ID);
        }
    };
    window.addEventListener('cookieConsentUpdate', handleConsentUpdate);
    // Initialize GA with default (denied) consent
    if (exports.GA_MEASUREMENT_ID) {
        initGoogleAnalytics(exports.GA_MEASUREMENT_ID);
    }
}
