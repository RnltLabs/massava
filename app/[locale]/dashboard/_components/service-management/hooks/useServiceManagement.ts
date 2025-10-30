/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * useServiceManagement Hook
 * Access service management context
 */

'use client';

import { useContext } from 'react';
import { ServiceManagementContext } from '../ServiceManagementContext';

export function useServiceManagement() {
  const context = useContext(ServiceManagementContext);

  if (!context) {
    throw new Error(
      'useServiceManagement must be used within ServiceManagementProvider'
    );
  }

  return context;
}
