"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Sending Service with Resend
 * STRATEGY.md Section 8.2 - Phase 2.5 Quick Wins
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.isEmailConfigured = isEmailConfigured;
const resend_1 = require("resend");
const render_1 = require("@react-email/render");
const templates_1 = require("./templates");
const logger_1 = require("@/lib/logger");
// Lazy initialization of Resend client
let resendClient = null;
function getResendClient() {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resendClient = new resend_1.Resend(apiKey);
    }
    return resendClient;
}
// Default sender email
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@massava.app';
/**
 * Send email verification email
 * @param email - Recipient email address
 * @param verificationUrl - URL with verification token
 * @param locale - Language locale (de/en)
 * @returns Result object with success status
 */
async function sendVerificationEmail(email, verificationUrl, locale = 'de') {
    try {
        // Check if Resend API key is configured
        if (!process.env.RESEND_API_KEY) {
            logger_1.logger.error('Email sending failed: RESEND_API_KEY not configured', {
                action: 'SEND_VERIFICATION_EMAIL',
                email,
            });
            return {
                success: false,
                error: 'Email service not configured',
            };
        }
        // Render email template
        const htmlContent = await (0, render_1.render)((0, templates_1.EmailVerificationTemplate)({
            verificationUrl,
            locale,
        }));
        const textContent = (0, templates_1.getPlainTextVerification)(verificationUrl, locale);
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
            logger_1.logger.error('Email sending failed', {
                action: 'SEND_VERIFICATION_EMAIL',
                email,
                error: result.error.message,
            });
            return {
                success: false,
                error: result.error.message,
            };
        }
        logger_1.logger.info('Verification email sent successfully', {
            action: 'SEND_VERIFICATION_EMAIL',
            email,
            messageId: result.data?.id,
            locale,
        });
        return {
            success: true,
            messageId: result.data?.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Email sending exception', {
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
async function sendWelcomeEmail(email, name, locale = 'de') {
    try {
        // Check if Resend API key is configured
        if (!process.env.RESEND_API_KEY) {
            logger_1.logger.error('Email sending failed: RESEND_API_KEY not configured', {
                action: 'SEND_WELCOME_EMAIL',
                email,
            });
            return {
                success: false,
                error: 'Email service not configured',
            };
        }
        // Render email template
        const htmlContent = await (0, render_1.render)((0, templates_1.WelcomeEmailTemplate)({
            name,
            locale,
        }));
        const textContent = (0, templates_1.getPlainTextWelcome)(name, locale);
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
            logger_1.logger.error('Email sending failed', {
                action: 'SEND_WELCOME_EMAIL',
                email,
                error: result.error.message,
            });
            return {
                success: false,
                error: result.error.message,
            };
        }
        logger_1.logger.info('Welcome email sent successfully', {
            action: 'SEND_WELCOME_EMAIL',
            email,
            messageId: result.data?.id,
            locale,
        });
        return {
            success: true,
            messageId: result.data?.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Email sending exception', {
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
async function sendPasswordResetEmail(email, resetUrl, locale = 'de') {
    try {
        // Check if Resend API key is configured
        if (!process.env.RESEND_API_KEY) {
            logger_1.logger.error('Email sending failed: RESEND_API_KEY not configured', {
                action: 'SEND_PASSWORD_RESET_EMAIL',
                email,
            });
            return {
                success: false,
                error: 'Email service not configured',
            };
        }
        // Render email template
        const htmlContent = await (0, render_1.render)((0, templates_1.PasswordResetTemplate)({
            resetUrl,
            locale,
        }));
        const textContent = (0, templates_1.getPlainTextPasswordReset)(resetUrl, locale);
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
            logger_1.logger.error('Email sending failed', {
                action: 'SEND_PASSWORD_RESET_EMAIL',
                email,
                error: result.error.message,
            });
            return {
                success: false,
                error: result.error.message,
            };
        }
        logger_1.logger.info('Password reset email sent successfully', {
            action: 'SEND_PASSWORD_RESET_EMAIL',
            email,
            messageId: result.data?.id,
            locale,
        });
        return {
            success: true,
            messageId: result.data?.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Email sending exception', {
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
function isEmailConfigured() {
    return !!process.env.RESEND_API_KEY;
}
