/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * ContextualPushPrompt Component Tests
 *
 * Tests cover:
 * - Hook initialization and state
 * - Trigger logic and conditions
 * - Dismissal handling and localStorage
 * - Push enabled detection
 * - Browser support detection
 * - Permission status handling
 * - Component rendering with dialog
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import {
  useContextualPushPrompt,
  ContextualPushPrompt,
  clearAllDismissals,
  type PushPromptTrigger,
} from '@/components/notifications/ContextualPushPrompt';

// Mock dependencies
jest.mock('@/hooks/usePushRegistration', () => ({
  usePushRegistration: jest.fn(),
}));

jest.mock('@/hooks/useNotificationContext', () => ({
  useNotificationContext: jest.fn(),
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
          <div>GDPR Dialog</div>
          <div data-testid="trigger">{trigger}</div>
          <div data-testid="user-role">{userRole}</div>
          <button onClick={onClose}>Close</button>
        </>
      )}
    </div>
  ),
}));

// Import mocked hooks
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useNotificationContext } from '@/hooks/useNotificationContext';

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

describe('useContextualPushPrompt Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();

    // Default mock implementations
    (usePushRegistration as jest.Mock).mockReturnValue({
      isSupported: true,
      isRegistered: false,
      permissionStatus: 'default',
    });

    (useNotificationContext as jest.Mock).mockReturnValue({
      context: 'CUSTOMER',
      isStudioOwner: false,
      isCustomer: true,
      isDualRole: false,
      isLoading: false,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useContextualPushPrompt());

      expect(result.current.showPrompt).toBe(false);
      expect(result.current.currentTrigger).toBe(null);
      expect(result.current.isPushEnabled).toBe(false);
      expect(result.current.isChecking).toBe(true); // default permission = checking
    });

    it('should detect when push is already enabled', () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: true,
        isRegistered: true,
        permissionStatus: 'granted',
      });

      const { result } = renderHook(() => useContextualPushPrompt());

      expect(result.current.isPushEnabled).toBe(true);
      expect(result.current.isChecking).toBe(false);
    });

    it('should detect when browser does not support push', () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: false,
        isRegistered: false,
        permissionStatus: 'unavailable',
      });

      const { result } = renderHook(() => useContextualPushPrompt());

      expect(result.current.isChecking).toBe(false);
    });
  });

  describe('Trigger Logic', () => {
    it('should show prompt when trigger is called with valid conditions', () => {
      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(true);
      expect(result.current.currentTrigger).toBe('FIRST_BOOKING');
    });

    it('should not show prompt if push is already enabled', () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: true,
        isRegistered: true,
        permissionStatus: 'granted',
      });

      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(false);
      expect(result.current.currentTrigger).toBe(null);
    });

    it('should not show prompt if permission was denied', () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: true,
        isRegistered: false,
        permissionStatus: 'denied',
      });

      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(false);
    });

    it('should not show prompt if browser does not support push', () => {
      (usePushRegistration as jest.Mock).mockReturnValue({
        isSupported: false,
        isRegistered: false,
        permissionStatus: 'unavailable',
      });

      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(false);
    });

    it('should support all trigger types', () => {
      const triggers: PushPromptTrigger[] = [
        'FIRST_BOOKING',
        'FIRST_REQUEST',
        'ONBOARDING',
        'SETTINGS',
      ];

      triggers.forEach((trigger) => {
        const { result } = renderHook(() => useContextualPushPrompt());

        act(() => {
          result.current.triggerPrompt(trigger);
        });

        expect(result.current.currentTrigger).toBe(trigger);
        expect(result.current.showPrompt).toBe(true);
      });
    });
  });

  describe('Dismissal Handling', () => {
    it('should store dismissal in localStorage when dismissed', () => {
      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(true);

      act(() => {
        result.current.dismissPrompt();
      });

      expect(result.current.showPrompt).toBe(false);
      expect(localStorageMock.getItem('push-prompt-dismissed-first_booking')).toBeTruthy();
    });

    it('should not show prompt again if recently dismissed', () => {
      const now = new Date().toISOString();
      localStorageMock.setItem('push-prompt-dismissed-first_booking', now);

      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(false);
    });

    it('should show prompt again after 30 days', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      localStorageMock.setItem(
        'push-prompt-dismissed-first_booking',
        thirtyOneDaysAgo.toISOString()
      );

      const { result } = renderHook(() => useContextualPushPrompt());

      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(true);
    });

    it('should track dismissals per trigger type independently', () => {
      // Dismiss FIRST_BOOKING
      localStorageMock.setItem(
        'push-prompt-dismissed-first_booking',
        new Date().toISOString()
      );

      const { result } = renderHook(() => useContextualPushPrompt());

      // FIRST_BOOKING should be blocked
      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });
      expect(result.current.showPrompt).toBe(false);

      // But ONBOARDING should still work
      act(() => {
        result.current.triggerPrompt('ONBOARDING');
      });
      expect(result.current.showPrompt).toBe(true);
      expect(result.current.currentTrigger).toBe('ONBOARDING');
    });

    it('should clear all dismissals with utility function', () => {
      // Set multiple dismissals
      localStorageMock.setItem('push-prompt-dismissed-first_booking', new Date().toISOString());
      localStorageMock.setItem('push-prompt-dismissed-onboarding', new Date().toISOString());
      localStorageMock.setItem('push-prompt-dismissed-settings', new Date().toISOString());

      clearAllDismissals();

      expect(localStorageMock.getItem('push-prompt-dismissed-first_booking')).toBe(null);
      expect(localStorageMock.getItem('push-prompt-dismissed-onboarding')).toBe(null);
      expect(localStorageMock.getItem('push-prompt-dismissed-settings')).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() => useContextualPushPrompt());

      // Should not throw
      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
        result.current.dismissPrompt();
      });

      localStorageMock.setItem = originalSetItem;
    });

    it('should handle invalid dismissal dates in localStorage', () => {
      localStorageMock.setItem('push-prompt-dismissed-first_booking', 'invalid-date');

      const { result } = renderHook(() => useContextualPushPrompt());

      // Should treat invalid date as not dismissed
      act(() => {
        result.current.triggerPrompt('FIRST_BOOKING');
      });

      expect(result.current.showPrompt).toBe(true);
    });
  });
});

