/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { StudioRegistrationForm } from '@/components/StudioRegistrationForm';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function StudioRegisterPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'studio_register' });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <div className="wellness-shadow rounded-3xl bg-card p-8">
          <StudioRegistrationForm locale={locale} />
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">{t('benefit1')}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">0€</div>
            <div className="text-sm text-muted-foreground">{t('benefit2')}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">{t('benefit3')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
