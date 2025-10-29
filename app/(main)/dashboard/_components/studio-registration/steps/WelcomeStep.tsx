'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioRegistration } from '../hooks/useStudioRegistration';

/**
 * Welcome Step - Step 0
 * Introduces the studio registration flow
 */
export function WelcomeStep(): React.JSX.Element {
  const { goToNextStep } = useStudioRegistration();

  const handleGetStarted = (): void => {
    console.log('🚀 Get Started button clicked!');
    goToNextStep();
  };

  const features = [
    {
      icon: Building2,
      title: 'Studio Details',
      description: 'Tell us about your wellness studio',
    },
    {
      icon: MapPin,
      title: 'Location',
      description: 'Where clients can find you',
    },
    {
      icon: Phone,
      title: 'Contact Info',
      description: 'How clients can reach you',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl bg-terracotta-100 flex items-center justify-center">
          <Building2 className="h-10 w-10 text-terracotta-600" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Let&apos;s set up your studio profile
        </h2>
        <p className="text-base text-gray-600">
          We&apos;ll help you create a complete profile in just a few steps
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-terracotta-100 flex items-center justify-center">
              <feature.icon className="h-5 w-5 text-terracotta-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <Button
          type="button"
          onClick={handleGetStarted}
          className="w-full h-12 bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium rounded-xl transition-colors cursor-pointer"
        >
          Los geht&apos;s
        </Button>

        <p className="text-center text-sm text-gray-500">
          Takes about 2-3 minutes to complete
        </p>
      </div>
    </motion.div>
  );
}
