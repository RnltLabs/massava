/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Sending Service with Resend
 * STRATEGY.md Section 8.2 - Phase 2.5 Quick Wins
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import {
  EmailVerificationTemplate,
  WelcomeEmailTemplate,
  PasswordResetTemplate,
  EmailChangeVerificationTemplate,
  BookingRequestReceivedTemplate,
  BookingConfirmationTemplate,
  BookingCancellationTemplate,
  BookingReminderTemplate,
  TwoFactorCodeTemplate,
  AccountDeletionScheduledTemplate,
  AccountDeletionConfirmedTemplate,
  NewBookingNotificationTemplate,
  BookingCancelledByCustomerTemplate,
  StudioRegistrationWelcomeTemplate,
  StudioDeletionWarningTemplate,
  StudioDeletionConfirmedTemplate,
  ReviewRequestTemplate,
  getPlainTextVerification,
  getPlainTextWelcome,
  getPlainTextPasswordReset,
  getPlainTextEmailChangeVerification,
  getPlainTextBookingRequestReceived,
  getPlainTextBookingConfirmation,
  getPlainTextBookingCancellation,
  getPlainTextBookingReminder,
  getPlainTextTwoFactorCode,
  getPlainTextAccountDeletionScheduled,
  getPlainTextAccountDeletionConfirmed,
  getPlainTextNewBookingNotification,
  getPlainTextBookingCancelledByCustomer,
  getPlainTextStudioRegistrationWelcome,
  getPlainTextStudioDeletionWarning,
  getPlainTextStudioDeletionConfirmed,
  getPlainTextReviewRequest,
  CustomerCancellationConfirmationTemplate,
  getPlainTextCustomerCancellationConfirmation,
} from './templates';
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

// Default sender email
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@massava.app';

/**
 * Sanitize a string for use as a Resend email tag value.
 * Resend tags only allow ASCII letters, numbers, underscores, or dashes.
 */
function sanitizeTagValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (ä → a, etc.)
    .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace invalid chars with dash
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, '') // Trim leading/trailing dashes
    .substring(0, 50); // Limit length
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email verification email
 * @param email - Recipient email address
 * @param verificationUrl - URL with verification token
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_VERIFICATION_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      EmailVerificationTemplate({
        verificationUrl,
        locale,
      })
    );

    const textContent = getPlainTextVerification(verificationUrl, locale);

    const subject = locale === 'de'
      ? 'Verifizieren Sie Ihre E-Mail-Adresse - Massava'
      : 'Verify Your Email Address - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'verification' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_VERIFICATION_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Verification email sent successfully', {
      action: 'SEND_VERIFICATION_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_VERIFICATION_EMAIL',
      email,
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
 * Send welcome email after successful verification
 * @param email - Recipient email address
 * @param name - User's name
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_WELCOME_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      WelcomeEmailTemplate({
        name,
        locale,
      })
    );

    const textContent = getPlainTextWelcome(name, locale);

    const subject = locale === 'de'
      ? 'Willkommen bei Massava!'
      : 'Welcome to Massava!';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_WELCOME_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Welcome email sent successfully', {
      action: 'SEND_WELCOME_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_WELCOME_EMAIL',
      email,
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
 * Send password reset email (future use)
 * @param email - Recipient email address
 * @param resetUrl - URL with reset token
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_PASSWORD_RESET_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      PasswordResetTemplate({
        resetUrl,
        locale,
      })
    );

    const textContent = getPlainTextPasswordReset(resetUrl, locale);

    const subject = locale === 'de'
      ? 'Passwort zurücksetzen - Massava'
      : 'Reset Your Password - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'password-reset' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_PASSWORD_RESET_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Password reset email sent successfully', {
      action: 'SEND_PASSWORD_RESET_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_PASSWORD_RESET_EMAIL',
      email,
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
 * Send email change verification email
 * @param email - New email address (recipient)
 * @param userName - User's name
 * @param newEmail - New email address
 * @param verificationUrl - URL with verification token
 * @param oldEmail - Current email address
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendEmailChangeVerification(
  email: string,
  userName: string,
  newEmail: string,
  verificationUrl: string,
  oldEmail: string,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_EMAIL_CHANGE_VERIFICATION',
        email: newEmail,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      EmailChangeVerificationTemplate({
        userName,
        newEmail,
        verificationUrl,
        oldEmail,
        locale,
      })
    );

    const textContent = getPlainTextEmailChangeVerification(
      userName,
      newEmail,
      verificationUrl,
      oldEmail,
      locale
    );

    const subject = locale === 'de'
      ? 'E-Mail-Adresse bestätigen - Massava'
      : 'Confirm Email Address - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'email-change-verification' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_EMAIL_CHANGE_VERIFICATION',
        email: newEmail,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Email change verification email sent successfully', {
      action: 'SEND_EMAIL_CHANGE_VERIFICATION',
      email: newEmail,
      messageId: result.data?.id,
      locale,
      oldEmail,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_EMAIL_CHANGE_VERIFICATION',
      email: newEmail,
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
 * Send booking request received email (sent immediately when user submits booking)
 * @param email - Customer email address
 * @param bookingDetails - Booking details object
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendBookingRequestReceivedEmail(
  email: string,
  bookingDetails: {
    bookingId: string;
    customerName: string;
    studioName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    message?: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_BOOKING_REQUEST_RECEIVED_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      BookingRequestReceivedTemplate({
        ...bookingDetails,
        locale,
      })
    );

    const textContent = getPlainTextBookingRequestReceived(
      bookingDetails.bookingId,
      bookingDetails.customerName,
      bookingDetails.studioName,
      bookingDetails.serviceName,
      bookingDetails.bookingDate,
      bookingDetails.bookingTime,
      bookingDetails.message,
      locale
    );

    const subject = locale === 'de'
      ? 'Buchungsanfrage erhalten - Massava'
      : 'Booking Request Received - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'booking-request-received' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_BOOKING_REQUEST_RECEIVED_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Booking request received email sent successfully', {
      action: 'SEND_BOOKING_REQUEST_RECEIVED_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      studioName: bookingDetails.studioName,
      bookingId: bookingDetails.bookingId,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_BOOKING_REQUEST_RECEIVED_EMAIL',
      email,
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
 * Send booking confirmation email (sent when studio owner confirms the booking)
 * @param email - Customer email address
 * @param bookingDetails - Booking details object
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    bookingId: string;
    customerName: string;
    studioName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    studioAddress?: string;
    studioPhone?: string;
    message?: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_BOOKING_CONFIRMATION_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      BookingConfirmationTemplate({
        ...bookingDetails,
        locale,
      })
    );

    const textContent = getPlainTextBookingConfirmation(
      bookingDetails.bookingId,
      bookingDetails.customerName,
      bookingDetails.studioName,
      bookingDetails.serviceName,
      bookingDetails.bookingDate,
      bookingDetails.bookingTime,
      bookingDetails.studioAddress,
      bookingDetails.studioPhone,
      bookingDetails.message,
      locale
    );

    const subject = locale === 'de'
      ? 'Buchung bestätigt - Massava'
      : 'Booking Confirmed - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'booking-confirmation' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_BOOKING_CONFIRMATION_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Booking confirmation email sent successfully', {
      action: 'SEND_BOOKING_CONFIRMATION_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      studioName: bookingDetails.studioName,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_BOOKING_CONFIRMATION_EMAIL',
      email,
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
 * Send booking cancellation email
 * @param email - Customer email address
 * @param bookingDetails - Booking details object
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendBookingCancellationEmail(
  email: string,
  bookingDetails: {
    bookingId: string;
    customerName: string;
    studioName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    cancellationReason?: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_BOOKING_CANCELLATION_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      BookingCancellationTemplate({
        ...bookingDetails,
        locale,
      })
    );

    const textContent = getPlainTextBookingCancellation(
      bookingDetails.bookingId,
      bookingDetails.customerName,
      bookingDetails.studioName,
      bookingDetails.serviceName,
      bookingDetails.bookingDate,
      bookingDetails.bookingTime,
      bookingDetails.cancellationReason,
      locale
    );

    const subject = locale === 'de'
      ? 'Buchung abgelehnt - Massava'
      : 'Booking Declined - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'booking-cancellation' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_BOOKING_CANCELLATION_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Booking cancellation email sent successfully', {
      action: 'SEND_BOOKING_CANCELLATION_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      studioName: bookingDetails.studioName,
      hasReason: !!bookingDetails.cancellationReason,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_BOOKING_CANCELLATION_EMAIL',
      email,
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
 * Send booking reminder email (24 hours before appointment)
 * @param email - Recipient email address
 * @param bookingDetails - Booking details
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendBookingReminderEmail(
  email: string,
  bookingDetails: {
    bookingId: string;
    customerName: string;
    studioName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    studioAddress?: string;
    studioPhone?: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_BOOKING_REMINDER_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      BookingReminderTemplate({
        ...bookingDetails,
        locale,
      })
    );

    const textContent = getPlainTextBookingReminder(
      bookingDetails.bookingId,
      bookingDetails.customerName,
      bookingDetails.studioName,
      bookingDetails.serviceName,
      bookingDetails.bookingDate,
      bookingDetails.bookingTime,
      bookingDetails.studioAddress,
      bookingDetails.studioPhone,
      locale
    );

    const subject = locale === 'de'
      ? 'Erinnerung: Ihr Termin morgen - Massava'
      : 'Reminder: Your Appointment Tomorrow - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'booking-reminder' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_BOOKING_REMINDER_EMAIL',
        email,
        error: result.error.message,
        bookingId: bookingDetails.bookingId,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Booking reminder email sent successfully', {
      action: 'SEND_BOOKING_REMINDER_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      bookingId: bookingDetails.bookingId,
      studioName: bookingDetails.studioName,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_BOOKING_REMINDER_EMAIL',
      email,
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
 * Send two-factor authentication code email
 * @param email - Recipient email address
 * @param userName - User's name
 * @param code - 6-digit 2FA code
 * @param expiresInMinutes - Code expiration time in minutes (default: 5)
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendTwoFactorCodeEmail(
  email: string,
  userName: string,
  code: string,
  expiresInMinutes: number = 5,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_TWO_FACTOR_CODE_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      TwoFactorCodeTemplate({
        userName,
        code,
        expiresInMinutes,
        locale,
      })
    );

    const textContent = getPlainTextTwoFactorCode(userName, code, expiresInMinutes, locale);

    const subject = locale === 'de'
      ? 'Ihr Sicherheitscode - Massava'
      : 'Your Security Code - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'two-factor-code' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_TWO_FACTOR_CODE_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Two-factor code email sent successfully', {
      action: 'SEND_TWO_FACTOR_CODE_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      expiresInMinutes,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_TWO_FACTOR_CODE_EMAIL',
      email,
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
 * Send account deletion scheduled email (30-day grace period)
 * @param email - Recipient email address
 * @param userName - User's name
 * @param deletionDate - Formatted deletion date (e.g., "15. Dezember 2025")
 * @param cancelUrl - URL to cancel the deletion
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendAccountDeletionScheduledEmail(
  email: string,
  userName: string,
  deletionDate: string,
  cancelUrl: string,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_ACCOUNT_DELETION_SCHEDULED_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      AccountDeletionScheduledTemplate({
        userName,
        deletionDate,
        cancelUrl,
        locale,
      })
    );

    const textContent = getPlainTextAccountDeletionScheduled(
      userName,
      deletionDate,
      cancelUrl,
      locale
    );

    const subject = locale === 'de'
      ? 'Konto-Löschung geplant - Massava'
      : 'Account Deletion Scheduled - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'account-deletion-scheduled' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_ACCOUNT_DELETION_SCHEDULED_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Account deletion scheduled email sent successfully', {
      action: 'SEND_ACCOUNT_DELETION_SCHEDULED_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      deletionDate,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_ACCOUNT_DELETION_SCHEDULED_EMAIL',
      email,
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
 * Send account deletion confirmed email (final email after deletion)
 * @param email - Recipient email address
 * @param userName - User's name
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendAccountDeletionConfirmedEmail(
  email: string,
  userName: string,
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_ACCOUNT_DELETION_CONFIRMED_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      AccountDeletionConfirmedTemplate({
        userName,
        locale,
      })
    );

    const textContent = getPlainTextAccountDeletionConfirmed(userName, locale);

    const subject = locale === 'de'
      ? 'Konto gelöscht - Massava'
      : 'Account Deleted - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'account-deletion-confirmed' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_ACCOUNT_DELETION_CONFIRMED_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Account deletion confirmed email sent successfully', {
      action: 'SEND_ACCOUNT_DELETION_CONFIRMED_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_ACCOUNT_DELETION_CONFIRMED_EMAIL',
      email,
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
 * Test email configuration (for development/testing)
 * @returns true if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ============================================================================
// PHASE 3: STUDIO OWNER NOTIFICATIONS
// ============================================================================

/**
 * Send new booking notification to studio owners
 * TASK 3.1: Notifies studio owners when a new booking is created
 *
 * @param ownerEmail - Studio owner email address
 * @param bookingData - Booking information
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendNewBookingNotificationToOwner(
  ownerEmail: string,
  bookingData: {
    studioName: string;
    ownerName: string;
    bookingId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    message?: string;
    dashboardUrl: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER',
        ownerEmail,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      NewBookingNotificationTemplate({
        ...bookingData,
        locale,
      })
    );

    const textContent = getPlainTextNewBookingNotification(
      bookingData.studioName,
      bookingData.ownerName,
      bookingData.bookingId,
      bookingData.customerName,
      bookingData.customerEmail,
      bookingData.customerPhone,
      bookingData.serviceName,
      bookingData.bookingDate,
      bookingData.bookingTime,
      bookingData.message,
      bookingData.dashboardUrl,
      locale
    );

    const subject = locale === 'de'
      ? `Neue Buchungsanfrage - ${bookingData.studioName}`
      : `New Booking Request - ${bookingData.studioName}`;

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: ownerEmail,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'new-booking-notification-owner' },
        { name: 'locale', value: locale },
        { name: 'studio', value: sanitizeTagValue(bookingData.studioName) },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER',
        ownerEmail,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('New booking notification sent to owner successfully', {
      action: 'SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER',
      ownerEmail,
      bookingId: bookingData.bookingId,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER',
      ownerEmail,
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
 * Send booking cancelled by customer notification to studio owners
 * TASK 3.2: Notifies studio owners when a customer cancels their booking
 *
 * @param ownerEmail - Studio owner email address
 * @param cancellationData - Cancellation information
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendBookingCancelledByCustomerToOwner(
  ownerEmail: string,
  cancellationData: {
    studioName: string;
    ownerName: string;
    bookingId: string;
    customerName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    cancellationReason?: string;
    dashboardUrl: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_BOOKING_CANCELLED_BY_CUSTOMER_TO_OWNER',
        ownerEmail,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      BookingCancelledByCustomerTemplate({
        ...cancellationData,
        locale,
      })
    );

    const textContent = getPlainTextBookingCancelledByCustomer(
      cancellationData.studioName,
      cancellationData.ownerName,
      cancellationData.bookingId,
      cancellationData.customerName,
      cancellationData.serviceName,
      cancellationData.bookingDate,
      cancellationData.bookingTime,
      cancellationData.cancellationReason,
      cancellationData.dashboardUrl,
      locale
    );

    const subject = locale === 'de'
      ? `Buchung storniert - ${cancellationData.studioName}`
      : `Booking Cancelled - ${cancellationData.studioName}`;

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: ownerEmail,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'booking-cancelled-by-customer-owner' },
        { name: 'locale', value: locale },
        { name: 'studio', value: sanitizeTagValue(cancellationData.studioName) },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_BOOKING_CANCELLED_BY_CUSTOMER_TO_OWNER',
        ownerEmail,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Booking cancelled by customer notification sent to owner successfully', {
      action: 'SEND_BOOKING_CANCELLED_BY_CUSTOMER_TO_OWNER',
      ownerEmail,
      bookingId: cancellationData.bookingId,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_BOOKING_CANCELLED_BY_CUSTOMER_TO_OWNER',
      ownerEmail,
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
 * Send studio registration welcome email
 * TASK 3.3: Welcomes new studio owners after successful registration
 *
 * @param ownerEmail - Studio owner email address
 * @param studioData - Studio information
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendStudioRegistrationWelcomeEmail(
  ownerEmail: string,
  studioData: {
    studioName: string;
    ownerName: string;
    studioId: string;
    dashboardUrl: string;
    onboardingUrl: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_STUDIO_REGISTRATION_WELCOME_EMAIL',
        ownerEmail,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      StudioRegistrationWelcomeTemplate({
        ...studioData,
        locale,
      })
    );

    const textContent = getPlainTextStudioRegistrationWelcome(
      studioData.studioName,
      studioData.ownerName,
      studioData.studioId,
      studioData.dashboardUrl,
      studioData.onboardingUrl,
      locale
    );

    const subject = locale === 'de'
      ? `Willkommen bei Massava - ${studioData.studioName}`
      : `Welcome to Massava - ${studioData.studioName}`;

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: ownerEmail,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'studio-registration-welcome' },
        { name: 'locale', value: locale },
        { name: 'studio', value: sanitizeTagValue(studioData.studioName) },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_STUDIO_REGISTRATION_WELCOME_EMAIL',
        ownerEmail,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Studio registration welcome email sent successfully', {
      action: 'SEND_STUDIO_REGISTRATION_WELCOME_EMAIL',
      ownerEmail,
      studioId: studioData.studioId,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_STUDIO_REGISTRATION_WELCOME_EMAIL',
      ownerEmail,
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
 * Send studio deletion warning email (30-day grace period)
 * TASK 3.4: Warns studio owners about upcoming studio deletion
 *
 * @param ownerEmail - Studio owner email address
 * @param deletionData - Deletion information
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendStudioDeletionWarningEmail(
  ownerEmail: string,
  deletionData: {
    studioName: string;
    ownerName: string;
    deletionDate: string;
    cancelUrl: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_STUDIO_DELETION_WARNING_EMAIL',
        ownerEmail,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      StudioDeletionWarningTemplate({
        ...deletionData,
        locale,
      })
    );

    const textContent = getPlainTextStudioDeletionWarning(
      deletionData.studioName,
      deletionData.ownerName,
      deletionData.deletionDate,
      deletionData.cancelUrl,
      locale
    );

    const subject = locale === 'de'
      ? `Studio-Löschung geplant - ${deletionData.studioName}`
      : `Studio Deletion Scheduled - ${deletionData.studioName}`;

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: ownerEmail,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'studio-deletion-warning' },
        { name: 'locale', value: locale },
        { name: 'studio', value: sanitizeTagValue(deletionData.studioName) },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_STUDIO_DELETION_WARNING_EMAIL',
        ownerEmail,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Studio deletion warning email sent successfully', {
      action: 'SEND_STUDIO_DELETION_WARNING_EMAIL',
      ownerEmail,
      deletionDate: deletionData.deletionDate,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_STUDIO_DELETION_WARNING_EMAIL',
      ownerEmail,
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
 * Send studio deletion confirmed email
 * TASK 3.4: Confirms studio deletion to owner
 *
 * @param ownerEmail - Studio owner email address
 * @param deletionData - Deletion confirmation information
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendStudioDeletionConfirmedEmail(
  ownerEmail: string,
  deletionData: {
    studioName: string;
    ownerName: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_STUDIO_DELETION_CONFIRMED_EMAIL',
        ownerEmail,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      StudioDeletionConfirmedTemplate({
        ...deletionData,
        locale,
      })
    );

    const textContent = getPlainTextStudioDeletionConfirmed(
      deletionData.studioName,
      deletionData.ownerName,
      locale
    );

    const subject = locale === 'de'
      ? `Studio gelöscht - ${deletionData.studioName}`
      : `Studio Deleted - ${deletionData.studioName}`;

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: ownerEmail,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'studio-deletion-confirmed' },
        { name: 'locale', value: locale },
        { name: 'studio', value: sanitizeTagValue(deletionData.studioName) },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_STUDIO_DELETION_CONFIRMED_EMAIL',
        ownerEmail,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Studio deletion confirmed email sent successfully', {
      action: 'SEND_STUDIO_DELETION_CONFIRMED_EMAIL',
      ownerEmail,
      messageId: result.data?.id,
      locale,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_STUDIO_DELETION_CONFIRMED_EMAIL',
      ownerEmail,
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
 * Send review request email (24 hours after appointment)
 * @param email - Customer email address
 * @param reviewDetails - Review request details
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendReviewRequestEmail(
  email: string,
  reviewDetails: {
    customerName: string;
    studioName: string;
    serviceName: string;
    bookingDate: string;
    reviewUrl: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_REVIEW_REQUEST_EMAIL',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      ReviewRequestTemplate({
        ...reviewDetails,
        locale,
      })
    );

    const textContent = getPlainTextReviewRequest(
      reviewDetails.customerName,
      reviewDetails.studioName,
      reviewDetails.serviceName,
      reviewDetails.bookingDate,
      reviewDetails.reviewUrl,
      locale
    );

    const subject = locale === 'de'
      ? 'Wie war Ihr Termin? - Massava'
      : 'How was your appointment? - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'review-request' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_REVIEW_REQUEST_EMAIL',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Review request email sent successfully', {
      action: 'SEND_REVIEW_REQUEST_EMAIL',
      email,
      messageId: result.data?.id,
      locale,
      studioName: reviewDetails.studioName,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_REVIEW_REQUEST_EMAIL',
      email,
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
 * Send customer cancellation confirmation email (Task 4.3)
 * @param email - Customer email address
 * @param cancellationData - Cancellation details
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
export async function sendCustomerCancellationConfirmation(
  email: string,
  cancellationData: {
    customerName: string;
    bookingId: string;
    studioName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    rebookUrl: string;
  },
  locale: string = 'de'
): Promise<SendEmailResult> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('Email sending failed: RESEND_API_KEY not configured', {
        action: 'SEND_CUSTOMER_CANCELLATION_CONFIRMATION',
        email,
      });
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render email template
    const htmlContent = await render(
      CustomerCancellationConfirmationTemplate({
        ...cancellationData,
        locale,
      })
    );

    const textContent = getPlainTextCustomerCancellationConfirmation(
      cancellationData.customerName,
      cancellationData.bookingId,
      cancellationData.studioName,
      cancellationData.serviceName,
      cancellationData.bookingDate,
      cancellationData.bookingTime,
      cancellationData.rebookUrl,
      locale
    );

    const subject = locale === 'de'
      ? 'Buchung storniert - Massava'
      : 'Booking Cancelled - Massava';

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: `Massava <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'customer-cancellation-confirmation' },
        { name: 'locale', value: locale },
      ],
    });

    if (result.error) {
      logger.error('Email sending failed', {
        action: 'SEND_CUSTOMER_CANCELLATION_CONFIRMATION',
        email,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    logger.info('Customer cancellation confirmation email sent successfully', {
      action: 'SEND_CUSTOMER_CANCELLATION_CONFIRMATION',
      email,
      messageId: result.data?.id,
      locale,
      bookingId: cancellationData.bookingId,
      studioName: cancellationData.studioName,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Email sending exception', {
      action: 'SEND_CUSTOMER_CANCELLATION_CONFIRMATION',
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
