/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Management Dialog
 * Companion-style multi-step dialog for creating/editing services
 * Responsive: Sheet on mobile, Dialog on desktop
 */

'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { ServiceManagementProvider } from './ServiceManagementContext';
import { useServiceManagement } from './hooks/useServiceManagement';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ServiceNameStep } from './steps/ServiceNameStep';
import { ServiceDurationStep } from './steps/ServiceDurationStep';
import { ServicePriceStep } from './steps/ServicePriceStep';
import { ServiceReviewStep } from './steps/ServiceReviewStep';
import { ServiceSuccessStep } from './steps/ServiceSuccessStep';

interface ServiceManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studioId: string;
  onSuccess?: (serviceId: string) => void;
  // For edit mode
  editService?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

/**
 * Inner content component that uses the context
 */
function ServiceManagementContent({
  onClose,
  studioId,
  onSuccess,
  editService,
}: {
  onClose: () => void;
  studioId: string;
  onSuccess?: (serviceId: string) => void;
  editService?: ServiceManagementDialogProps['editService'];
}): React.JSX.Element {
  const { state, goToPreviousStep, reset, loadService, setMode } = useServiceManagement();
  const { currentStep, isSubmitting, serviceId, mode } = state;

  // Load service data for edit mode
  useEffect(() => {
    if (editService) {
      loadService({
        name: editService.name,
        duration: editService.duration,
        price: editService.price,
        serviceId: editService.id,
      });
      setMode('edit');
    }
  }, [editService, loadService, setMode]);

  // Handle success
  useEffect(() => {
    if (currentStep === 4 && serviceId) {
      onSuccess?.(serviceId);
    }
  }, [currentStep, serviceId, onSuccess]);

  const steps = [
    { component: ServiceNameStep, title: 'Service Name' },
    { component: ServiceDurationStep, title: 'Duration' },
    { component: ServicePriceStep, title: 'Price' },
    { component: ServiceReviewStep, title: 'Review' },
    { component: ServiceSuccessStep, title: 'Success' },
  ];

  const CurrentStepComponent = steps[currentStep]?.component;

  // Show progress indicator for steps 0-2
  const showProgress = currentStep >= 0 && currentStep <= 2;

  const handleClose = (): void => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const handleBack = (): void => {
    if (!isSubmitting && currentStep > 0 && currentStep < 4) {
      goToPreviousStep();
    }
  };

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
            <ProgressIndicator currentStep={currentStep} totalSteps={3} />
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
          {CurrentStepComponent && <CurrentStepComponent studioId={studioId} onClose={handleClose} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Main Dialog Component (with responsive wrapper)
 */
export function ServiceManagementDialog({
  isOpen,
  onClose,
  studioId,
  onSuccess,
  editService,
}: ServiceManagementDialogProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <ServiceManagementProvider>
      <ServiceManagementContent
        onClose={onClose}
        studioId={studioId}
        onSuccess={onSuccess}
        editService={editService}
      />
    </ServiceManagementProvider>
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
            <SheetTitle>Service verwalten</SheetTitle>
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
          <DialogTitle>Service verwalten</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
