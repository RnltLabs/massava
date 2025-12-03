/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { UnifiedHeader } from '@/components/unified-header';
import SentryDebug from '@/components/SentryDebug';
import SessionProvider from '@/components/SessionProvider';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Toaster } from '@/components/ui/toaster';
import { MobileCustomerNavWrapper } from '@/components/customer';
import { MainContentWrapper } from '@/components/layout';
import "../globals.css";

export const metadata: Metadata = {
  title: "Massava - Spontane Massage-Buchungen",
  description: "Finde und buche deine Massage spontan – ohne Provisionen, transparent, unkompliziert.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SentryDebug />
        <SessionProvider>
          <GoogleAnalytics />
          <NextIntlClientProvider messages={messages} locale={locale}>
            <UnifiedHeader />
            <MainContentWrapper>
              {children}
            </MainContentWrapper>
            <MobileCustomerNavWrapper />
            <CookieConsentBanner />
            <Toaster />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
