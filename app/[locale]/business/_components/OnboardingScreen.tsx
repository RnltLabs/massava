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
  Users,
  Shield,
  Award,
  Check,
  Lock,
  Timer,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudioRegistrationTrigger } from '@/app/[locale]/dashboard/_components/StudioRegistrationTrigger';
import { ProgressStepper, Step } from './ProgressStepper';
import { DraftResumeBanner } from './DraftResumeBanner';

interface OnboardingScreenProps {
  userName?: string | null;
  locale: string;
}

const journeySteps: Step[] = [
  { id: 1, label: 'Basic Info', description: 'Name & category' },
  { id: 2, label: 'Location', description: 'Address & map' },
  { id: 3, label: 'Images', description: 'Logo & gallery' },
  { id: 4, label: 'Contact', description: 'Phone & email' },
];

interface Feature {
  label: string;
  included: boolean;
}

const features: Feature[] = [
  { label: 'Online Booking System', included: true },
  { label: 'Calendar Management', included: true },
  { label: 'Customer Communication', included: true },
  { label: 'Service Management', included: true },
  { label: 'Analytics Dashboard', included: true },
  { label: 'Mobile App Access', included: true },
];

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColor: string;
  bgColor: string;
}

const benefits: Benefit[] = [
  {
    icon: TrendingUp,
    title: '100% Revenue',
    description: 'Keep all your earnings. Zero commission fees.',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Clock,
    title: '5-Min Setup',
    description: 'Quick registration. Start today.',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Users,
    title: 'Reach Customers',
    description: 'Connect with thousands of local clients.',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'Secure and privacy-focused platform.',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Award,
    title: 'Professional Profile',
    description: 'Showcase your studio beautifully.',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
];

interface TrustIndicator {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const trustIndicators: TrustIndicator[] = [
  { icon: Lock, label: 'Secure' },
  { icon: Timer, label: '5 Minutes' },
  { icon: Sparkles, label: 'Free Forever' },
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
  const displayName = userName || 'Studio Owner';
  const [triggerOpen, setTriggerOpen] = useState(false);

  const handleResumeDraft = (): void => {
    setTriggerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EDE8] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Draft Resume Banner */}
        <DraftResumeBanner onResume={handleResumeDraft} />

        {/* Welcome Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Building2 className="h-8 w-8 md:h-10 md:w-10 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4 text-gray-900">
            Welcome, {displayName}!
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Ready to showcase your studio on Massava? Let's get you set up in minutes.
          </p>
        </header>

        {/* Registration Journey Preview */}
        <section className="mb-8 md:mb-12" aria-labelledby="journey-heading">
          <h2
            id="journey-heading"
            className="text-xl md:text-2xl font-semibold text-center mb-6 text-gray-900"
          >
            Your Registration Journey
          </h2>
          <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6 md:p-8">
              <ProgressStepper currentStep={1} steps={journeySteps} />
            </CardContent>
          </Card>
        </section>

        {/* Main CTA Card */}
        <section className="mb-8 md:mb-12" aria-labelledby="cta-heading">
          <Card className="max-w-3xl mx-auto border-2 border-primary/50 shadow-2xl bg-white">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-primary/10 rounded-full">
                  <Building2 className="h-12 w-12 md:h-16 md:w-16 text-primary" aria-hidden="true" />
                </div>

                <div className="space-y-3 md:space-y-4">
                  <h2
                    id="cta-heading"
                    className="text-2xl md:text-3xl font-bold text-gray-900"
                  >
                    Set Up Your Studio Now
                  </h2>
                  <p className="text-base md:text-lg text-gray-600 max-w-2xl">
                    Register your studio in a few simple steps and reach thousands of potential
                    customers. Completely free, no hidden fees.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-4 w-full sm:w-auto">
                  <StudioRegistrationTrigger
                    buttonText="Start Registration"
                    buttonIcon={
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                      </div>
                    }
                    variant="default"
                    size="lg"
                    className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto"
                    externalTrigger={triggerOpen}
                    onExternalTriggerChange={setTriggerOpen}
                  />
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4 text-sm text-gray-600">
                  {trustIndicators.map((indicator, index) => {
                    const Icon = indicator.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                        role="status"
                        aria-label={indicator.label}
                      >
                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>{indicator.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Benefits Grid */}
        <section className="mb-8 md:mb-12" aria-labelledby="benefits-heading">
          <h2
            id="benefits-heading"
            className="text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-900"
          >
            Why Choose Massava?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="bg-white hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={`inline-flex items-center justify-center p-3 rounded-full mb-4 ${benefit.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${benefit.iconColor}`} aria-hidden="true" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Features Checklist */}
        <section className="mb-8 md:mb-12" aria-labelledby="features-heading">
          <Card className="max-w-3xl mx-auto bg-white shadow-lg">
            <CardContent className="p-6 md:p-8">
              <h2
                id="features-heading"
                className="text-xl md:text-2xl font-semibold mb-6 text-center text-gray-900"
              >
                Everything You Need to Succeed
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                        <Check
                          className="h-3.5 w-3.5 text-green-600"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <span className="text-sm md:text-base text-gray-700">
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Footer with Help Center Link */}
        <footer className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            <a
              href={`/${locale}/help`}
              className="underline underline-offset-4 decoration-dotted"
            >
              Need help? Visit our Help Center
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