describe('ContextualPushPrompt Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();

    (usePushRegistration as jest.Mock).mockReturnValue({
      isSupported: true,
      isRegistered: false,
      permissionStatus: 'default',
    });

    (useNotificationContext as jest.Mock).mockReturnValue({
      context: 'CUSTOMER',
      isStudioOwner: false,
      isCustomer: true,
      isDualRole: false,
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <ContextualPushPrompt>
          <div>Test Child</div>
        </ContextualPushPrompt>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should not render dialog when not triggered', () => {
      render(<ContextualPushPrompt />);

      expect(screen.queryByTestId('gdpr-dialog')).toBeInTheDocument();
      expect(screen.queryByText('GDPR Dialog')).not.toBeInTheDocument();
    });

    it('should render dialog with correct trigger when prompted', () => {
      const TestComponent = () => {
        const { triggerPrompt } = useContextualPushPrompt();

        React.useEffect(() => {
          triggerPrompt('FIRST_BOOKING');
        }, []);

        return <ContextualPushPrompt />;
      };

      render(<TestComponent />);

      waitFor(() => {
        expect(screen.getByText('GDPR Dialog')).toBeInTheDocument();
        expect(screen.getByTestId('trigger')).toHaveTextContent('FIRST_BOOKING');
      });
    });

    it('should pass correct user role to dialog (CUSTOMER)', () => {
      const TestComponent = () => {
        const { triggerPrompt } = useContextualPushPrompt();

        React.useEffect(() => {
          triggerPrompt('FIRST_BOOKING');
        }, []);

        return <ContextualPushPrompt />;
      };

      render(<TestComponent />);

      waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('CUSTOMER');
      });
    });

    it('should pass correct user role to dialog (STUDIO_OWNER)', () => {
      (useNotificationContext as jest.Mock).mockReturnValue({
        context: 'STUDIO_OWNER',
        isStudioOwner: true,
        isCustomer: false,
        isDualRole: false,
        isLoading: false,
      });

      const TestComponent = () => {
        const { triggerPrompt } = useContextualPushPrompt();

        React.useEffect(() => {
          triggerPrompt('FIRST_REQUEST');
        }, []);

        return <ContextualPushPrompt />;
      };

      render(<TestComponent />);

      waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('STUDIO_OWNER');
      });
    });
  });

  describe('Dialog Interactions', () => {
    it('should close dialog and store dismissal when close button clicked', () => {
      const TestComponent = () => {
        const { triggerPrompt } = useContextualPushPrompt();

        React.useEffect(() => {
          triggerPrompt('FIRST_BOOKING');
        }, []);

        return <ContextualPushPrompt />;
      };

      render(<TestComponent />);

      waitFor(() => {
        const closeButton = screen.getByText('Close');
        closeButton.click();

        expect(screen.queryByText('GDPR Dialog')).not.toBeInTheDocument();
        expect(localStorageMock.getItem('push-prompt-dismissed-first_booking')).toBeTruthy();
      });
    });
  });
});
