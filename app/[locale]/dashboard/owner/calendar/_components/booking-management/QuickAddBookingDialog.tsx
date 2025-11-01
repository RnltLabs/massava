/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Quick Add Booking Dialog
 * Companion-style multi-step dialog for manual booking creation
 * Responsive: Sheet on mobile, Dialog on desktop
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { QuickAddBookingProvider } from './QuickAddBookingContext';
import { useQuickAddBooking } from './QuickAddBookingContext';
import { ContactStep } from './steps/ContactStep';
import { ServiceStep } from './steps/ServiceStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { ReviewStep } from './steps/ReviewStep';
import { SuccessStep } from './steps/SuccessStep';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

interface QuickAddBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studioId: string;
  services: Service[];
  initialDate?: Date;
  onSuccess?: () => void;
}

/**
 * Progress Indicator
 */
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            index === currentStep
              ? 'w-8 bg-primary'
              : index < currentStep
              ? 'w-1.5 bg-primary'
              : 'w-1.5 bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Inner content component that uses the context
 */
function QuickAddBookingContent({
  onClose,
  studioId,
  services,
  initialDate,
  onSuccess,
}: {
  onClose: () => void;
  studioId: string;
  services: Service[];
  initialDate?: Date;
  onSuccess?: () => void;
}): React.JSX.Element {
  console.log('🟣 [QuickAddBookingContent] RENDER');

  const { state, goToPreviousStep, reset } = useQuickAddBooking();
  const { currentStep, isSubmitting } = state;

  console.log('📋 [QuickAddBookingContent] Current Step:', currentStep, 'isSubmitting:', isSubmitting);

  // Use ref to avoid re-renders when onSuccess changes
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Handle success callback
  useEffect(() => {
    if (currentStep === 4 && state.bookingId) {
      onSuccessRef.current?.();
    }
  }, [currentStep, state.bookingId]);

  // Show progress indicator for steps 0-3
  const showProgress = currentStep >= 0 && currentStep <= 3;

  const handleClose = useCallback((): void => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  }, [isSubmitting, reset, onClose]);

  const handleAddAnother = useCallback((): void => {
    reset();
    // Don't close dialog - user can add another booking
  }, [reset]);

  const handleBack = useCallback((): void => {
    if (!isSubmitting && currentStep > 0 && currentStep < 4) {
      goToPreviousStep();
    }
  }, [isSubmitting, currentStep, goToPreviousStep]);

  // Render current step directly without creating component functions
  let currentStepContent: React.ReactNode = null;

  switch (currentStep) {
    case 0:
      currentStepContent = <ContactStep />;
      break;
    case 1:
      currentStepContent = <ServiceStep studioId={studioId} services={services} />;
      break;
    case 2:
      currentStepContent = <DateTimeStep studioId={studioId} services={services} initialDate={initialDate} />;
      break;
    case 3:
      currentStepContent = <ReviewStep studioId={studioId} services={services} />;
      break;
    case 4:
      currentStepContent = <SuccessStep onClose={handleClose} onAddAnother={handleAddAnother} />;
      break;
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Back Button */}
        {currentStep > 0 && currentStep < 4 && (
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Spacer */}
        {(currentStep === 0 || currentStep === 4) && <div className="w-9" />}

        {/* Progress Indicator */}
        {showProgress && (
          <div className="flex-1 flex justify-center">
            <ProgressIndicator currentStep={currentStep} totalSteps={4} />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {currentStepContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Main Dialog Component (with responsive wrapper)
 */
export function QuickAddBookingDialog({
  isOpen,
  onClose,
  studioId,
  services,
  initialDate,
  onSuccess,
}: QuickAddBookingDialogProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <QuickAddBookingProvider>
      <QuickAddBookingContent
        onClose={onClose}
        studioId={studioId}
        services={services}
        initialDate={initialDate}
        onSuccess={onSuccess}
      />
    </QuickAddBookingProvider>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Termin buchen</SheetTitle>
          </VisuallyHidden>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Termin buchen</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
