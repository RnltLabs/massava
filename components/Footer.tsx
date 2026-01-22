/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface FooterProps {
  locale: string
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations('footer')

  return (
    <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t border-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-3">
          {/* Legal Links */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <a
              href="https://rnltlabs.de/imprint"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 hover:text-foreground transition-colors"
            >
              {t('imprint')}
            </a>
            <span className="text-muted-foreground/40">·</span>
            <Link
              href={`/${locale}/datenschutz`}
              className="px-2 py-1 hover:text-foreground transition-colors"
            >
              {t('privacy')}
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <a href="#terms" className="px-2 py-1 hover:text-foreground transition-colors">
              {t('terms')}
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground/70">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
