/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  label: string;
  description: string;
}

interface ProgressStepperProps {
  currentStep: number;
  steps: Step[];
  className?: string;
}

/**
 * ProgressStepper Component
 *
 * Responsive stepper component with mobile and desktop variants:
 * - Mobile: Compact progress bar with step indicator
 * - Desktop: Full stepper with circles, labels, descriptions, and connector lines
 *
 * @example
 * ```tsx
 * <ProgressStepper
 *   currentStep={2}
 *   steps={[
 *     { id: 1, label: 'Basic Info', description: 'Name & category' },
 *     { id: 2, label: 'Location', description: 'Address & map' },
 *   ]}
 * />
 * ```
 */
export function ProgressStepper({
  currentStep,
  steps,
  className = '',
}: ProgressStepperProps): React.JSX.Element {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <nav
      role="navigation"
      aria-label="Registration progress"
      className={className}
    >
      {/* Mobile: Compact Progress Bar */}
      <div className="md:hidden" aria-hidden="true">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-600">
            {steps[currentStep - 1]?.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]?.label}`}
          />
        </div>
      </div>

      {/* Desktop: Full Stepper */}
      <ol className="hidden md:flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;
          const isNotLast = index < steps.length - 1;

          return (
            <li
              key={step.id}
              className="flex-1 flex items-center"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full
                      transition-all duration-300 ease-in-out
                      ${
                        isCompleted
                          ? 'bg-green-600 text-white shadow-md'
                          : isCurrent
                          ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                    aria-label={
                      isCompleted
                        ? `${step.label} completed`
                        : isCurrent
                        ? `${step.label} current step`
                        : `${step.label} upcoming`
                    }
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" aria-hidden="true" />
                    ) : (
                      <span className="text-lg font-semibold">{step.id}</span>
                    )}
                  </div>
                </div>

                {/* Step Label & Description */}
                <div className="mt-3 text-center max-w-[120px]">
                  <div
                    className={`
                      text-sm font-semibold transition-colors duration-300
                      ${
                        isCompleted || isCurrent
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`
                      text-xs mt-1 transition-colors duration-300
                      ${
                        isCompleted || isCurrent
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {isNotLast && (
                <div
                  className="flex-1 h-0.5 mx-4 -mt-16 transition-colors duration-500"
                  style={{
                    backgroundColor: isCompleted ? '#16a34a' : '#e5e7eb',
                  }}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
