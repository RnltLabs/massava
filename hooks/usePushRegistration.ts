/**
 * Push Registration Hook
 *
 * Manages Firebase Cloud Messaging registration and permission handling for web browsers.
 * Handles permission requests, token registration, foreground messages, and cleanup.
 *
 * Uses Optimistic UI pattern for immediate user feedback:
 * 1. Permission request (blocking) - User must grant browser permission
 * 2. Device registration (background) - FCM token registration happens async
 * 3. Rollback on failure - Reverts state if backend registration fails
 *
 * @module hooks/usePushRegistration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isPushAvailable,
  getPushPermissionStatus,
  requestPushPermission,
  onForegroundMessage,
} from '@/lib/firebase/firebase-client';

/**
 * Registration phase for optimistic UI
 */
type RegistrationPhase = 'idle' | 'requesting_permission' | 'registering_device';

/**
 * Return value of usePushRegistration hook
 *
 * @interface UsePushRegistrationReturn
 * @property {boolean} isSupported - Whether browser supports push notifications
 * @property {boolean} isRegistered - Whether push is currently registered
 * @property {boolean} isRegistering - Whether registration is in progress
 * @property {RegistrationPhase} registrationPhase - Current phase of registration
 * @property {NotificationPermission | 'unavailable'} permissionStatus - Current permission state
 * @property {string | null} error - Last registration error message
 * @property {boolean} showPrePermission - Whether to show pre-permission dialog
 * @property {(show: boolean) => void} setShowPrePermission - Set pre-permission dialog state
 * @property {() => Promise<boolean>} register - Request permission and register
 * @property {() => Promise<boolean>} unregister - Unregister and remove token
 */
interface UsePushRegistrationReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isRegistering: boolean;
  registrationPhase: RegistrationPhase;
  permissionStatus: NotificationPermission | 'unavailable';
  error: string | null;
  showPrePermission: boolean;
  setShowPrePermission: (show: boolean) => void;
  register: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
}

/**
 * Hook to manage push notification registration for web browsers
 *
 * Handles the complete push notification registration lifecycle:
 * - Detects browser support for push notifications
 * - Checks current permission status
 * - Requests user permission when needed
 * - Registers device token with backend
 * - Manages foreground message listeners
 * - Provides register/unregister functions
 *
 * The hook automatically sets up foreground message listeners and shows
 * browser notifications when messages arrive while the app is open.
 *
 * @returns {UsePushRegistrationReturn} State and control functions
 *
 * @example
 * ```typescript
 * // In a React component
 * export function NotificationSettings() {
 *   const {
 *     isSupported,
 *     isRegistered,
 *     permissionStatus,
 *     error,
 *     register,
 *     unregister,
 *   } = usePushRegistration();
 *
 *   if (!isSupported) {
 *     return <p>Push notifications not supported in your browser</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Status: {permissionStatus}</p>
 *       {isRegistered ? (
 *         <button onClick={unregister}>Disable Push Notifications</button>
 *       ) : (
 *         <button onClick={register}>Enable Push Notifications</button>
 *       )}
 *       {error && <p className="error">{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link useNotificationSSE} - Real-time notification streaming
 */
