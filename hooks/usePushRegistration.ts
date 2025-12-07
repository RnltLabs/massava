/**
 * Unified Push Registration Hook
 *
 * Manages push notification registration across platforms:
 * - Web: Uses Firebase Cloud Messaging (FCM) via Web Push API
 * - iOS/Android: Uses Capacitor PushNotifications plugin (APNS/FCM)
 *
 * Provides a unified API regardless of platform, handling:
 * - Permission requests
 * - Token registration with backend
 * - Foreground message handling
 * - Registration state management
 * - Error handling with retry support
 *
 * @module hooks/usePushRegistration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  isPushAvailable,
  getPushPermissionStatus,
  requestPushPermission,
  onForegroundMessage,
} from '@/lib/firebase/firebase-client';
import { capacitorPushService, type NativePermissionStatus } from '@/lib/capacitor';
import { logger } from '@/lib/logger';
import { isInternalUrl } from '@/lib/utils/url-validation';

/**
 * Registration phase for optimistic UI
 */
type RegistrationPhase = 'idle' | 'requesting_permission' | 'registering_device';

/**
 * Unified permission status across platforms
 */
type UnifiedPermissionStatus = 'granted' | 'denied' | 'default' | 'unavailable';

/**
 * Return value of usePushRegistration hook
 */
interface UsePushRegistrationReturn {
  /** Whether push notifications are supported on this platform */
  isSupported: boolean;
  /** Whether device is registered with backend */
  isRegistered: boolean;
  /** Whether registration is in progress */
  isRegistering: boolean;
  /** Current phase of registration process */
  registrationPhase: RegistrationPhase;
  /** Current permission status (unified across platforms) */
  permissionStatus: UnifiedPermissionStatus;
  /** Last error message, if any */
  error: string | null;
  /** Whether to show pre-permission dialog (for UX) */
  showPrePermission: boolean;
  /** Set pre-permission dialog visibility */
  setShowPrePermission: (show: boolean) => void;
  /** Whether running on native platform */
  isNative: boolean;
  /** Request permission and register for push notifications */
  register: () => Promise<boolean>;
  /** Unregister from push notifications */
  unregister: () => Promise<boolean>;
  /** Retry registration after failure */
  retry: () => Promise<boolean>;
}

/**
 * Maximum number of retry attempts for registration
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay between retry attempts (in ms)
 */
const RETRY_DELAY_MS = 1000;

/**
 * Maps native permission status to unified status
 */
