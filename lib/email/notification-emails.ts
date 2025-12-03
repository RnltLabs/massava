/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Email Service
 *
 * Sends notification emails using Resend.
 * Integrates with the notification system.
 */

import type { Notification, User } from '@/app/generated/prisma';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@massava.app';

/**
 * Notification with user relation
 */
interface NotificationWithUser extends Notification {
  user?: User | null;
}

export interface SendNotificationEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a notification email
 * @param notification - Notification object with optional user relation
 * @returns Result object with success status
 */
export async function sendNotificationEmail(
  notification: NotificationWithUser
): Promise<SendNotificationEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_NOTIFICATION_EMAIL',
        notificationId: notification.id,
        notificationType: notification.type,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Get user if not included
    let user = notification.user;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: notification.userId },
      });
    }

    if (!user?.email) {
      logger.warn('Cannot send notification email: User has no email', {
        action: 'SEND_NOTIFICATION_EMAIL',
        userId: notification.userId,
        notificationId: notification.id,
        notificationType: notification.type,
      });
      return {
        success: false,
        error: 'User has no email address',
      };
    }

    // Build email content based on notification type
    const { subject, html, text } = buildEmailContent(notification);

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: user.email,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'notification' },
        { name: 'notification-type', value: notification.type },
        { name: 'priority', value: notification.priority },
      ],
    });

    if (result.error) {
      logger.error('Notification email sending failed', {
        action: 'SEND_NOTIFICATION_EMAIL',
        email: user.email,
        notificationId: notification.id,
        notificationType: notification.type,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Notification email sent successfully', {
      action: 'SEND_NOTIFICATION_EMAIL',
      email: user.email,
      notificationId: notification.id,
      notificationType: notification.type,
      priority: notification.priority,
      messageId: result.data?.id,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Notification email sending exception', {
      action: 'SEND_NOTIFICATION_EMAIL',
      notificationId: notification.id,
      notificationType: notification.type,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build email content based on notification type and metadata
 * @param notification - Notification object
 * @returns Email subject, HTML content, and plain text content
 */
function buildEmailContent(notification: Notification): {
  subject: string;
  html: string;
  text: string;
} {
  const metadata = notification.metadata as Record<string, unknown> | null;
  const actionUrl = notification.actionUrl
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}${notification.actionUrl}`
    : undefined;

  // Get priority class for styling
  const priorityClass = notification.priority === 'URGENT'
    ? 'priority-urgent'
    : notification.priority === 'HIGH'
    ? 'priority-high'
    : '';

  // Base template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(notification.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 30px 20px 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .header-subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    .content {
      padding: 30px 20px;
    }
    .title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #111827;
    }
    .body {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 25px;
      white-space: pre-line;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #6366f1;
      color: white !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 15px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #5558e3;
    }
    .footer {
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .divider {
      margin: 20px 0;
      border-top: 1px solid #e5e7eb;
    }
    .priority-urgent {
      border-left: 4px solid #ef4444;
      padding-left: 15px;
    }
    .priority-high {
      border-left: 4px solid #f59e0b;
      padding-left: 15px;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .priority-badge-urgent {
      background-color: #fef2f2;
      color: #ef4444;
    }
    .priority-badge-high {
      background-color: #fffbeb;
      color: #f59e0b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Massava</div>
      <div class="header-subtitle">Deine Buchungsplattform für Tattoo & Piercing</div>
    </div>
    <div class="content ${priorityClass}">
      ${notification.priority === 'URGENT' ? '<div class="priority-badge priority-badge-urgent">Dringend</div>' : ''}
      ${notification.priority === 'HIGH' ? '<div class="priority-badge priority-badge-high">Wichtig</div>' : ''}
      <div class="title">${escapeHtml(notification.title)}</div>
      <div class="body">${escapeHtml(notification.body)}</div>
      ${actionUrl ? `
      <div class="button-container">
        <a href="${escapeHtml(actionUrl)}" class="button">Details anzeigen</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Massava gesendet.</p>
      <p>Du erhältst diese E-Mail, weil du ein Massava-Konto hast.</p>
      <div class="divider"></div>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/settings/notifications">Benachrichtigungseinstellungen ändern</a></p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
${notification.title}

${notification.body}

${actionUrl ? `Details: ${actionUrl}` : ''}

---
Diese E-Mail wurde automatisch von Massava gesendet.
Benachrichtigungseinstellungen: ${process.env.NEXT_PUBLIC_APP_URL || ''}/settings/notifications
`;

  return {
    subject: getEmailSubject(notification),
    html,
    text,
  };
}

/**
 * Get email subject based on notification type
 * @param notification - Notification object
 * @returns Email subject with appropriate emoji prefix
 */
function getEmailSubject(notification: Notification): string {
  const prefixes: Partial<Record<string, string>> = {
    BOOKING_REQUEST_RECEIVED: '🔔 ',
    BOOKING_CONFIRMED: '✅ ',
    BOOKING_REJECTED: '❌ ',
    BOOKING_CANCELLED_BY_CUSTOMER: '🚫 ',
    BOOKING_CANCELLED_BY_STUDIO: '🚫 ',
    BOOKING_REMINDER_CUSTOMER: '⏰ ',
    BOOKING_REMINDER_STUDIO: '⏰ ',
    PAYMENT_RECEIVED: '💰 ',
    REVIEW_POSTED: '⭐ ',
    REVIEW_REQUEST: '✍️ ',
    ACCOUNT_LOGIN_NEW_DEVICE: '🔐 ',
    ACCOUNT_PASSWORD_CHANGED: '🔑 ',
    SYSTEM_MAINTENANCE: '🔧 ',
  };

  const prefix = prefixes[notification.type] || '📬 ';
  return `${prefix}${notification.title}`;
}

/**
 * Escape HTML to prevent XSS
 * @param text - Text to escape
 * @returns Escaped HTML-safe text
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
