/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Success Step (Step 5/5)
 * Show success confirmation with animation
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useQuickAddBooking } from '../QuickAddBookingContext';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';

interface SuccessStepProps {
  onClose: () => void;
  onAddAnother?: () => void;
}

export function SuccessStep({ onClose, onAddAnother }: SuccessStepProps): React.JSX.Element {
  const { state, reset } = useQuickAddBooking();

  const handleAddAnother = (): void => {
    reset();
    onAddAnother?.();
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      return format(date, 'EEE, d. MMM yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const customerName = state.formData.customerName;

  return (
    <div className="space-y-6 py-8">
      {/* Animated Success Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="flex justify-center"
      >
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-3"
      >
        <h2 className="text-2xl font-bold text-foreground">Termin gebucht!</h2>
        <p className="text-muted-foreground">
          Der Termin wurde erfolgreich erstellt
        </p>
      </motion.div>

      {/* Booking Details Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-muted rounded-xl p-6 space-y-2 text-center"
      >
        <p className="text-lg font-semibold text-foreground">{customerName}</p>
        {state.formData.date && state.formData.time && (
          <p className="text-muted-foreground">
            {formatDate(state.formData.date)} um {state.formData.time}
          </p>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <Button
          onClick={handleClose}
          style={{ backgroundColor: '#B56550' }}
          className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90"
        >
          Zum Kalender
        </Button>

        <Button
          onClick={handleAddAnother}
          variant="outline"
          className="w-full h-12"
        >
          Weiteren Termin anlegen
        </Button>
      </motion.div>
    </div>
  );
}
