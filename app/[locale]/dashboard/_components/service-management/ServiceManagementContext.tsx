/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Management Context
 * State management for multi-step service creation/edit flow
 */

'use client';

import React from 'react';
import { createContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import type {
  ServiceNameFormData,
  ServiceDurationFormData,
  ServicePriceFormData,
} from './validation/serviceSchemas';

/**
 * Service Management State
 */
export interface ServiceManagementState {
  currentStep: number;
  formData: {
    name: string;
    duration: number;
    price: number;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  serviceId?: string;
  mode: 'create' | 'edit';
}

/**
 * Actions
 */
type ServiceManagementAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_NAME'; payload: string }
  | { type: 'UPDATE_DURATION'; payload: number }
  | { type: 'UPDATE_PRICE'; payload: number }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SERVICE_ID'; payload: string }
  | { type: 'SET_MODE'; payload: 'create' | 'edit' }
  | { type: 'LOAD_SERVICE'; payload: { name: string; duration: number; price: number; serviceId: string } }
  | { type: 'RESET' };

/**
 * Context Value
 */
interface ServiceManagementContextValue {
  state: ServiceManagementState;
  dispatch: React.Dispatch<ServiceManagementAction>;
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateName: (name: string) => void;
  updateDuration: (duration: number) => void;
  updatePrice: (price: number) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setServiceId: (serviceId: string) => void;
  setMode: (mode: 'create' | 'edit') => void;
  loadService: (data: { name: string; duration: number; price: number; serviceId: string }) => void;
  reset: () => void;
}

/**
 * Initial State
 */
const initialState: ServiceManagementState = {
  currentStep: 0,
  formData: {
    name: '',
    duration: 60,
    price: 50,
  },
  errors: {},
  isSubmitting: false,
  mode: 'create',
};

/**
 * Reducer
 */
function serviceManagementReducer(
  state: ServiceManagementState,
  action: ServiceManagementAction
): ServiceManagementState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        errors: {}, // Clear errors when changing steps
      };

    case 'UPDATE_NAME':
      return {
        ...state,
        formData: {
          ...state.formData,
          name: action.payload,
        },
      };

    case 'UPDATE_DURATION':
      return {
        ...state,
        formData: {
          ...state.formData,
          duration: action.payload,
        },
      };

    case 'UPDATE_PRICE':
      return {
        ...state,
        formData: {
          ...state.formData,
          price: action.payload,
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

    case 'SET_SERVICE_ID':
      return {
        ...state,
        serviceId: action.payload,
      };

    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
      };

    case 'LOAD_SERVICE':
      return {
        ...state,
        formData: {
          name: action.payload.name,
          duration: action.payload.duration,
          price: action.payload.price,
        },
        serviceId: action.payload.serviceId,
        mode: 'edit',
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
export const ServiceManagementContext = createContext<
  ServiceManagementContextValue | undefined
>(undefined);

/**
 * Provider Component
 */
interface ServiceManagementProviderProps {
  children: ReactNode;
}

export function ServiceManagementProvider({
  children,
}: ServiceManagementProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(serviceManagementReducer, initialState);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const goToNextStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
  }, [state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.max(0, state.currentStep - 1) });
  }, [state.currentStep]);

  const updateName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_NAME', payload: name });
  }, []);

  const updateDuration = useCallback((duration: number) => {
    dispatch({ type: 'UPDATE_DURATION', payload: duration });
  }, []);

  const updatePrice = useCallback((price: number) => {
    dispatch({ type: 'UPDATE_PRICE', payload: price });
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting });
  }, []);

  const setServiceId = useCallback((serviceId: string) => {
    dispatch({ type: 'SET_SERVICE_ID', payload: serviceId });
  }, []);

  const setMode = useCallback((mode: 'create' | 'edit') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const loadService = useCallback((data: { name: string; duration: number; price: number; serviceId: string }) => {
    dispatch({ type: 'LOAD_SERVICE', payload: data });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const contextValue = useMemo<ServiceManagementContextValue>(() => ({
    state,
    dispatch,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    updateName,
    updateDuration,
    updatePrice,
    setErrors,
    setSubmitting,
    setServiceId,
    setMode,
    loadService,
    reset,
  }), [
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    updateName,
    updateDuration,
    updatePrice,
    setErrors,
    setSubmitting,
    setServiceId,
    setMode,
    loadService,
    reset,
  ]);

  return (
    <ServiceManagementContext.Provider value={contextValue}>
      {children}
    </ServiceManagementContext.Provider>
  );
}
