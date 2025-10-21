/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['de', 'en', 'th', 'zh', 'vi', 'pl', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  th: 'ไทย',
  zh: '简体中文',
  vi: 'Tiếng Việt',
  pl: 'Polski',
  ru: 'Русский',
};

export default getRequestConfig(async ({ locale }) => {
  // Validate locale and ensure type safety
  const validatedLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  // Dynamically import the locale file
  const messages = (await import(`./locales/${validatedLocale}.json`)).default;

  return {
    locale: validatedLocale,
    messages,
  };
});
