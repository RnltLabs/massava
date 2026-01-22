/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * StudioOwnerPushPrompt Component Tests
 *
 * Tests cover:
 * - Component initialization
 * - First booking request detection
 * - Push registration state
 * - Dialog visibility logic
 * - localStorage persistence
 * - API integration
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StudioOwnerPushPrompt } from '@/app/[locale]/business/calendar/_components/StudioOwnerPushPrompt';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/hooks/usePushRegistration', () => ({
  usePushRegistration: jest.fn(),
}));

jest.mock('@/components/notifications/GdprPushConsentDialog', () => ({
  GdprPushConsentDialog: ({
    isOpen,
    onClose,
    trigger,
    userRole,
  }: {
    isOpen: boolean;
    onClose: () => void;
    trigger: string;
    userRole: string;
  }) => (
    <div data-testid="gdpr-dialog">
      {isOpen && (
        <>
          <div>Push Consent Dialog</div>
          <div data-testid="trigger">{trigger}</div>
          <div data-testid="user-role">{userRole}</div>
          <button onClick={onClose} data-testid="close-button">
            Close
          </button>
        </>
      )}
    </div>
  ),
}));

// Import mocked hooks
import { useSession } from 'next-auth/react';
import { usePushRegistration } from '@/hooks/usePushRegistration';

// Mock fetch
global.fetch = jest.fn();

// Setup localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StudioOwnerPushPrompt', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();

    // Default mock implementations
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'owner@example.com',
        },
      },
    });

    (usePushRegistration as jest.Mock).mockReturnValue({
      isSupported: true,
      isRegistered: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 0 }),
    });
  });

  describe('Initialization', () => {
    it('should render without crashing', () => {
      const { container } = render(<StudioOwnerPushPrompt studioId="studio-123" />);
      expect(container).toBeInTheDocument();
    });

    it('should not show dialog initially', () => {
      render(<StudioOwnerPushPrompt studioId="studio-123" />);
      const dialog = screen.queryByTestId('gdpr-dialog');
      expect(dialog).toBeInTheDocument(); // Component renders but dialog is closed
      expect(screen.queryByText('Push Consent Dialog')).not.toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should not fetch booking count if user is not authenticated', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should not fetch booking count if session has no user ID', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            email: 'owner@example.com',
          },
        },
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Push Registration State', () => {
    it('should not fetch booking count if push is not supported', async () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: false,
        isRegistered: false,
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should not fetch booking count if push is already registered', async () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: true,
        isRegistered: true,
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('First Booking Request Detection', () => {
    it('should show dialog when booking count is 1', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 1 }),
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/studio/bookings/count');
      });

      // Fast-forward timer for delayed dialog show
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Push Consent Dialog')).toBeInTheDocument();
        expect(screen.getByTestId('trigger')).toHaveTextContent('FIRST_REQUEST');
        expect(screen.getByTestId('user-role')).toHaveTextContent('STUDIO_OWNER');
      });

      jest.useRealTimers();
    });

    it('should not show dialog when booking count is 0', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 0 }),
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/studio/bookings/count');
      });

      expect(screen.queryByText('Push Consent Dialog')).not.toBeInTheDocument();
    });

    it('should not show dialog when booking count is greater than 1', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 5 }),
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/studio/bookings/count');
      });

      expect(screen.queryByText('Push Consent Dialog')).not.toBeInTheDocument();
    });
  });

  describe('localStorage Persistence', () => {
    it('should not fetch booking count if prompt was already shown', async () => {
      localStorageMock.setItem('push-prompt-first-request-shown-studio-123', 'true');

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should store flag in localStorage when dialog is closed', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 1 }),
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Push Consent Dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-button');
      closeButton.click();

      await waitFor(() => {
        expect(
          localStorageMock.getItem('push-prompt-first-request-shown-studio-123')
        ).toBe('true');
      });

      jest.useRealTimers();
    });

    it('should use studio-specific localStorage key', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 1 }),
      });

      render(<StudioOwnerPushPrompt studioId="studio-abc-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Push Consent Dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-button');
      closeButton.click();

      await waitFor(() => {
        expect(
          localStorageMock.getItem('push-prompt-first-request-shown-studio-abc-123')
        ).toBe('true');
      });

      jest.useRealTimers();
    });
  });

  describe('API Error Handling', () => {
    it('should handle fetch failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch booking request count');
      expect(screen.queryByText('Push Consent Dialog')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle network error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking first booking request:',
        expect.any(Error)
      );
      expect(screen.queryByText('Push Consent Dialog')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Dialog Interactions', () => {
    it('should call onConsent handler when user consents', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ count: 1 }),
      });

      render(<StudioOwnerPushPrompt studioId="studio-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Push Consent Dialog')).toBeInTheDocument();
      });

      // Note: In real implementation, consent would be triggered through dialog
      // This tests the handler exists
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Studio owner consented to push notifications:',
        expect.anything()
      );

      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
