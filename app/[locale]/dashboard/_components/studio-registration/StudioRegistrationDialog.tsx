'use client';

import React from 'react';
import { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { StudioRegistrationProvider } from './StudioRegistrationContext';
import { useStudioRegistration } from './hooks/useStudioRegistration';
import { ProgressIndicator } from './components/ProgressIndicator';
import { WelcomeStep } from './steps/WelcomeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { AddressStep } from './steps/AddressStep';
import { ImagesStep } from './steps/ImagesStep';
import { ContactStep } from './steps/ContactStep';
import { OpeningHoursStep } from './steps/OpeningHoursStep';
import { CapacityStep } from './steps/CapacityStep';
import { ServicesStep } from './steps/ServicesStep';
import { SuccessStep } from './steps/SuccessStep';

interface StudioRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (studioId: string) => void;
}

/**
 * Inner content component that uses the context
 */
function StudioRegistrationContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (studioId: string) => void;
}): React.JSX.Element {
  const { state, goToPreviousStep, reset, loadDraftData } = useStudioRegistration();
  const { currentStep, isSubmitting, studioId } = state;

  console.log('🎯 StudioRegistrationContent rendered, currentStep:', currentStep);

  // Load draft on mount
  useEffect(() => {
    loadDraftData();
  }, [loadDraftData]);

  // Handle success
  useEffect(() => {
    if (currentStep === 8 && studioId) {
      onSuccess?.(studioId);
    }
  }, [currentStep, studioId, onSuccess]);

  const steps = [
    { component: WelcomeStep, title: 'Welcome' },
    { component: BasicInfoStep, title: 'Basic Information' },
    { component: AddressStep, title: 'Location' },
    { component: ImagesStep, title: 'Images' },
    { component: ContactStep, title: 'Contact' },
    { component: OpeningHoursStep, title: 'Opening Hours' },
    { component: CapacityStep, title: 'Capacity' },
    { component: ServicesStep, title: 'Services' },
    { component: SuccessStep, title: 'Success' },
  ];

  const CurrentStepComponent = steps[currentStep]?.component;
  const stepTitle = steps[currentStep]?.title;

  // Show progress indicator for steps 1-7
  const showProgress = currentStep >= 1 && currentStep <= 7;

  const handleClose = (): void => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const handleBack = (): void => {
    if (!isSubmitting && currentStep > 0) {
      goToPreviousStep();
    }
  };

  const handleAddService = (): void => {
    // TODO: Navigate to add service page
    console.log('Add service clicked');
    handleClose();
  };

  const handleGoToDashboard = (): void => {
    // Navigate to dashboard
    handleClose();
  };

  return (
    <div className="relative">
      {/* Header - Fixed position to prevent layout shift */}
      <div className="flex items-center justify-between mb-4">
        {/* Back Button */}
        {currentStep > 0 && currentStep < 8 && (
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Spacer when no back button */}
        {(currentStep === 0 || currentStep === 8) && <div className="w-9" />}

        {/* Progress Indicator */}
        {showProgress && (
          <div className="flex-1 flex justify-center">
            <ProgressIndicator currentStep={currentStep} totalSteps={7} />
          </div>
        )}

        {/* Title (hidden visually, for screen readers) */}
        <h2 className="sr-only">{stepTitle}</h2>

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Step Content */}
      <div>
        {currentStep === 8 ? (
          <SuccessStep
            onAddService={handleAddService}
            onGoToDashboard={handleGoToDashboard}
          />
        ) : (
          CurrentStepComponent && <CurrentStepComponent />
        )}
      </div>
    </div>
  );
}

/**
 * Main Studio Registration Dialog Component
 * Responsive: Uses single Dialog component with conditional styling
 * This prevents SSR/hydration mismatches that cause double rendering
 */
export function StudioRegistrationDialog({
  isOpen,
  onClose,
  onSuccess,
}: StudioRegistrationDialogProps): React.JSX.Element | null {
  console.log('🔍 [StudioRegistrationDialog] Rendered - isOpen:', isOpen);

  React.useEffect(() => {
    if (isOpen) {
      console.log('✅ [StudioRegistrationDialog] Dialog OPENED');
    } else {
      console.log('❌ [StudioRegistrationDialog] Dialog CLOSED');
    }
  }, [isOpen]);

  // Don't render the Dialog at all when closed - this prevents multiple portal instances
  if (!isOpen) {
    return null;
  }

  return (
    <StudioRegistrationProvider>
      <Dialog open={isOpen} onOpenChange={onClose} modal>
        <DialogContent
          style={{ backgroundColor: '#F4EDE8' }}
          className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Studio Registration</DialogTitle>
          <DialogDescription className="sr-only">
            Complete the registration process to create your studio profile
          </DialogDescription>
          <StudioRegistrationContent onClose={onClose} onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>
    </StudioRegistrationProvider>
  );
}
