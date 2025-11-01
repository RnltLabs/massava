/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Simple Toast Hook
 * Provides toast notifications for user feedback
 */

'use client';

import { useCallback } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

// Extend Window interface for toast listener
declare global {
  interface Window {
    __toastListener?: (toast: Toast) => void;
  }
}

let toastId = 0;

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${toastId++}`;
    const newToast: Toast = {
      id,
      variant: options.variant || 'default',
      ...options,
    };

    // Call global toast listener (set by Toaster component)
    if (typeof window !== 'undefined' && window.__toastListener) {
      window.__toastListener(newToast);
    }

    return { id };
  }, []);

  return { toast };
}
