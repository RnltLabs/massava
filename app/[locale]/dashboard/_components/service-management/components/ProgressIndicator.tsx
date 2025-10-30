/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Progress Indicator
 * Dots showing current step in multi-step flow
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
}: ProgressIndicatorProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={currentStep + 1}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i === currentStep
              ? 'w-8 bg-primary'
              : i < currentStep
              ? 'w-2 bg-primary/50'
              : 'w-2 bg-gray-300 dark:bg-gray-700'
          )}
        />
      ))}
    </div>
  );
}
