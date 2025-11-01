'use client';

import React from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

import { StudioRegistrationProvider } from './StudioRegistrationContext';
import { useStudioRegistration } from './hooks/useStudioRegistration';
import { ProgressIndicator } from './components/ProgressIndicator';
import { WelcomeStep } from './steps/WelcomeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { AddressStep } from './steps/AddressStep';
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
    if (currentStep === 7 && studioId) {
      onSuccess?.(studioId);
    }
  }, [currentStep, studioId, onSuccess]);

  const steps = [
    { component: WelcomeStep, title: 'Welcome' },
    { component: BasicInfoStep, title: 'Basic Information' },
    { component: AddressStep, title: 'Location' },
    { component: ContactStep, title: 'Contact' },
    { component: OpeningHoursStep, title: 'Opening Hours' },
    { component: CapacityStep, title: 'Capacity' },
    { component: ServicesStep, title: 'Services' },
    { component: SuccessStep, title: 'Success' },
  ];

  const CurrentStepComponent = steps[currentStep]?.component;
  const stepTitle = steps[currentStep]?.title;

  // Show progress indicator for steps 1-6
  const showProgress = currentStep >= 1 && currentStep <= 6;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Back Button */}
        {currentStep > 0 && currentStep < 7 && (
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
        {(currentStep === 0 || currentStep === 7) && <div className="w-9" />}

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
          <ProgressIndicator currentStep={currentStep} totalSteps={6} />
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {currentStep === 7 ? (
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
 * Responsive: Sheet on mobile, Dialog on desktop
 */
export function StudioRegistrationDialog({
  isOpen,
  onClose,
  onSuccess,
}: StudioRegistrationDialogProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <StudioRegistrationProvider>
      <StudioRegistrationContent onClose={onClose} onSuccess={onSuccess} />
    </StudioRegistrationProvider>
  );

  // Mobile: Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[95vh] rounded-t-3xl p-0 border-t-2 border-gray-200 bg-white"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Studio Registration</SheetTitle>
          <div className="overflow-y-auto h-full px-6 pt-4 pb-8">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 bg-white border-0 shadow-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Studio Registration</DialogTitle>
        <div className="px-6 pt-4 pb-6 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
