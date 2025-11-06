"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { getConsentStatus, setConsentStatus, type ConsentStatus } from "@/lib/cookie-consent"

/**
 * GDPR-compliant cookie consent banner
 *
 * Features:
 * - Opt-in consent (GDPR compliant)
 * - Blocks analytics until consent given
 * - Persists choice in localStorage
 * - WCAG 2.1 AA accessible
 * - Mobile-responsive
 */
export function CookieConsentBanner(): JSX.Element | null {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [isClient, setIsClient] = useState<boolean>(false)

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true)

    // Check if user has already made a choice
    const consentStatus: ConsentStatus = getConsentStatus()

    // Show banner only if consent is pending
    if (consentStatus === "pending") {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = (): void => {
    setConsentStatus("accepted")
    setIsVisible(false)

    // Reload to load analytics scripts
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const handleReject = (): void => {
    setConsentStatus("rejected")
    setIsVisible(false)
  }

  // Don't render on server or if not visible
  if (!isClient || !isVisible) {
    return null
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      {/* Backdrop */}
      <div className="bg-black/20 backdrop-blur-sm">
        {/* Container */}
        <div className="container mx-auto px-4 py-4 sm:px-6">
          {/* Card */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Close button (optional - for better UX) */}
            <button
              onClick={handleReject}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Reject cookies and close banner"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="pr-8">
              <h2
                id="cookie-consent-title"
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
              >
                We value your privacy
              </h2>

              <p
                id="cookie-consent-description"
                className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4"
              >
                We use cookies to improve your experience and analyze site traffic.
                By clicking "Accept", you consent to our use of cookies for analytics.
                You can change your preferences at any time in your account settings.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleAccept}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95"
                  aria-label="Accept cookies and enable analytics"
                >
                  Accept Cookies
                </button>

                <button
                  onClick={handleReject}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:scale-95"
                  aria-label="Reject cookies and continue without analytics"
                >
                  Reject Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
