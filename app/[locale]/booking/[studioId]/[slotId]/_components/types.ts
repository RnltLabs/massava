/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Shared Types for Booking Components
 * Extracted to avoid circular dependencies between AuthNudgeModal and GuestCheckoutForm
 */

/**
 * Guest checkout form data
 * Used for non-authenticated users completing bookings
 */
export interface GuestFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  explicitHealthConsent: boolean;
  message?: string;
  registeredUserId?: string;  // Falls User sich gerade registriert hat
  isJustRegistered?: boolean; // Flag für Success Screen
}