export function usePushRegistration(): UsePushRegistrationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationPhase, setRegistrationPhase] = useState<RegistrationPhase>('idle');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unavailable'>('default');
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showPrePermission, setShowPrePermission] = useState(false);

  // Ref to track if rollback is needed
  const shouldRollbackRef = useRef(false);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = (): void => {
      const supported = isPushAvailable();
      const permStatus = supported ? getPushPermissionStatus() : 'unavailable';

      setIsSupported(supported);
      setPermissionStatus(permStatus);
    };

    checkSupport();
  }, []);

  // Check if already registered (has device token in backend)
  useEffect(() => {
    const checkRegistration = async (): Promise<void> => {
      if (!isSupported || permissionStatus !== 'granted') return;

      try {
        const response = await fetch('/api/notifications/devices');
        if (response.ok) {
          const { devices } = await response.json();
          const webDevice = devices.find(
            (device: { id: string; platform: string; isActive: boolean }) =>
              device.platform === 'WEB' && device.isActive
          );
          if (webDevice) {
            setIsRegistered(true);
            setDeviceId(webDevice.id);
          }
        }
      } catch (err) {
        console.error('[usePushRegistration] Failed to check registration:', err);
      }
    };

    checkRegistration();
  }, [isSupported, permissionStatus]);

  // Setup foreground message listener
  useEffect(() => {
    if (!isRegistered) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[usePushRegistration] Foreground message:', payload);

      // Show browser notification for foreground messages
      if (payload.title) {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isRegistered]);

  /**
   * Register for push notifications using Optimistic UI pattern.
   *
   * Flow:
   * 1. Request browser permission (blocking)
   * 2. On permission granted: immediately set isRegistered=true (optimistic)
   * 3. Start background device registration
   * 4. If backend fails: rollback to isRegistered=false and show error
   *
   * @returns Promise<boolean> - true if permission was granted (not final registration)
   */
  const register = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push-Benachrichtigungen werden nicht unterstützt');
      return false;
    }

    setIsRegistering(true);
    setRegistrationPhase('requesting_permission');
    setError(null);
    shouldRollbackRef.current = false;

    try {
      // Phase 1: Request permission and get FCM token (blocking)
      const token = await requestPushPermission();

      if (!token) {
        setError('Berechtigung verweigert oder Firebase-Fehler');
        setPermissionStatus(getPushPermissionStatus());
        setRegistrationPhase('idle');
        setIsRegistering(false);
        return false;
      }

      setPermissionStatus('granted');

      // OPTIMISTIC UPDATE: Toggle flips immediately after permission granted
      setIsRegistered(true);
      setRegistrationPhase('registering_device');
      shouldRollbackRef.current = true;

      // Phase 2: Register device with backend (background, non-blocking)
      // We return true here immediately - the user sees the toggle as "on"
      const backgroundRegistration = async (): Promise<void> => {
        try {
          // Get device info
          const userAgent = navigator.userAgent;
          const platform = /iPhone|iPad|iPod/.test(userAgent)
            ? 'IOS'
            : /Android/.test(userAgent)
            ? 'ANDROID'
            : 'WEB';

          // Register token with backend
          const response = await fetch('/api/notifications/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              platform,
              deviceName: navigator.platform || 'Unknown',
              deviceModel: userAgent.split(' ').pop() || 'Unknown',
              appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Fehler beim Speichern des Tokens');
          }

          const responseData = await response.json();

          if (responseData.device) {
            setDeviceId(responseData.device.id);
            shouldRollbackRef.current = false;
            // Registration successful - state already shows as registered
          } else {
            throw new Error('Keine Device-ID in Response');
          }
        } catch (err) {
          // ROLLBACK: Backend registration failed
          const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
          if (shouldRollbackRef.current) {
            setIsRegistered(false);
            setError(`Registrierung fehlgeschlagen: ${errorMessage}. Bitte erneut versuchen.`);
          }
        } finally {
          setRegistrationPhase('idle');
          setIsRegistering(false);
        }
      };

      // Start background registration (don't await)
      backgroundRegistration();

      // Return true immediately - permission was granted
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Registrierung fehlgeschlagen: ${errorMessage}`);
      setRegistrationPhase('idle');
      setIsRegistering(false);
      return false;
    }
  }, [isSupported]);

  /**
   * Unregister from push notifications using Optimistic UI pattern.
   * Toggle flips immediately, backend deletion happens in background.
   */
  const unregister = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const previousDeviceId = deviceId;

    // OPTIMISTIC UPDATE: Toggle flips immediately
    setIsRegistered(false);
    setDeviceId(null);

    // Background deletion (don't block UI)
    if (previousDeviceId) {
      fetch(`/api/notifications/devices/${previousDeviceId}`, {
        method: 'DELETE',
      }).catch(() => {
        // Silently ignore - device might already be deleted
      });
    }

    return true;
  }, [isSupported, deviceId]);

  return {
    isSupported,
    isRegistered,
    isRegistering,
    registrationPhase,
    permissionStatus,
    error,
    showPrePermission,
    setShowPrePermission,
    register,
    unregister,
  };
}
