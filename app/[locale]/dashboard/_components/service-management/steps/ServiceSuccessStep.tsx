/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Success Step (Step 5/5)
 * Success confirmation with animation
 */

'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface ServiceSuccessStepProps {
  studioId: string;
  onClose: () => void;
}

export function ServiceSuccessStep({
  studioId,
  onClose,
}: ServiceSuccessStepProps): React.JSX.Element {
  // Auto-close after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="space-y-6 py-8">
      {/* Animated Check Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="flex justify-center"
      >
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-16 w-16 text-white" />
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h2 className="text-2xl font-bold text-foreground">Geschafft!</h2>
        <p className="text-muted-foreground">
          Dein Service wurde erfolgreich gespeichert.
        </p>
      </motion.div>

      {/* Close Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={onClose}
          style={{ backgroundColor: '#B56550' }}
          className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90"
        >
          Fertig
        </Button>
      </motion.div>
    </div>
  );
}
