/**
 * GET /api/notifications
 *
 * Get paginated list of notifications for the authenticated user.
 *
 * POST /api/notifications
 *
 * Create a notification (Admin only - SUPER_ADMIN or STUDIO_OWNER).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { notificationService } from "@/lib/notifications/notification-service";
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from "@/lib/middleware/api-rate-limiter";
import { z } from "zod";
import type {
  NotificationStatus,
  NotificationType,
  UserRole,
} from "@/app/generated/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.listNotifications,
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor") || undefined;
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");

    const status = statusParam
      ? (statusParam.split(",") as NotificationStatus[])
      : undefined;
    const type = typeParam
      ? (typeParam.split(",") as NotificationType[])
      : undefined;

    const result = await notificationService.getUserNotifications(
      session.user.id,
      { status, type, limit, cursor },
    );

        return NextResponse.json(result);
      } catch (error) {
        logger.error("GET /api/notifications error:", {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    }
  );
}

const createSchema = z.object({
  userId: z.string().cuid("Ungültige User-ID"),
  type: z.enum(
    [
      "BOOKING_REQUEST_RECEIVED",
      "BOOKING_CANCELLED_BY_CUSTOMER",
      "BOOKING_REMINDER_STUDIO",
      "PAYMENT_RECEIVED",
      "REVIEW_POSTED",
      "LOW_AVAILABILITY_ALERT",
      "BOOKING_CONFIRMED",
      "BOOKING_REJECTED",
      "BOOKING_REMINDER_CUSTOMER",
      "BOOKING_CANCELLED_BY_STUDIO",
      "REVIEW_REQUEST",
      "STUDIO_PROMOTION",
      "ACCOUNT_LOGIN_NEW_DEVICE",
      "ACCOUNT_PASSWORD_CHANGED",
      "ACCOUNT_EMAIL_CHANGED",
      "ACCOUNT_TWO_FACTOR_ENABLED",
      "ACCOUNT_DELETION_SCHEDULED",
      "ACCOUNT_DELETION_CANCELLED",
      "SYSTEM_MAINTENANCE",
      "FEATURE_ANNOUNCEMENT",
      "TERMS_UPDATE",
      "WELCOME",
      "ONBOARDING_REMINDER",
      "SUBSCRIPTION_EXPIRING",
      "SUBSCRIPTION_EXPIRED",
    ] as const,
    { message: "Ungültiger Benachrichtigungstyp" },
  ),
  title: z.string().optional(),
  body: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"] as const).optional(),
  channels: z.array(z.enum(["PUSH", "EMAIL", "IN_APP"] as const)).optional(),
  scheduledFor: z
    .string()
    .datetime({ message: "Ungültiges Datumsformat (ISO 8601 erforderlich)" })
    .optional(),
  bookingId: z.string().cuid("Ungültige Buchungs-ID").optional(),
  studioId: z.string().cuid("Ungültige Studio-ID").optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.createNotification,
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
        }

    // Check if user has admin role (SUPER_ADMIN or STUDIO_OWNER)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any).primaryRole as UserRole | undefined;
    if (userRole !== "SUPER_ADMIN" && userRole !== "STUDIO_OWNER") {
      return NextResponse.json(
        {
          error:
            "Unzureichende Berechtigungen. Administrator-Rolle erforderlich.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Ungültige Eingabedaten",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { scheduledFor, ...rest } = parsed.data;

    const result = await notificationService.create({
      ...rest,
      ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
    });

    if (!result.ok) {
      const { formatErrorResponse } = await import('@/lib/notifications/errors');
      const errorResponse = formatErrorResponse(result.error);
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.value.id,
          status: result.value.status,
        },
      },
        { status: 201 },
      );
      } catch (error) {
        logger.error("POST /api/notifications error:", {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        return NextResponse.json(
          { error: "Interner Serverfehler" },
          { status: 500 },
        );
      }
    }
  );
}
