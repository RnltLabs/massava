/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { Clock, MapPin, TrendingUp, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { SearchWidget } from '@/components/SearchWidget';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  BLOB_ANIMATION_DELAY_MEDIUM,
  BLOB_ANIMATION_DELAY_VERY_SLOW,
} from '@/lib/constants/animations';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const session = await auth();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Organic decorative blobs - reduced to 3 with subtle opacity */}
      <div
        className="organic-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'oklch(0.62 0.08 140 / 0.12)',
          top: '-150px',
          left: '-100px',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '400px',
          height: '400px',
          background: 'oklch(0.55 0.12 35 / 0.08)',
          top: '30%',
          right: '-120px',
          animationDelay: BLOB_ANIMATION_DELAY_MEDIUM,
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '350px',
          height: '350px',
          background: 'oklch(0.88 0.03 80 / 0.15)',
          bottom: '10%',
          left: '10%',
          animationDelay: BLOB_ANIMATION_DELAY_VERY_SLOW,
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            {/* Badge - now visible on all devices */}
            <div className="inline-flex items-center gap-2 bg-accent/15 text-accent px-3 py-1.5 rounded-full mb-4 sm:mb-6 text-xs sm:text-sm font-medium backdrop-blur-sm border border-accent/20">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t('badge')}</span>
            </div>

            {/* Simplified H1 structure */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              <span className="block text-foreground">{t('hero_title')}</span>
              <span className="block text-primary">{t('hero_subtitle')}</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              {t('hero_description')}
            </p>

            {/* Welcome Banner for Logged-in Users */}
            {session?.user && (
              <div className="max-w-2xl mx-auto mb-6">
                <div className="glass-card rounded-xl px-4 py-3 text-center">
                  <p className="text-[15px] font-medium text-foreground">
                    {t('welcome_back', { name: session.user.name ?? '' })}
                  </p>
                </div>
              </div>
            )}

            {/* Location Search Widget */}
            <SearchWidget
              autoFocus={!!session?.user}
              placeholder={t('search_location_placeholder')}
              searchButtonText={t('search_button')}
            />

            {/* Trust Indicators */}
            <div className="max-w-2xl mx-auto mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>{t('trust_commission_free')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>{t('trust_instant_booking')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>{t('trust_local_studios')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              {t('features_label')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('features_title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature Card 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('feature1_title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('feature1_description')}</p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('feature2_title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('feature2_description')}</p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="bg-secondary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('feature3_title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('feature3_description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              {t('how_it_works_label')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t('how_it_works_title')}</h2>
          </div>

          {/* Steps - Horizontal on desktop, vertical on mobile */}
          <div className="relative">
            {/* Connection line - desktop only */}
            <div className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30" />

            <div className="grid md:grid-cols-3 gap-8 md:gap-4">
              {/* Step 1 */}
              <div className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3">
                <div className="relative z-10 bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-soft-md">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">{t('step1_title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('step1_description')}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3">
                <div className="relative z-10 bg-accent text-accent-foreground w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-soft-md">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">{t('step2_title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('step2_description')}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3">
                <div className="relative z-10 bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-soft-md">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">{t('step3_title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('step3_description')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Owner CTA Section */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full mb-4 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('studio_cta_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {t('studio_cta_title')}
          </h2>
          <p className="text-base text-muted-foreground mb-6 max-w-lg mx-auto">
            {t('studio_cta_description')}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-8 shadow-soft-md hover:shadow-soft-lg transition-all"
          >
            <Link href={`/${locale}?signup=studio`}>
              {t('studio_cta_button')}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer locale={locale} />
    </div>
  );
}
