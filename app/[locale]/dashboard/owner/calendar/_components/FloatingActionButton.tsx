/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Floating Action Button (FAB)
 * Quick access button for calendar actions (booking, blocking)
 */

'use client';

import React, { useState } from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QuickAddBookingDialog } from './booking-management/QuickAddBookingDialog';
import { BlockTimeDialog } from './BlockTimeDialog';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

interface FloatingActionButtonProps {
  studioId: string;
  services: Service[];
  initialDate?: Date;
  onBookingSuccess?: () => void;
  onBlockTime?: () => void;
}

export function FloatingActionButton({
  studioId,
  services,
  initialDate,
  onBookingSuccess,
  onBlockTime,
}: FloatingActionButtonProps): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const handleMainButtonClick = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleBookAppointment = (): void => {
    setIsMenuOpen(false);
    setShowBookingDialog(true);
  };

  const handleBlockTime = (): void => {
    setIsMenuOpen(false);
    setShowBlockDialog(true);
    onBlockTime?.();
  };

  const handleBookingSuccess = (): void => {
    setShowBookingDialog(false);
    onBookingSuccess?.();
  };

  return (
    <>
      {/* FAB Menu */}
      <div className="fixed bottom-20 right-4 md:bottom-6 z-40">
        {/* Action Menu Items */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
            >
              {/* Book Appointment */}
              <button
                onClick={handleBookAppointment}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium whitespace-nowrap">Termin buchen</span>
              </button>

              {/* Block Time */}
              <button
                onClick={handleBlockTime}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
              >
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="font-medium whitespace-nowrap">Zeit blockieren</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={handleMainButtonClick}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
            'hover:shadow-xl active:scale-95',
            isMenuOpen
              ? 'bg-gray-800 dark:bg-gray-200'
              : 'bg-[#B56550] hover:opacity-90'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className={cn(
              'h-7 w-7',
              isMenuOpen ? 'text-white dark:text-gray-900' : 'text-white'
            )} />
          </motion.div>
        </motion.button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/20 z-30"
          />
        )}
      </AnimatePresence>

      {/* Quick Add Booking Dialog */}
      <QuickAddBookingDialog
        isOpen={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        studioId={studioId}
        services={services}
        initialDate={initialDate}
        onSuccess={handleBookingSuccess}
      />

      {/* Block Time Dialog */}
      <BlockTimeDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        studioId={studioId}
        selectedDate={initialDate || new Date()}
      />
    </>
  );
}
