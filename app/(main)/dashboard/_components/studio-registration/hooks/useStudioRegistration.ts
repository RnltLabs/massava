'use client';

import { useContext } from 'react';
import { StudioRegistrationContext } from '../StudioRegistrationContext';

/**
 * Custom hook to access Studio Registration context
 *
 * @throws Error if used outside of StudioRegistrationProvider
 */
export function useStudioRegistration() {
  const context = useContext(StudioRegistrationContext);

  if (!context) {
    throw new Error(
      'useStudioRegistration must be used within a StudioRegistrationProvider'
    );
  }

  return context;
}
