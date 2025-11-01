/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Capacity Utility Functions
 * Helper functions for parallel booking capacity management
 */

export interface CapacityStatus {
  current: number;
  max: number;
  isFull: boolean;
  percentage: number;
}

/**
 * Calculate capacity status
 */
export function getCapacityStatus(current: number, max: number): CapacityStatus {
  const isFull = current >= max;
  const percentage = Math.min(100, (current / max) * 100);

  return {
    current,
    max,
    isFull,
    percentage,
  };
}

/**
 * Format capacity display (e.g., "2/3")
 */
export function formatCapacity(current: number, max: number): string {
  return `${current}/${max}`;
}

/**
 * Get capacity badge color based on utilization
 */
export function getCapacityColor(current: number, max: number): string {
  const percentage = (current / max) * 100;

  if (percentage >= 100) return 'text-red-600 bg-red-100 border-red-200';
  if (percentage >= 75) return 'text-orange-600 bg-orange-100 border-orange-200';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  return 'text-green-600 bg-green-100 border-green-200';
}
