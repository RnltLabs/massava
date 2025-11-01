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
      title: 'Studio-Details',
      description: 'Erzähl uns von deinem Wellness-Studio',
    },
    {
      icon: MapPin,
      title: 'Standort',
      description: 'Wo Kunden dich finden können',
    },
    {
      icon: Phone,
      title: 'Kontaktinformationen',
      description: 'Wie Kunden dich erreichen können',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Icon - Smaller and closer to top */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-terracotta-100 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-terracotta-600" />
        </div>
      </div>

      {/* Header - Compact */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Lass uns dein Studio-Profil einrichten
        </h2>
        <p className="text-sm text-gray-600">
          Wir helfen dir, in wenigen Schritten ein vollständiges Profil zu erstellen
        </p>
      </div>

      {/* Features - Compact */}
      <div className="space-y-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-default select-none"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-terracotta-100 flex items-center justify-center">
              <feature.icon className="h-4 w-4 text-terracotta-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA - Compact */}
      <div className="space-y-2 pt-1">
        <Button
          type="button"
          onClick={handleGetStarted}
          style={{ backgroundColor: '#B56550' }}
          className="w-full h-11 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 cursor-pointer"
        >
          Los geht&apos;s
        </Button>

        <p className="text-center text-xs text-gray-500">
          Dauert ca. 2-3 Minuten
        </p>
      </div>
    </motion.div>
  );
}
