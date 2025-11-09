'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Dot-based progress indicator
 * Shows completed, current, and upcoming steps
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
}: ProgressIndicatorProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <motion.div
            key={stepNumber}
            initial={false}
            animate={{
              width: isCurrent ? 12 : 8,
              backgroundColor: isCompleted || isCurrent ? '#B56550' : '#c3d4c3',
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'h-2 rounded-full',
              isCompleted && 'bg-terracotta-500',
              isCurrent && 'bg-terracotta-500 w-3',
              isUpcoming && 'bg-sage-200'
            )}
            aria-label={`Step ${stepNumber} of ${totalSteps}${isCompleted ? ' - Completed' : isCurrent ? ' - Current' : ' - Upcoming'}`}
          />
        );
      })}
    </div>
  );
}
