/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Simple Toaster Component
 * Displays toast notifications at the bottom of the screen
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Extend Window interface for toast listener
declare global {
  interface Window {
    __toastListener?: (toast: Toast) => void;
  }
}

export function Toaster(): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Simple global toast listener (replace with proper context in production)
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };

    // This is a simple implementation - in production, use React Context
    window.__toastListener = listener;

    return () => {
      delete window.__toastListener;
    };
  }, []);

  const removeToast = (id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <Alert
              variant={toast.variant}
              className="relative pr-10 shadow-lg"
            >
              <div className="flex items-start gap-2">
                {toast.variant === 'destructive' ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertTitle className="mb-1">{toast.title}</AlertTitle>
                  {toast.description && (
                    <AlertDescription>{toast.description}</AlertDescription>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
