'use client';

import React from 'react';
import { CheckCircle2, Calendar, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioRegistration } from '../hooks/useStudioRegistration';

interface SuccessStepProps {
  onAddService?: () => void;
  onGoToDashboard?: () => void;
}

/**
 * Success Step - Step 4
 * Shows success message and next steps
 */
export function SuccessStep({
  onAddService,
  onGoToDashboard,
}: SuccessStepProps): React.JSX.Element {
  const { state } = useStudioRegistration();
  const studioName = state.formData.basicInfo.name || 'Your Studio';
  const hasServices = (state.formData.services?.length || 0) > 0;

  // Conditionally show "Add services" step only if no services were added
  const nextSteps = hasServices
    ? [
        {
          icon: LayoutDashboard,
          title: 'Profil anpassen',
          description: 'Füge Fotos hinzu und vervollständige dein Studio-Profil',
        },
      ]
    : [
        {
          icon: Calendar,
          title: 'Services hinzufügen',
          description: 'Erstelle deine Service-Angebote und Preise',
        },
        {
          icon: LayoutDashboard,
          title: 'Profil anpassen',
          description: 'Füge Fotos hinzu und vervollständige dein Studio-Profil',
        },
      ];

  return (
    <div className="space-y-8">
      {/* Animated Checkmark */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-terracotta-100 flex items-center justify-center">
          <div>
            <CheckCircle2 className="h-10 w-10 text-terracotta-600" />
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">
          {hasServices ? 'Dein Studio ist jetzt live!' : 'Willkommen bei Massava!'}
        </h2>
        <p className="text-base text-gray-600">
          <span className="font-semibold text-terracotta-600">{studioName}</span>{' '}
          {hasServices ? 'ist jetzt sichtbar für Buchungen' : 'wurde erfolgreich registriert'}
        </p>
      </div>

      {/* What's Next Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center">
          Was kommt als Nächstes?
        </h3>

        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-terracotta-100 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-terracotta-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        {!hasServices && (
          <Button
            onClick={onAddService}
            style={{ backgroundColor: '#B56550' }}
            className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90"
          >
            Ersten Service hinzufügen
          </Button>
        )}

        <Button
          onClick={onGoToDashboard}
          variant="outline"
          className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200"
        >
          Zum Dashboard
        </Button>
      </div>
    </div>
  );
}
