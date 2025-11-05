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
    <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-muted/20 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Massava</h3>
            <p className="text-sm text-muted-foreground">{t('tagline')}</p>
          </div>

          {/* For Guests */}
          <div>
            <h4 className="font-semibold mb-4">{t('forGuests')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  {t('howItWorks')}
                </a>
              </li>
              <li>
                <Link href={`/${locale}/studios`} className="hover:text-primary transition-colors">
                  {t('findStudios')}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Studios */}
          <div>
            <h4 className="font-semibold mb-4">{t('forStudios')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/business`} className="hover:text-primary transition-colors">
                  {t('businessPortal')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/business/onboarding`} className="hover:text-primary transition-colors">
                  {t('registerStudio')}
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">
                  {t('pricing')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://rnltlabs.de/imprint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {t('imprint')}
                </a>
              </li>
              <li>
                <Link href={`/${locale}/datenschutz`} className="hover:text-primary transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary transition-colors">
                  {t('terms')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-muted/20">
          {t('copyright')}
        </div>
      </div>
    </footer>
  )
}
