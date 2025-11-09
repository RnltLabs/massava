/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import type { StudioRegistrationState } from '@/app/[locale]/dashboard/_components/studio-registration/StudioRegistrationContext';

/**
 * Storage keys for localStorage
 */
const DRAFT_KEY = 'massava_studio_registration_draft';
const DRAFT_TIMESTAMP_KEY = 'massava_studio_registration_draft_timestamp';

/**
 * Draft version for future schema migrations
 */
const DRAFT_VERSION = 1;

/**
 * Draft expiry time in milliseconds (7 days)
 */
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Registration draft interface
 */
export interface RegistrationDraft {
  formData: StudioRegistrationState['formData'];
  currentStep: number;
  timestamp: number;
  version: number;
}

/**
 * Check if localStorage is available (browser only)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Save registration draft to localStorage
 * Does not save images (File objects cannot be serialized)
 */
export function saveDraft(state: StudioRegistrationState): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const draft: RegistrationDraft = {
      formData: {
        ...state.formData,
        // Don't save images (File objects can't be serialized)
        images: undefined,
      },
      currentStep: state.currentStep,
      timestamp: Date.now(),
      version: DRAFT_VERSION,
    };

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    window.localStorage.setItem(DRAFT_TIMESTAMP_KEY, String(draft.timestamp));
  } catch (error) {
    // Fail silently - don't block user flow
    console.error('Failed to save registration draft:', error);
  }
}

/**
 * Load registration draft from localStorage
 * Returns null if draft doesn't exist, is expired, or is invalid
 */
export function loadDraft(): RegistrationDraft | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const draftJson = window.localStorage.getItem(DRAFT_KEY);
    if (!draftJson) {
      return null;
    }

    const draft = JSON.parse(draftJson) as RegistrationDraft;

    // Validate draft structure
    if (
      !draft ||
      typeof draft !== 'object' ||
      !draft.formData ||
      typeof draft.currentStep !== 'number' ||
      typeof draft.timestamp !== 'number' ||
      typeof draft.version !== 'number'
    ) {
      clearDraft();
      return null;
    }

    // Check if draft is expired
    const age = Date.now() - draft.timestamp;
    if (age > DRAFT_EXPIRY_MS) {
      clearDraft();
      return null;
    }

    // Check version compatibility (for future migrations)
    if (draft.version !== DRAFT_VERSION) {
      clearDraft();
      return null;
    }

    return draft;
  } catch (error) {
    // Corrupted data - clear it
    clearDraft();
    return null;
  }
}

/**
 * Clear registration draft from localStorage
 */
export function clearDraft(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear registration draft:', error);
  }
}

/**
 * Check if a valid draft exists
 */
export function hasDraft(): boolean {
  return loadDraft() !== null;
}

/**
 * Get human-readable draft age
 * Returns strings like "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function getDraftAge(): string | null {
  const draft = loadDraft();
  if (!draft) {
    return null;
  }

  const ageMs = Date.now() - draft.timestamp;
  const ageMinutes = Math.floor(ageMs / (60 * 1000));
  const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  if (ageMinutes < 1) {
    return 'just now';
  } else if (ageMinutes < 60) {
    return `${ageMinutes} ${ageMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (ageHours < 24) {
    return `${ageHours} ${ageHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${ageDays} ${ageDays === 1 ? 'day' : 'days'} ago`;
  }
}
