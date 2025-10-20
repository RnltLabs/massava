/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    console.log('Switching locale from', locale, 'to', newLocale);

    // Set cookie for locale preference (expires in 1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `NEXT_LOCALE=${newLocale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    // Handle basePath in production (/massava)
    const basePath = '/massava';
    let pathWithoutBase = pathname;
    let detectedBasePath = '';

    // Check if pathname starts with basePath
    if (pathname.startsWith(basePath + '/') || pathname === basePath) {
      pathWithoutBase = pathname.slice(basePath.length) || '/';
      detectedBasePath = basePath;
    }

    // Split pathname into segments
    const segments = pathWithoutBase.split('/').filter(Boolean);

    // Replace first segment (which is the locale) with new locale
    if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      // If no locale in path, prepend it
      segments.unshift(newLocale);
    }

    // Reconstruct path with basePath
    const newPath = detectedBasePath + '/' + segments.join('/');
    console.log('Navigating to:', newPath);

    // Close dropdown immediately
    setIsOpen(false);

    // Use hard navigation to ensure server components re-render with new locale
    window.location.href = newPath;
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <button
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground bg-card hover:bg-accent/10 transition-colors wellness-shadow rounded-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="h-4 w-4" />
          <span>{localeNames[locale as Locale]}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-card wellness-shadow rounded-2xl overflow-hidden z-50">
              {locales.map((loc) => (
                <button
                  key={loc}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-accent/10 transition-colors ${
                    loc === locale ? 'bg-accent/20 font-semibold text-primary' : 'text-foreground'
                  }`}
                  onClick={() => switchLocale(loc)}
                >
                  {localeNames[loc]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
