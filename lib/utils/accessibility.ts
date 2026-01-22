/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Accessibility utilities for WCAG 2.1 AA compliance
 *
 * @module lib/utils/accessibility
 */

/**
 * Generates a unique ID for ARIA relationships
 * Used for aria-labelledby, aria-describedby, etc.
 *
 * @param prefix - A semantic prefix describing the element type
 * @returns A unique ID string
 *
 * @example
 * ```typescript
 * const titleId = generateAriaId('dialog-title');
 * // Returns: 'dialog-title-abc123xyz'
 * ```
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Tailwind CSS classes for screen reader only content
 * Makes content invisible but accessible to screen readers
 */
export const srOnly =
  'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * Focus ring styles for keyboard navigation
 * Provides visible focus indicators for accessibility
 */
export const focusRingStyles =
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B56550]';

/**
 * Focus ring styles for elements on colored backgrounds
 * Uses white ring color for better contrast
 */
export const focusRingOnColor =
  'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#B56550]';

/**
 * Announces a message to screen readers using a live region
 *
 * Creates a temporary DOM element with aria-live to announce
 * dynamic content changes to assistive technologies.
 *
 * @param message - The message to announce
 * @param priority - 'polite' waits for user idle, 'assertive' interrupts immediately
 *
 * @example
 * ```typescript
 * // Announce form submission success
 * announceToScreenReader('Einstellungen gespeichert', 'polite');
 *
 * // Announce urgent error
 * announceToScreenReader('Fehler: Verbindung verloren', 'assertive');
 * ```
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = srOnly;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement has been read
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Checks if an element is focusable
 *
 * @param element - The DOM element to check
 * @returns true if the element can receive focus
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  return focusableSelectors.some((selector) => element.matches(selector));
}

/**
 * Gets all focusable elements within a container
 *
 * @param container - The container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Traps focus within a container element
 * Useful for modal dialogs and popups
 *
 * @param container - The container element to trap focus within
 * @returns Cleanup function to remove the trap
 *
 * @example
 * ```typescript
 * const cleanup = trapFocus(dialogRef.current);
 * // When dialog closes:
 * cleanup();
 * ```
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab: going backwards
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * ARIA roles for common UI patterns
 */
export const AriaRoles = {
  /** For notification banners that require user action */
  ALERT_DIALOG: 'alertdialog',
  /** For status messages that don't require action */
  ALERT: 'alert',
  /** For modal dialogs */
  DIALOG: 'dialog',
  /** For navigation menus */
  NAVIGATION: 'navigation',
  /** For grouped form controls */
  GROUP: 'group',
  /** For status updates */
  STATUS: 'status',
  /** For loading indicators */
  PROGRESSBAR: 'progressbar',
} as const;

/**
 * Default aria-live region priorities
 */
export const AriaLive = {
  /** Non-critical updates, announced when user is idle */
  POLITE: 'polite',
  /** Critical updates, announced immediately */
  ASSERTIVE: 'assertive',
  /** Disabled live region */
  OFF: 'off',
} as const;
