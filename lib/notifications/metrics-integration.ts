/**
 * Metrics Integration for Notification Service
 *
 * This file provides wrapped versions of delivery methods with built-in metrics collection.
 * Import these wrappers to automatically track delivery duration, success/failure rates.
 *
 * Usage in notification-service.ts:
 * ```typescript
 * import { withMetrics } from './metrics-integration';
 *
 * private async deliverPush(...) {
 *   return withMetrics('PUSH', async () => {
 *     // existing delivery logic
 *   });
 * }
 * ```
 */

import type { NotificationChannel } from '@/app/generated/prisma';
import {
  recordNotificationDelivered,
  recordNotificationFailed,
  recordDeliveryDuration,
} from './metrics';

/**
 * Wraps a delivery function with metrics collection
 *
 * Automatically tracks:
 * - Delivery duration
 * - Success/failure counts
 * - Error types on failure
 *
 * @param channel - Delivery channel (PUSH, EMAIL, IN_APP)
 * @param deliveryFn - Async function that performs the delivery
 * @returns Result of delivery function
 * @throws Re-throws any errors after recording metrics
 */
export async function withMetrics<T>(
  channel: NotificationChannel,
  deliveryFn: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await deliveryFn();

    // Record successful delivery
    const durationSeconds = (Date.now() - startTime) / 1000;
    recordNotificationDelivered(channel, 'DELIVERED');
    recordDeliveryDuration(channel, durationSeconds);

    return result;
  } catch (error) {
    // Record failure
    const durationSeconds = (Date.now() - startTime) / 1000;
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown';

    recordNotificationFailed(channel, errorType);
    recordDeliveryDuration(channel, durationSeconds); // Track even failed attempts

    throw error; // Re-throw to maintain error handling flow
  }
}

/**
 * Integration instructions for notification-service.ts:
 *
 * 1. Import withMetrics:
 *    import { withMetrics } from './metrics-integration';
 *
 * 2. Wrap deliverPush:
 *    private async deliverPush(...) {
 *      return withMetrics('PUSH', async () => {
 *        // existing push logic
 *      });
 *    }
 *
 * 3. Wrap deliverEmail:
 *    private async deliverEmail(...) {
 *      return withMetrics('EMAIL', async () => {
 *        // existing email logic
 *      });
 *    }
 *
 * 4. Wrap deliverInApp:
 *    private async deliverInApp(...) {
 *      return withMetrics('IN_APP', async () => {
 *        // existing in-app logic
 *      });
 *    }
 *
 * This approach keeps metrics separate from business logic for easier testing/maintenance.
 */
