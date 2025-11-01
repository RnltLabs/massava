'use client';

import React from 'react';
import { createContext, useReducer, type ReactNode } from 'react';
import type {
  BasicInfoFormData,
  AddressFormData,
  ContactFormData,
} from './validation/studioSchemas';
import type { OpeningHoursFormData } from './validation/openingHoursSchema';

/**
 * Studio Registration State
 */
export interface StudioRegistrationState {
  currentStep: number;
  formData: {
    basicInfo: Partial<BasicInfoFormData>;
    address: Partial<AddressFormData>;
    contact: Partial<ContactFormData>;
    openingHours?: Partial<OpeningHoursFormData>;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  studioId?: string;
}

/**
 * Actions
 */
type StudioRegistrationAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_BASIC_INFO'; payload: Partial<BasicInfoFormData> }
  | { type: 'UPDATE_ADDRESS'; payload: Partial<AddressFormData> }
  | { type: 'UPDATE_CONTACT'; payload: Partial<ContactFormData> }
  | { type: 'UPDATE_OPENING_HOURS'; payload: Partial<OpeningHoursFormData> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_STUDIO_ID'; payload: string }
  | { type: 'RESET' };

/**
 * Context Value
 */
interface StudioRegistrationContextValue {
  state: StudioRegistrationState;
  dispatch: React.Dispatch<StudioRegistrationAction>;
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateBasicInfo: (data: Partial<BasicInfoFormData>) => void;
  updateAddress: (data: Partial<AddressFormData>) => void;
  updateContact: (data: Partial<ContactFormData>) => void;
  updateOpeningHours: (data: Partial<OpeningHoursFormData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setStudioId: (studioId: string) => void;
  reset: () => void;
}

/**
 * Initial State
 */
const initialState: StudioRegistrationState = {
  currentStep: 0,
  formData: {
    basicInfo: {},
    address: {},
    contact: {},
  },
  errors: {},
  isSubmitting: false,
};

/**
 * Reducer
 */
function studioRegistrationReducer(
  state: StudioRegistrationState,
  action: StudioRegistrationAction
): StudioRegistrationState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        errors: {}, // Clear errors when changing steps
      };

    case 'UPDATE_BASIC_INFO':
      return {
        ...state,
        formData: {
          ...state.formData,
          basicInfo: {
            ...state.formData.basicInfo,
            ...action.payload,
          },
        },
      };

    case 'UPDATE_ADDRESS':
      return {
        ...state,
        formData: {
          ...state.formData,
          address: {
            ...state.formData.address,
            ...action.payload,
          },
        },
      };

    case 'UPDATE_CONTACT':
      return {
        ...state,
        formData: {
          ...state.formData,
          contact: {
            ...state.formData.contact,
            ...action.payload,
          },
        },
      };

    case 'UPDATE_OPENING_HOURS':
      return {
        ...state,
        formData: {
          ...state.formData,
          openingHours: {
            ...state.formData.openingHours,
            ...action.payload,
          },
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

    case 'SET_STUDIO_ID':
      return {
        ...state,
        studioId: action.payload,
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
export const StudioRegistrationContext = createContext<
  StudioRegistrationContextValue | undefined
>(undefined);

/**
 * Provider Component
 */
interface StudioRegistrationProviderProps {
  children: ReactNode;
}

export function StudioRegistrationProvider({
  children,
}: StudioRegistrationProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(studioRegistrationReducer, initialState);

  const contextValue: StudioRegistrationContextValue = {
    state,
    dispatch,
    goToStep: (step: number) => {
      dispatch({ type: 'SET_STEP', payload: step });
    },
    goToNextStep: () => {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    },
    goToPreviousStep: () => {
      dispatch({ type: 'SET_STEP', payload: Math.max(0, state.currentStep - 1) });
    },
    updateBasicInfo: (data: Partial<BasicInfoFormData>) => {
      dispatch({ type: 'UPDATE_BASIC_INFO', payload: data });
    },
    updateAddress: (data: Partial<AddressFormData>) => {
      dispatch({ type: 'UPDATE_ADDRESS', payload: data });
    },
    updateContact: (data: Partial<ContactFormData>) => {
      dispatch({ type: 'UPDATE_CONTACT', payload: data });
    },
    updateOpeningHours: (data: Partial<OpeningHoursFormData>) => {
      dispatch({ type: 'UPDATE_OPENING_HOURS', payload: data });
    },
    setErrors: (errors: Record<string, string>) => {
      dispatch({ type: 'SET_ERRORS', payload: errors });
    },
    setSubmitting: (isSubmitting: boolean) => {
      dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting });
    },
    setStudioId: (studioId: string) => {
      dispatch({ type: 'SET_STUDIO_ID', payload: studioId });
    },
    reset: () => {
      dispatch({ type: 'RESET' });
    },
  };

  return (
    <StudioRegistrationContext.Provider value={contextValue}>
      {children}
    </StudioRegistrationContext.Provider>
  );
}
