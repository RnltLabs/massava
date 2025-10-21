/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { Clock, MapPin, TrendingUp, Search, Users, Phone } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Organic decorative blobs - more and varied */}
      <div
        className="organic-blob"
        style={{
          width: '600px',
          height: '600px',
          background: 'oklch(0.62 0.08 140 / 0.2)',
          top: '-200px',
          left: '-100px',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'oklch(0.55 0.12 35 / 0.15)',
          top: '40%',
          right: '-150px',
          animationDelay: '5s',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '450px',
          height: '450px',
          background: 'oklch(0.88 0.03 80 / 0.25)',
          bottom: '-100px',
          left: '20%',
          animationDelay: '10s',
        }}
      />
      {/* Additional decorative shapes */}
      <div
        className="organic-blob"
        style={{
          width: '350px',
          height: '350px',
          background: 'oklch(0.62 0.08 140 / 0.12)',
          top: '15%',
          left: '30%',
          animationDelay: '3s',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '400px',
          height: '400px',
          background: 'oklch(0.55 0.12 35 / 0.1)',
          bottom: '20%',
          right: '10%',
          animationDelay: '7s',
        }}
      />
      <div
        className="organic-blob"
        style={{
          width: '280px',
          height: '280px',
          background: 'oklch(0.88 0.03 80 / 0.18)',
          top: '60%',
          left: '5%',
          animationDelay: '12s',
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6 wellness-shadow">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{t('badge')}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-4 leading-tight">
              {t('hero_title')}
              <br />
              <span className="text-primary">{t('hero_subtitle')}</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              {t('hero_description')}
            </p>

            {/* Location Search Widget */}
            <div className="max-w-2xl mx-auto wellness-shadow rounded-3xl bg-card p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t('search_location_placeholder')}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors text-lg"
                    />
                  </div>
                  <select defaultValue="20" className="px-4 py-4 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors text-lg bg-card cursor-pointer">
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                    <option value="50">50 km</option>
                  </select>
                </div>

                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all wellness-shadow hover:shadow-lg">
                  <Search className="h-5 w-5" />
                  {t('search_button')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="wellness-shadow rounded-3xl bg-card p-8 hover:scale-105 transition-transform">
              <div className="bg-accent/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('feature1_title')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('feature1_description')}</p>
            </div>

            <div className="wellness-shadow rounded-3xl bg-card p-8 hover:scale-105 transition-transform">
              <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('feature2_title')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('feature2_description')}</p>
            </div>

            <div className="wellness-shadow rounded-3xl bg-card p-8 hover:scale-105 transition-transform">
              <div className="bg-secondary/60 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('feature3_title')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('feature3_description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 wellness-gradient">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">{t('how_it_works_title')}</h2>

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 wellness-shadow">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{t('step1_title')}</h3>
                <p className="text-muted-foreground">{t('step1_description')}</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-accent text-primary-foreground w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 wellness-shadow">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{t('step2_title')}</h3>
                <p className="text-muted-foreground">{t('step2_description')}</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 wellness-shadow">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{t('step3_title')}</h3>
                <p className="text-muted-foreground">{t('step3_description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center wellness-shadow rounded-3xl bg-card p-12">
          <Users className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t('cta_title')}</h2>
          <p className="text-lg text-muted-foreground mb-8">{t('cta_description')}</p>
          <button className="bg-accent hover:bg-accent/90 text-primary-foreground font-semibold py-4 px-8 rounded-2xl inline-flex items-center gap-2 transition-all wellness-shadow hover:shadow-lg">
            <Phone className="h-5 w-5" />
            {t('cta_button')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Massava</h3>
              <p className="text-sm text-muted-foreground">{t('footer_tagline')}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer_for_guests')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer_how_it_works')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer_find_studios')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer_for_studios')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer_register_studio')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer_pricing')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer_legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://rnltlabs.de/imprint" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{t('footer_imprint')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer_privacy')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('footer_terms')}</a></li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-8 border-t border-muted/20">
            {t('footer_copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
