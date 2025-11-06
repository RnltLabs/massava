"use strict";
/**
 * Cookie Consent Management
 *
 * GDPR-compliant consent management for analytics cookies.
 * Stores user's consent choice in localStorage.
 *
 * @module cookie-consent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsentStatus = getConsentStatus;
exports.setConsentStatus = setConsentStatus;
exports.hasConsent = hasConsent;
exports.resetConsent = resetConsent;
exports.shouldShowConsentBanner = shouldShowConsentBanner;
const CONSENT_STORAGE_KEY = "massava_cookie_consent";
/**
 * Get the current consent status from localStorage
 *
 * @returns The current consent status, defaults to 'pending' if not set
 *
 * @example
 * ```ts
 * const status = getConsentStatus()
 * if (status === 'accepted') {
 *   // Load analytics
 * }
 * ```
 */
function getConsentStatus() {
    // Server-side rendering guard
    if (typeof window === "undefined") {
        return "pending";
    }
    try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored === "accepted" || stored === "rejected") {
            return stored;
        }
        return "pending";
    }
    catch (error) {
        // localStorage might be disabled or throw errors in some browsers
        console.error("Failed to read cookie consent from localStorage:", error);
        return "pending";
    }
}
/**
 * Set the consent status in localStorage
 *
 * @param status - The consent status to store
 *
 * @example
 * ```ts
 * // User accepted cookies
 * setConsentStatus('accepted')
 *
 * // User rejected cookies
 * setConsentStatus('rejected')
 * ```
 */
function setConsentStatus(status) {
    // Server-side rendering guard
    if (typeof window === "undefined") {
        return;
    }
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, status);
    }
    catch (error) {
        console.error("Failed to save cookie consent to localStorage:", error);
    }
}
/**
 * Check if user has given consent for cookies
 *
 * @returns `true` if consent is accepted, `false` otherwise
 *
 * @example
 * ```ts
 * if (hasConsent()) {
 *   // Initialize Google Analytics
 *   initAnalytics()
 * }
 * ```
 */
function hasConsent() {
    return getConsentStatus() === "accepted";
}
/**
 * Reset consent status (remove from localStorage)
 *
 * Useful for testing or allowing users to change their preferences.
 *
 * @example
 * ```ts
 * // In user settings page
 * function handleResetConsent() {
 *   resetConsent()
 *   window.location.reload() // Reload to show banner again
 * }
 * ```
 */
function resetConsent() {
    // Server-side rendering guard
    if (typeof window === "undefined") {
        return;
    }
    try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
    }
    catch (error) {
        console.error("Failed to reset cookie consent in localStorage:", error);
    }
}
/**
 * Check if consent banner should be shown
 *
 * @returns `true` if banner should be shown (consent is pending)
 *
 * @example
 * ```ts
 * if (shouldShowConsentBanner()) {
 *   // Render banner component
 * }
 * ```
 */
function shouldShowConsentBanner() {
    return getConsentStatus() === "pending";
}
