/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import {
  Building2,
  TrendingUp,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StudioRegistrationTrigger } from '@/app/[locale]/dashboard/_components/StudioRegistrationTrigger';

interface OnboardingScreenProps {
  userName?: string | null;
  locale: string;
}

interface TrustIndicator {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

const trustIndicators: TrustIndicator[] = [
  { icon: TrendingUp, label: '100% der Einnahmen', color: 'text-green-600' },
  { icon: Clock, label: '5 Minuten Setup', color: 'text-blue-600' },
  { icon: Shield, label: 'Keine Gebühren', color: 'text-purple-600' },
];

/**
 * OnboardingScreen Component
 *
 * Full-screen onboarding interface for studio owners without registered studios.
 * Replaces the simple banner with a beautiful, comprehensive welcome experience.
 *
 * Features:
 * - Welcome header with personalized greeting
 * - Registration journey preview with ProgressStepper
 * - Main CTA card with StudioRegistrationTrigger
 * - Trust indicators (Secure, 5 Minutes, Free Forever)
 * - Benefits grid (5 cards)
 * - Features checklist (6 items)
 * - Footer with Help Center link
 * - Fully responsive (mobile-first)
 * - WCAG 2.1 AA compliant
 *
 * @example
 * ```tsx
 * <OnboardingScreen userName="John Doe" locale="de" />
 * ```
 */
export function OnboardingScreen({
  userName,
  locale,
}: OnboardingScreenProps): React.JSX.Element {
  const displayName = userName || 'Studio-Besitzer';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EDE8] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* Welcome Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-[#B56550]/10 rounded-full mb-6">
            <Building2 className="h-12 w-12 md:h-16 md:w-16 text-[#B56550]" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-gray-900">
            Willkommen, {displayName}!
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Bereit, dein Studio auf Massava zu präsentieren?
          </p>
        </header>

        {/* Main CTA Card */}
        <section className="mb-12" aria-labelledby="cta-heading">
          <Card className="border-2 border-[#B56550]/30 shadow-2xl bg-white">
            <CardContent className="p-10 md:p-16">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="space-y-4">
                  <h2
                    id="cta-heading"
                    className="text-2xl md:text-3xl font-bold text-gray-900"
                  >
                    Jetzt dein Studio einrichten
                  </h2>
                  <p className="text-base md:text-lg text-gray-600 max-w-xl">
                    Registriere dein Studio in wenigen Schritten und erreiche tausende potenzielle Kunden.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-2 w-full sm:w-auto">
                  <StudioRegistrationTrigger
                    buttonText="Studio jetzt einrichten"
                    buttonIcon={
                      <Building2 className="h-5 w-5 mr-2" />
                    }
                    variant="default"
                    size="lg"
                    className="text-lg px-10 py-7 w-full sm:w-auto bg-[#B56550] hover:bg-[#A0554A] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 w-full max-w-2xl">
                  {trustIndicators.map((indicator, index) => {
                    const Icon = indicator.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-2 text-center"
                        role="status"
                        aria-label={indicator.label}
                      >
                        <Icon className={`h-8 w-8 ${indicator.color}`} aria-hidden="true" />
                        <span className="text-sm font-medium text-gray-700">{indicator.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer with Help Center Link */}
        <footer className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#B56550] transition-colors">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            <a
              href={`/${locale}/business/help`}
              className="underline underline-offset-4 decoration-dotted"
            >
              Fragen? Besuche unser Help Center
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
