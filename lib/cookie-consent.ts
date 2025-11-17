/**
 * Cookie Consent Management
 *
 * GDPR-compliant consent management for cookies.
 * Stores user's consent choice in localStorage.
 *
 * @module cookie-consent
 */

const CONSENT_STORAGE_KEY = "massava_cookie_consent"
const CONSENT_VERSION = "1.0"

/**
 * Cookie consent preferences
 */
export interface CookieConsent {
  necessary: boolean // Always true (required for functionality)
  analytics: boolean
  marketing: boolean
  timestamp: number
  version: string
}

/**
 * Get the current consent from localStorage
 *
 * @returns The current consent object
 */
export function getConsent(): CookieConsent | null {
  // Server-side rendering guard
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) {
      return null
    }

    return JSON.parse(stored) as CookieConsent
  } catch (error) {
    console.error("Failed to read cookie consent from localStorage:", error)
    return null
  }
}

/**
 * Set the consent in localStorage
 *
 * @param consent - The consent object to store
 */
export function setConsent(consent: Omit<CookieConsent, "timestamp" | "version">): void {
  // Server-side rendering guard
  if (typeof window === "undefined") {
    return
  }

  try {
    const consentWithMeta: CookieConsent = {
      ...consent,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    }

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentWithMeta))
  } catch (error) {
    console.error("Failed to save cookie consent to localStorage:", error)
  }
}

/**
 * Legacy: Get simple consent status
 */
export type ConsentStatus = "accepted" | "rejected" | "pending"

export function getConsentStatus(): ConsentStatus {
  const consent = getConsent()
  if (!consent) return "pending"
  return consent.analytics ? "accepted" : "rejected"
}

export function setConsentStatus(status: ConsentStatus): void {
  if (status === "accepted") {
    setConsent({ necessary: true, analytics: true, marketing: false })
  } else if (status === "rejected") {
    setConsent({ necessary: true, analytics: false, marketing: false })
  }
}

/**
 * Check if user has given consent for analytics
 */
export function hasConsent(): boolean {
  const consent = getConsent()
  return consent?.analytics === true
}

/**
 * Check if user has given consent for marketing
 */
export function hasMarketingConsent(): boolean {
  const consent = getConsent()
  return consent?.marketing === true
}

/**
 * Reset consent status (remove from localStorage)
 */
export function resetConsent(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to reset cookie consent in localStorage:", error)
  }
}

/**
 * Check if consent banner should be shown
 */
export function shouldShowConsentBanner(): boolean {
  return getConsent() === null
}