function mapNativePermission(status: NativePermissionStatus): UnifiedPermissionStatus {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'prompt':
    case 'prompt-with-rationale':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Hook to manage push notification registration across platforms
 *
 * Automatically detects platform and uses appropriate push service:
 * - Web browsers: Firebase Cloud Messaging via service worker
 * - Native apps (iOS/Android): Capacitor PushNotifications
 *
 * Implements Optimistic UI pattern for better user experience:
 * 1. Permission request (blocking) - User must grant permission
 * 2. Device registration (background) - Token registration async
 * 3. Rollback on failure - Reverts state if backend fails
 *
 * @returns {UsePushRegistrationReturn} State and control functions
 *
 * @example
 * ```typescript
 * export function NotificationSettings() {
 *   const {
 *     isSupported,
 *     isRegistered,
 *     isNative,
 *     permissionStatus,
 *     error,
 *     register,
 *     unregister,
 *     retry,
 *   } = usePushRegistration();
 *
 *   if (!isSupported) {
 *     return <p>Push notifications not supported</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Platform: {isNative ? 'Native App' : 'Web Browser'}</p>
 *       <p>Status: {permissionStatus}</p>
 *       {isRegistered ? (
 *         <button onClick={unregister}>Disable Notifications</button>
 *       ) : (
 *         <button onClick={register}>Enable Notifications</button>
 *       )}
 *       {error && (
 *         <div>
 *           <p className="error">{error}</p>
 *           <button onClick={retry}>Retry</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePushRegistration(): UsePushRegistrationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationPhase, setRegistrationPhase] = useState<RegistrationPhase>('idle');
  const [permissionStatus, setPermissionStatus] = useState<UnifiedPermissionStatus>('default');
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showPrePermission, setShowPrePermission] = useState(false);

  // Track if this is a native platform
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  // Refs for retry and rollback logic
  const shouldRollbackRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastRegistrationParamsRef = useRef<{
    isNative: boolean;
  } | null>(null);

  /**
   * Check support and permission status on mount
   */
  useEffect(() => {
    const checkSupport = async (): Promise<void> => {
      if (typeof window === 'undefined') return;

      if (isNative) {
        // Native platform - always supported
        setIsSupported(true);

        // Get native permission status
        const nativeStatus = await capacitorPushService.getPermissionStatus();
        setPermissionStatus(mapNativePermission(nativeStatus));
      } else {
        // Web platform - check Web Push API support
        const supported = isPushAvailable();
        const permStatus = supported ? getPushPermissionStatus() : 'unavailable';

        setIsSupported(supported);
        setPermissionStatus(permStatus);
      }
    };

    void checkSupport();
  }, [isNative]);

  /**
   * Check if already registered with backend
   */
  useEffect(() => {
    const checkRegistration = async (): Promise<void> => {
      if (!isSupported || permissionStatus !== 'granted') return;

      try {
        if (isNative) {
          // Native: Use capacitor service to check registration
          const registered = await capacitorPushService.isRegistered();
          setIsRegistered(registered);
          if (registered) {
            setDeviceId(capacitorPushService.getDeviceId());
          }
        } else {
          // Web: Check devices API
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
        }
      } catch (err) {
        logger.error('[usePushRegistration] Failed to check registration', {
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    };

    void checkRegistration();
  }, [isSupported, permissionStatus, isNative]);

  /**
   * Setup foreground message listener for web
   */
  useEffect(() => {
    // Only setup web foreground listener if registered on web
    if (isNative || !isRegistered) return;

    const unsubscribe = onForegroundMessage((payload) => {
      logger.info('[usePushRegistration] Foreground message received');

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
  }, [isRegistered, isNative]);

  /**
   * Register for web push notifications
   */
  const registerWeb = useCallback(async (): Promise<boolean> => {
    setRegistrationPhase('requesting_permission');

    try {
      // Request permission and get FCM token
      const token = await requestPushPermission();

      if (!token) {
        setError('Berechtigung verweigert oder Firebase-Fehler');
        setPermissionStatus(getPushPermissionStatus());
        setRegistrationPhase('idle');
        return false;
      }

      setPermissionStatus('granted');

      // Optimistic update
      setIsRegistered(true);
      setRegistrationPhase('registering_device');
      shouldRollbackRef.current = true;

      // Register with backend
      const userAgent = navigator.userAgent;
      const platform = /iPhone|iPad|iPod/.test(userAgent)
        ? 'IOS'
        : /Android/.test(userAgent)
          ? 'ANDROID'
          : 'WEB';

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
        retryCountRef.current = 0;
        return true;
      } else {
        throw new Error('Keine Device-ID in Response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';

      // Rollback on error
      if (shouldRollbackRef.current) {
        setIsRegistered(false);
        setError(`Registrierung fehlgeschlagen: ${errorMessage}. Bitte erneut versuchen.`);
      }

      return false;
    } finally {
      setRegistrationPhase('idle');
    }
  }, []);

  /**
   * Register for native push notifications
   */
  const registerNative = useCallback(async (): Promise<boolean> => {
    setRegistrationPhase('requesting_permission');

    try {
      // Initialize capacitor push service (requests permission + registers)
      const success = await capacitorPushService.initialize({
        onNotificationReceived: () => {
          logger.info('[usePushRegistration] Native notification received');
          void capacitorPushService.updateBadge();
        },
        onNotificationAction: (action) => {
          const actionUrl = action.notification.data?.['actionUrl'] as string | undefined;
          if (actionUrl && isInternalUrl(actionUrl)) {
            window.location.href = actionUrl;
          } else if (actionUrl) {
            logger.warn('[usePushRegistration] Blocked navigation to external URL', {
              url: actionUrl,
            });
          }
        },
        onError: (err) => {
          logger.error('[usePushRegistration] Native push error', {
            error: err,
          });
          setError(err.message);
        },
      });

      if (!success) {
        const status = await capacitorPushService.getPermissionStatus();
        setPermissionStatus(mapNativePermission(status));
        setError('Push-Berechtigung verweigert');
        setRegistrationPhase('idle');
        return false;
      }

      // Update states on success
      setPermissionStatus('granted');
      setIsRegistered(true);
      setDeviceId(capacitorPushService.getDeviceId());
      retryCountRef.current = 0;

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Native Registrierung fehlgeschlagen: ${errorMessage}`);
      return false;
    } finally {
      setRegistrationPhase('idle');
    }
  }, []);

  /**
   * Unified register function
   */
  const register = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push-Benachrichtigungen werden nicht unterstützt');
      return false;
    }

    setIsRegistering(true);
    setError(null);
    shouldRollbackRef.current = false;

    // Store params for retry
    lastRegistrationParamsRef.current = { isNative };

    try {
      if (isNative) {
        return await registerNative();
      } else {
        return await registerWeb();
      }
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported, isNative, registerWeb, registerNative]);

  /**
   * Unified unregister function
   */
  const unregister = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const previousDeviceId = deviceId;

    // Optimistic update
    setIsRegistered(false);
    setDeviceId(null);

    try {
      if (isNative) {
        // Native: Use capacitor service
        await capacitorPushService.unregisterDevice();
      } else {
        // Web: Delete from backend
        if (previousDeviceId) {
          await fetch(`/api/notifications/devices/${previousDeviceId}`, {
            method: 'DELETE',
          });
        }
      }

      return true;
    } catch (err) {
      // Log but don't rollback - device might already be deleted
      logger.error('[usePushRegistration] Unregister error', {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      return true;
    }
  }, [isSupported, isNative, deviceId]);

  /**
   * Retry failed registration with exponential backoff
   */
  const retry = useCallback(async (): Promise<boolean> => {
    if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      setError(
        `Maximale Anzahl an Versuchen erreicht (${MAX_RETRY_ATTEMPTS}). Bitte später erneut versuchen.`
      );
      return false;
    }

    retryCountRef.current += 1;
    setError(null);

    // Exponential backoff delay
    const delay = RETRY_DELAY_MS * Math.pow(2, retryCountRef.current - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return register();
  }, [register]);

  return {
    isSupported,
    isRegistered,
    isRegistering,
    registrationPhase,
    permissionStatus,
    error,
    showPrePermission,
    setShowPrePermission,
    isNative,
    register,
    unregister,
    retry,
  };
}
