/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Quick Add Booking Context
 * State management for multi-step booking creation flow
 */

'use client';

import React, { createContext, useReducer, useMemo, useCallback, type ReactNode } from 'react';

/**
 * Booking State
 */
export interface QuickAddBookingState {
  currentStep: number;
  formData: {
    customerName?: string;
    customerPhone?: string;
    serviceId?: string;
    date?: string; // YYYY-MM-DD
    time?: string; // HH:mm
    notes?: string;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  bookingId?: string;
}

/**
 * Actions
 */
type QuickAddBookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_CONTACT_INFO'; payload: { name: string; phone: string } }
  | { type: 'SET_SERVICE'; payload: string }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_TIME'; payload: string }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_BOOKING_ID'; payload: string }
  | { type: 'RESET' };

/**
 * Context Value
 */
interface QuickAddBookingContextValue {
  state: QuickAddBookingState;
  dispatch: React.Dispatch<QuickAddBookingAction>;
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setContactInfo: (name: string, phone: string) => void;
  setService: (serviceId: string) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setNotes: (notes: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setBookingId: (bookingId: string) => void;
  reset: () => void;
}

/**
 * Initial State
 */
const initialState: QuickAddBookingState = {
  currentStep: 0,
  formData: {},
  errors: {},
  isSubmitting: false,
};

/**
 * Reducer
 */
function quickAddBookingReducer(
  state: QuickAddBookingState,
  action: QuickAddBookingAction
): QuickAddBookingState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        errors: {}, // Clear errors when changing steps
      };

    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: state.currentStep + 1,
        errors: {},
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
        errors: {},
      };

    case 'SET_CONTACT_INFO':
      return {
        ...state,
        formData: {
          ...state.formData,
          customerName: action.payload.name,
          customerPhone: action.payload.phone,
        },
      };

    case 'SET_SERVICE':
      return {
        ...state,
        formData: {
          ...state.formData,
          serviceId: action.payload,
        },
      };

    case 'SET_DATE':
      return {
        ...state,
        formData: {
          ...state.formData,
          date: action.payload,
        },
      };

    case 'SET_TIME':
      return {
        ...state,
        formData: {
          ...state.formData,
          time: action.payload,
        },
      };

    case 'SET_NOTES':
      return {
        ...state,
        formData: {
          ...state.formData,
          notes: action.payload,
        },
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case 'SET_BOOKING_ID':
      return {
        ...state,
        bookingId: action.payload,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * Create Context
 */
export const QuickAddBookingContext = createContext<
  QuickAddBookingContextValue | undefined
>(undefined);

/**
 * Provider Component
 */
interface QuickAddBookingProviderProps {
  children: ReactNode;
}

export function QuickAddBookingProvider({
  children,
}: QuickAddBookingProviderProps): React.JSX.Element {
  console.log('🟡 [Provider] RENDER');

  const [state, dispatch] = useReducer(quickAddBookingReducer, initialState);

  console.log('📦 [Provider] State:', {
    currentStep: state.currentStep,
    formData: state.formData,
    isSubmitting: state.isSubmitting,
  });

  // Memoize all callback functions to prevent unnecessary re-renders
  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const goToNextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const goToPreviousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const setContactInfo = useCallback((name: string, phone: string) => {
    dispatch({ type: 'SET_CONTACT_INFO', payload: { name, phone } });
  }, []);

  const setService = useCallback((serviceId: string) => {
    dispatch({ type: 'SET_SERVICE', payload: serviceId });
  }, []);

  const setDate = useCallback((date: string) => {
    dispatch({ type: 'SET_DATE', payload: date });
  }, []);

  const setTime = useCallback((time: string) => {
    dispatch({ type: 'SET_TIME', payload: time });
  }, []);

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: notes });
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    console.log('🚨 [Provider] setErrors called:', errors);
    dispatch({ type: 'SET_ERRORS', payload: errors });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting });
  }, []);

  const setBookingId = useCallback((bookingId: string) => {
    dispatch({ type: 'SET_BOOKING_ID', payload: bookingId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Memoize the entire context value
  // IMPORTANT: Only state is in dependencies - all callbacks are stable (useCallback with [])
  // This prevents infinite loops from callbacks being recreated on every render
  const contextValue = useMemo<QuickAddBookingContextValue>(
    () => ({
      state,
      dispatch,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      setContactInfo,
      setService,
      setDate,
      setTime,
      setNotes,
      setErrors,
      setSubmitting,
      setBookingId,
      reset,
    }),
    [state] // Only state changes should recreate the context value
  );

  return (
    <QuickAddBookingContext.Provider value={contextValue}>
      {children}
    </QuickAddBookingContext.Provider>
  );
}

/**
 * Custom Hook
 */
export function useQuickAddBooking(): QuickAddBookingContextValue {
  const context = React.useContext(QuickAddBookingContext);
  if (!context) {
    throw new Error('useQuickAddBooking must be used within QuickAddBookingProvider');
  }
  return context;
}
