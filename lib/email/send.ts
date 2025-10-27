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
  getPlainTextVerification,
  getPlainTextWelcome,
  getPlainTextPasswordReset,
} from './templates';
import { logger } from '@/lib/logger';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@rnltlabs.de';

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
    const result = await resend.emails.send({
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
    const result = await resend.emails.send({
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
    const result = await resend.emails.send({
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
 * Test email configuration (for development/testing)
 * @returns true if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
