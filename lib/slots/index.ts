/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Dynamic Slots - Public API
 *
 * Exports all slot-related functionality for easy importing.
 */

// Slot utilities
export {
  normalizeToGrid,
  isOnGrid,
  getNextGridSlot,
  getPreviousGridSlot,
  generateDayTimeSlots,
  getTimeDifferenceMinutes,
  isTimeInRange,
  isValidTimeFormat,
  addMinutes,
  GRID_INTERVAL_MINUTES,
} from './slot-utils';

// Dynamic availability
export {
  calculateAvailableSlots,
  type AvailableSlot,
  type SlotCalculationOptions,
  type SlotCalculationError,
} from './dynamic-availability';

// Capacity validation
export {
  checkSlotCapacity,
  createBookingWithCapacityCheck,
  batchCheckCapacity,
  type BookingData,
  type CapacityError,
  type CapacityCheckResult,
} from './capacity-validator';
