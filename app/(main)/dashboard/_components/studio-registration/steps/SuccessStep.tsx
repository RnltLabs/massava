'use client';

import React from 'react';
import { motion } from 'framer-motion';
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

  const nextSteps = [
    {
      icon: Calendar,
      title: 'Add Services',
      description: 'Create your service offerings and pricing',
    },
    {
      icon: LayoutDashboard,
      title: 'Customize Your Profile',
      description: 'Add photos and complete your studio profile',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Animated Checkmark */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="w-20 h-20 rounded-full bg-terracotta-100 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.4,
            }}
          >
            <CheckCircle2 className="h-10 w-10 text-terracotta-600" />
          </motion.div>
        </motion.div>
      </div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-3"
      >
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to Massava!
        </h2>
        <p className="text-base text-gray-600">
          <span className="font-semibold text-terracotta-600">{studioName}</span> has been
          successfully registered
        </p>
      </motion.div>

      {/* What's Next Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 text-center">
          What&apos;s next?
        </h3>

        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 + index * 0.1 }}
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
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="space-y-3"
      >
        <Button
          onClick={onAddService}
          className="w-full h-12 bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium rounded-xl transition-colors"
        >
          Add Your First Service
        </Button>

        <Button
          onClick={onGoToDashboard}
          variant="outline"
          className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-colors"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
