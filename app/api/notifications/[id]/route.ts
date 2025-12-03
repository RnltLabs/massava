/**
 * GET /api/notifications/:id
 *
 * Get a single notification by ID.
 *
 * DELETE /api/notifications/:id
 *
 * Delete a notification.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { notificationService } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from "@/lib/middleware/api-rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.getNotification,
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
        }

    const { id } = await params;

    // Fetch notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Benachrichtigung nicht gefunden" },
        { status: 404 },
      );
    }

    // Check if notification belongs to the requesting user
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Zugriff verweigert. Diese Benachrichtigung gehört einem anderen Benutzer.",
        },
        { status: 403 },
      );
    }

        return NextResponse.json({ data: notification });
      } catch (error) {
        logger.error("GET /api/notifications/:id error:", {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.getNotification, // Same limit as GET
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

    const { id } = await params;

    const result = await notificationService.deleteNotification(
      id,
      session.user.id,
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

        return NextResponse.json({ success: true });
      } catch (error) {
        logger.error("DELETE /api/notifications/:id error:", {
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
