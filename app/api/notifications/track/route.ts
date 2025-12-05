/**
 * POST /api/notifications/track
 *
 * Track notification clicks and dismissals from service worker.
 * This endpoint is called without authentication (service worker context).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { trackNotificationClickSchema } from "@/lib/schemas/notification.schema";
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from "@/lib/middleware/api-rate-limiter";

/**
 * Track notification interaction (click or dismiss)
 *
 * Service workers don't have access to authentication context,
 * so we use the notificationId as the identifier.
 *
 * Security considerations:
 * - Rate limited to prevent abuse
 * - Only accepts valid notification IDs from database
 * - Idempotent: multiple calls with same data won't cause issues
 */
export async function POST(request: NextRequest) {
  // No auth required - service worker context
  // Rate limiting based on IP address
  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.trackNotification,
    null, // No session
    async () => {
      try {
        const body = await request.json();
        const parsed = trackNotificationClickSchema.safeParse(body);

        if (!parsed.success) {
          logger.warn("POST /api/notifications/track: Invalid input", {
            errors: parsed.error.flatten().fieldErrors,
            body,
          });
          return NextResponse.json(
            {
              success: false,
              error: "Ungültige Eingabedaten",
              details: parsed.error.flatten().fieldErrors,
            },
            { status: 400 }
          );
        }

        const { notificationId, action, clickAction, timestamp } = parsed.data;

        // Verify notification exists
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
          select: { id: true, userId: true, pushClickedAt: true, pushDismissedAt: true },
        });

        if (!notification) {
          logger.warn("POST /api/notifications/track: Notification not found", {
            notificationId,
          });
          return NextResponse.json(
            {
              success: false,
              error: "Benachrichtigung nicht gefunden",
            },
            { status: 404 }
          );
        }

        // Prepare update data
        const updateData: {
          pushClickedAt?: Date;
          pushDismissedAt?: Date;
          clickAction?: string | null;
        } = {};

        if (action === "click") {
          // Only update if not already clicked (idempotent)
          if (!notification.pushClickedAt) {
            updateData.pushClickedAt = new Date(timestamp);
            if (clickAction) {
              updateData.clickAction = clickAction;
            }
          }
        } else if (action === "dismiss") {
          // Only update if not already dismissed (idempotent)
          if (!notification.pushDismissedAt) {
            updateData.pushDismissedAt = new Date(timestamp);
          }
        }

        // Update notification if there's data to update
        if (Object.keys(updateData).length > 0) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: updateData,
          });

          logger.info("Notification interaction tracked", {
            notificationId,
            action,
            clickAction: clickAction || null,
            userId: notification.userId,
          });
        } else {
          logger.debug("Notification already tracked (idempotent)", {
            notificationId,
            action,
          });
        }

        return NextResponse.json({
          success: true,
          message: "Interaktion erfolgreich erfasst",
        });
      } catch (error) {
        logger.error("POST /api/notifications/track error:", {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        return NextResponse.json(
          {
            success: false,
            error: "Interner Serverfehler",
          },
          { status: 500 }
        );
      }
    }
  );
}
