import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { hasConsent } from "@/lib/cookie-consent"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Massava",
  description: "Modern web application platform",
}

/**
 * Root Layout Component
 *
 * Includes:
 * - Cookie consent banner (GDPR compliant)
 * - Conditional Google Analytics loading
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  // Check if user has consented to cookies (server-side safe)
  const canLoadAnalytics = typeof window !== "undefined" && hasConsent()

  return (
    <html lang="en">
      <head>
        {/* Conditionally load Google Analytics ONLY if consent given */}
        {canLoadAnalytics && (
          <>
            {/* Google Analytics Script */}
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        {children}

        {/* Cookie Consent Banner (GDPR compliant) */}
        <CookieConsentBanner />
      </body>
    </html>
  )
}
