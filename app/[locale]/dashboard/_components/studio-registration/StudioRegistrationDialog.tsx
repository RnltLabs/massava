'use client';

import React from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

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
  const { state, goToPreviousStep, reset } = useStudioRegistration();
  const { currentStep, isSubmitting, studioId } = state;

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
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Spacer when no back button */}
        {(currentStep === 0 || currentStep === 8) && <div className="w-9" />}

        {/* Title (hidden visually, for screen readers) */}
        <h2 className="sr-only">{stepTitle}</h2>

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className={cn(
            'p-2 -mr-2 rounded-full hover:bg-gray-100',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Close dialog"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Progress Indicator */}
      {showProgress && (
        <div className="mb-4">
          <ProgressIndicator currentStep={currentStep} totalSteps={7} />
        </div>
      )}

      {/* Step Content with cross-fade transition */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.1
          }}
          className="bg-white"
        >
          {currentStep === 8 ? (
            <SuccessStep
              onAddService={handleAddService}
              onGoToDashboard={handleGoToDashboard}
            />
          ) : (
            CurrentStepComponent && <CurrentStepComponent />
          )}
        </motion.div>
      </AnimatePresence>
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
}: StudioRegistrationDialogProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        className={cn(
          isMobile &&
            'fixed inset-x-0 bottom-0 top-auto rounded-t-3xl h-[90vh] w-full max-w-full translate-x-0 translate-y-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom p-6 overflow-y-auto',
          !isMobile && 'sm:max-w-[500px] max-h-[90vh] overflow-y-auto'
        )}
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Studio Registration</DialogTitle>
        <DialogDescription className="sr-only">
          Complete the registration process to create your studio profile
        </DialogDescription>
        <StudioRegistrationProvider>
          <StudioRegistrationContent onClose={onClose} onSuccess={onSuccess} />
        </StudioRegistrationProvider>
      </DialogContent>
    </Dialog>
  );
}
