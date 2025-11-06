"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Deletion Notification System
 * Sends warning emails before scheduled data deletion
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDeletionWarningEmail = sendDeletionWarningEmail;
exports.sendFinalWarningEmail = sendFinalWarningEmail;
exports.sendDeletionConfirmationEmail = sendDeletionConfirmationEmail;
const render_1 = require("@react-email/render");
const resend_1 = require("resend");
const logger_1 = require("@/lib/logger");
const audit_1 = require("@/lib/audit");
const React = __importStar(require("react"));
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
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@massava.app';
/**
 * Email Template: 7-Day Deletion Warning
 */
const DeletionWarningTemplate = ({ name, daysUntilDeletion, cancelUrl, locale = 'de', }) => {
    const styles = {
        container: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0',
            backgroundColor: '#ffffff',
        },
        header: {
            background: 'linear-gradient(135deg, #7c9885 0%, #9cb5a3 100%)',
            padding: '48px 20px',
            textAlign: 'center',
            marginBottom: '40px',
        },
        logo: {
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '0.5px',
        },
        content: {
            padding: '0 32px 40px 32px',
        },
        heading: {
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            marginBottom: '16px',
        },
        text: {
            fontSize: '16px',
            color: '#4a5568',
            lineHeight: '1.7',
            marginBottom: '20px',
        },
        warning: {
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '8px',
            fontSize: '15px',
            color: '#92400e',
            marginBottom: '24px',
            lineHeight: '1.6',
            fontWeight: '600',
        },
        button: {
            display: 'inline-block',
            padding: '16px 40px',
            background: 'linear-gradient(135deg, #7c9885 0%, #9cb5a3 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            margin: '20px 0',
        },
        buttonContainer: {
            textAlign: 'center',
            margin: '32px 0',
        },
        footer: {
            marginTop: '48px',
            padding: '32px',
            backgroundColor: '#f9fafb',
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: '1.6',
        },
    };
    const content = locale === 'de' ? {
        greeting: `Hallo ${name},`,
        subject: 'Wichtig: Ihr Massava-Konto wird bald gelöscht',
        warningText: `⚠️ Ihr Konto wird in ${daysUntilDeletion} Tagen gelöscht`,
        bodyText1: 'Wir haben festgestellt, dass Sie Ihr Massava-Konto längere Zeit nicht genutzt haben.',
        bodyText2: `Gemäß unserer Datenschutzrichtlinien und DSGVO-Anforderungen werden inaktive Konten nach 3 Jahren automatisch gelöscht.`,
        bodyText3: 'Was wird gelöscht:',
        listItems: [
            'Ihr Benutzerprofil und persönliche Daten',
            'Ihre Buchungshistorie (außer steuerrechtlich erforderliche Rechnungen)',
            'Ihre gespeicherten Favoriten',
            'Ihre Kontodaten',
        ],
        bodyText4: 'Wenn Sie Ihr Konto behalten möchten, klicken Sie einfach auf den Button unten. Ihr Konto bleibt dann weitere 3 Jahre aktiv.',
        buttonText: 'Konto behalten',
        footerText1: 'Sie müssen nichts tun, wenn Sie möchten, dass Ihr Konto gelöscht wird.',
        footerText2: 'Falls Sie Fragen haben, kontaktieren Sie uns unter support@massava.app',
        footerText3: 'Diese E-Mail wurde automatisch generiert aufgrund unserer DSGVO-Compliance-Richtlinien.',
    } : {
        greeting: `Hello ${name},`,
        subject: 'Important: Your Massava account will be deleted soon',
        warningText: `⚠️ Your account will be deleted in ${daysUntilDeletion} days`,
        bodyText1: 'We noticed that you haven\'t used your Massava account for an extended period.',
        bodyText2: 'According to our privacy policy and GDPR requirements, inactive accounts are automatically deleted after 3 years.',
        bodyText3: 'What will be deleted:',
        listItems: [
            'Your user profile and personal data',
            'Your booking history (except tax-required invoices)',
            'Your saved favorites',
            'Your account credentials',
        ],
        bodyText4: 'If you want to keep your account, simply click the button below. Your account will remain active for another 3 years.',
        buttonText: 'Keep My Account',
        footerText1: 'You don\'t need to do anything if you want your account to be deleted.',
        footerText2: 'If you have questions, contact us at support@massava.app',
        footerText3: 'This email was automatically generated due to our GDPR compliance policies.',
    };
    return (<div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Massava</div>
      </div>
      <div style={styles.content}>
        <div style={styles.heading}>{content.greeting}</div>
        <div style={styles.warning}>{content.warningText}</div>
        <p style={styles.text}>{content.bodyText1}</p>
        <p style={styles.text}>{content.bodyText2}</p>
        <p style={styles.text}><strong>{content.bodyText3}</strong></p>
        <ul>
          {content.listItems.map((item, index) => (<li key={index} style={{ ...styles.text, marginBottom: '8px' }}>{item}</li>))}
        </ul>
        <p style={styles.text}>{content.bodyText4}</p>
        <div style={styles.buttonContainer}>
          <a href={cancelUrl} style={styles.button}>
            {content.buttonText}
          </a>
        </div>
      </div>
      <div style={styles.footer}>
        <p>{content.footerText1}</p>
        <p>{content.footerText2}</p>
        <p style={{ marginTop: '16px', fontSize: '12px' }}>{content.footerText3}</p>
      </div>
    </div>);
};
/**
 * Email Template: 24-Hour Final Warning
 */
const FinalWarningTemplate = ({ name, cancelUrl, locale = 'de', }) => {
    const styles = {
        container: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0',
            backgroundColor: '#ffffff',
        },
        header: {
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            padding: '48px 20px',
            textAlign: 'center',
            marginBottom: '40px',
        },
        logo: {
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '8px',
        },
        content: {
            padding: '0 32px 40px 32px',
        },
        heading: {
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#dc2626',
            marginBottom: '16px',
        },
        text: {
            fontSize: '16px',
            color: '#4a5568',
            lineHeight: '1.7',
            marginBottom: '20px',
        },
        critical: {
            padding: '20px',
            backgroundColor: '#fee2e2',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            fontSize: '16px',
            color: '#991b1b',
            marginBottom: '24px',
            lineHeight: '1.6',
            fontWeight: '700',
            textAlign: 'center',
        },
        button: {
            display: 'inline-block',
            padding: '16px 40px',
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            margin: '20px 0',
        },
        buttonContainer: {
            textAlign: 'center',
            margin: '32px 0',
        },
        footer: {
            marginTop: '48px',
            padding: '32px',
            backgroundColor: '#f9fafb',
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: '1.6',
        },
    };
    const content = locale === 'de' ? {
        greeting: `Hallo ${name},`,
        subject: 'LETZTE WARNUNG: Ihr Konto wird in 24 Stunden gelöscht',
        criticalText: '🚨 LETZTE CHANCE: Ihr Konto wird in 24 Stunden unwiderruflich gelöscht',
        bodyText1: 'Dies ist Ihre letzte Warnung. Wenn Sie nicht innerhalb der nächsten 24 Stunden handeln, wird Ihr Massava-Konto permanent gelöscht.',
        bodyText2: 'Diese Löschung ist endgültig und kann nicht rückgängig gemacht werden.',
        bodyText3: 'Um die Löschung zu stoppen und Ihr Konto zu behalten, klicken Sie JETZT auf den Button:',
        buttonText: 'KONTO SOFORT BEHALTEN',
        footerText1: 'Nach 24 Stunden ist diese Aktion nicht mehr möglich.',
        footerText2: 'Bei Fragen: support@massava.app',
    } : {
        greeting: `Hello ${name},`,
        subject: 'FINAL WARNING: Your account will be deleted in 24 hours',
        criticalText: '🚨 LAST CHANCE: Your account will be permanently deleted in 24 hours',
        bodyText1: 'This is your final warning. If you don\'t act within the next 24 hours, your Massava account will be permanently deleted.',
        bodyText2: 'This deletion is final and cannot be undone.',
        bodyText3: 'To stop the deletion and keep your account, click the button NOW:',
        buttonText: 'KEEP MY ACCOUNT NOW',
        footerText1: 'After 24 hours, this action will no longer be possible.',
        footerText2: 'Questions? support@massava.app',
    };
    return (<div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Massava</div>
      </div>
      <div style={styles.content}>
        <div style={styles.heading}>{content.greeting}</div>
        <div style={styles.critical}>{content.criticalText}</div>
        <p style={styles.text}><strong>{content.bodyText1}</strong></p>
        <p style={styles.text}>{content.bodyText2}</p>
        <p style={styles.text}>{content.bodyText3}</p>
        <div style={styles.buttonContainer}>
          <a href={cancelUrl} style={styles.button}>
            {content.buttonText}
          </a>
        </div>
      </div>
      <div style={styles.footer}>
        <p><strong>{content.footerText1}</strong></p>
        <p>{content.footerText2}</p>
      </div>
    </div>);
};
/**
 * Get plain text version of deletion warning email
 */
function getPlainTextDeletionWarning(name, daysUntilDeletion, cancelUrl, locale = 'de') {
    if (locale === 'de') {
        return `
Hallo ${name},

⚠️ Ihr Konto wird in ${daysUntilDeletion} Tagen gelöscht

Wir haben festgestellt, dass Sie Ihr Massava-Konto längere Zeit nicht genutzt haben.

Gemäß unserer Datenschutzrichtlinien und DSGVO-Anforderungen werden inaktive Konten nach 3 Jahren automatisch gelöscht.

Was wird gelöscht:
- Ihr Benutzerprofil und persönliche Daten
- Ihre Buchungshistorie (außer steuerrechtlich erforderliche Rechnungen)
- Ihre gespeicherten Favoriten
- Ihre Kontodaten

Wenn Sie Ihr Konto behalten möchten, öffnen Sie diesen Link:
${cancelUrl}

Sie müssen nichts tun, wenn Sie möchten, dass Ihr Konto gelöscht wird.

Bei Fragen kontaktieren Sie uns unter support@massava.app

Diese E-Mail wurde automatisch generiert aufgrund unserer DSGVO-Compliance-Richtlinien.

---
Massava - Wellness & Massage Buchungsplattform
    `.trim();
    }
    else {
        return `
Hello ${name},

⚠️ Your account will be deleted in ${daysUntilDeletion} days

We noticed that you haven't used your Massava account for an extended period.

According to our privacy policy and GDPR requirements, inactive accounts are automatically deleted after 3 years.

What will be deleted:
- Your user profile and personal data
- Your booking history (except tax-required invoices)
- Your saved favorites
- Your account credentials

If you want to keep your account, open this link:
${cancelUrl}

You don't need to do anything if you want your account to be deleted.

If you have questions, contact us at support@massava.app

This email was automatically generated due to our GDPR compliance policies.

---
Massava - Wellness & Massage Booking Platform
    `.trim();
    }
}
/**
 * Get plain text version of final warning email
 */
function getPlainTextFinalWarning(name, cancelUrl, locale = 'de') {
    if (locale === 'de') {
        return `
Hallo ${name},

🚨 LETZTE CHANCE: Ihr Konto wird in 24 Stunden unwiderruflich gelöscht

Dies ist Ihre letzte Warnung. Wenn Sie nicht innerhalb der nächsten 24 Stunden handeln, wird Ihr Massava-Konto permanent gelöscht.

Diese Löschung ist endgültig und kann nicht rückgängig gemacht werden.

Um die Löschung zu stoppen, öffnen Sie JETZT diesen Link:
${cancelUrl}

Nach 24 Stunden ist diese Aktion nicht mehr möglich.

Bei Fragen: support@massava.app

---
Massava
    `.trim();
    }
    else {
        return `
Hello ${name},

🚨 LAST CHANCE: Your account will be permanently deleted in 24 hours

This is your final warning. If you don't act within the next 24 hours, your Massava account will be permanently deleted.

This deletion is final and cannot be undone.

To stop the deletion, open this link NOW:
${cancelUrl}

After 24 hours, this action will no longer be possible.

Questions? support@massava.app

---
Massava
    `.trim();
    }
}
/**
 * Send 7-day deletion warning email
 */
async function sendDeletionWarningEmail(userId, email, name, daysUntilDeletion, locale = 'de') {
    try {
        if (!process.env.RESEND_API_KEY) {
            logger_1.logger.error('Email sending failed: RESEND_API_KEY not configured', {
                action: 'SEND_DELETION_WARNING',
                userId,
            });
            return {
                success: false,
                error: 'Email service not configured',
            };
        }
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/cancel-deletion?userId=${userId}`;
        const htmlContent = await (0, render_1.render)(React.createElement(DeletionWarningTemplate, {
            name,
            daysUntilDeletion,
            cancelUrl,
            locale,
        }));
        const textContent = getPlainTextDeletionWarning(name, daysUntilDeletion, cancelUrl, locale);
        const subject = locale === 'de'
            ? `Wichtig: Ihr Massava-Konto wird in ${daysUntilDeletion} Tagen gelöscht`
            : `Important: Your Massava account will be deleted in ${daysUntilDeletion} days`;
        const result = await getResendClient().emails.send({
            from: `Massava <${FROM_EMAIL}>`,
            to: email,
            subject,
            html: htmlContent,
            text: textContent,
            tags: [
                { name: 'type', value: 'deletion-warning' },
                { name: 'locale', value: locale },
            ],
        });
        if (result.error) {
            logger_1.logger.error('Deletion warning email failed', {
                action: 'SEND_DELETION_WARNING',
                userId,
                error: result.error.message,
            });
            return {
                success: false,
                error: result.error.message,
            };
        }
        await (0, audit_1.createAuditLog)({
            userId,
            action: 'USER_UPDATED',
            resource: 'user',
            resourceId: userId,
            metadata: {
                action: 'deletion_warning_sent',
                daysUntilDeletion,
            },
        });
        logger_1.logger.info('Deletion warning email sent', {
            action: 'SEND_DELETION_WARNING',
            userId,
            daysUntilDeletion,
            messageId: result.data?.id,
        });
        return {
            success: true,
            messageId: result.data?.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Deletion warning email exception', {
            action: 'SEND_DELETION_WARNING',
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Send 24-hour final warning email
 */
async function sendFinalWarningEmail(userId, email, name, locale = 'de') {
    try {
        if (!process.env.RESEND_API_KEY) {
            logger_1.logger.error('Email sending failed: RESEND_API_KEY not configured', {
                action: 'SEND_FINAL_WARNING',
                userId,
            });
            return {
                success: false,
                error: 'Email service not configured',
            };
        }
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/cancel-deletion?userId=${userId}`;
        const htmlContent = await (0, render_1.render)(React.createElement(FinalWarningTemplate, {
            name,
            daysUntilDeletion: 1,
            cancelUrl,
            locale,
        }));
        const textContent = getPlainTextFinalWarning(name, cancelUrl, locale);
        const subject = locale === 'de'
            ? 'LETZTE WARNUNG: Ihr Konto wird in 24 Stunden gelöscht'
            : 'FINAL WARNING: Your account will be deleted in 24 hours';
        const result = await getResendClient().emails.send({
            from: `Massava <${FROM_EMAIL}>`,
            to: email,
            subject,
            html: htmlContent,
            text: textContent,
            tags: [
                { name: 'type', value: 'final-warning' },
                { name: 'locale', value: locale },
            ],
        });
        if (result.error) {
            logger_1.logger.error('Final warning email failed', {
                action: 'SEND_FINAL_WARNING',
                userId,
                error: result.error.message,
            });
            return {
                success: false,
                error: result.error.message,
            };
        }
        await (0, audit_1.createAuditLog)({
            userId,
            action: 'USER_UPDATED',
            resource: 'user',
            resourceId: userId,
            metadata: {
                action: 'final_warning_sent',
            },
        });
        logger_1.logger.info('Final warning email sent', {
            action: 'SEND_FINAL_WARNING',
            userId,
            messageId: result.data?.id,
        });
        return {
            success: true,
            messageId: result.data?.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Final warning email exception', {
            action: 'SEND_FINAL_WARNING',
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Send account deletion confirmation email
 */
async function sendDeletionConfirmationEmail(email, name, locale = 'de') {
    try {
        if (!process.env.RESEND_API_KEY) {
            logger_1.logger.error('Email sending failed: RESEND_API_KEY not configured', {
                action: 'SEND_DELETION_CONFIRMATION',
                email,
            });
            return {
                success: false,
                error: 'Email service not configured',
            };
        }
        const content = locale === 'de' ? {
            subject: 'Ihr Massava-Konto wurde gelöscht',
            greeting: `Hallo ${name},`,
            bodyText: 'Ihr Massava-Konto wurde erfolgreich gelöscht. Alle Ihre persönlichen Daten wurden gemäß DSGVO-Richtlinien entfernt.',
            bodyText2: 'Sie können jederzeit ein neues Konto erstellen, wenn Sie unsere Dienste wieder nutzen möchten.',
            footerText: 'Vielen Dank, dass Sie Massava genutzt haben.',
        } : {
            subject: 'Your Massava account has been deleted',
            greeting: `Hello ${name},`,
            bodyText: 'Your Massava account has been successfully deleted. All your personal data has been removed according to GDPR guidelines.',
            bodyText2: 'You can create a new account anytime if you want to use our services again.',
            footerText: 'Thank you for using Massava.',
        };
        const result = await getResendClient().emails.send({
            from: `Massava <${FROM_EMAIL}>`,
            to: email,
            subject: content.subject,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <p>${content.greeting}</p>
          <p>${content.bodyText}</p>
          <p>${content.bodyText2}</p>
          <p style="margin-top: 32px; color: #6b7280;">${content.footerText}</p>
        </div>
      `,
            text: `${content.greeting}\n\n${content.bodyText}\n\n${content.bodyText2}\n\n${content.footerText}`,
            tags: [
                { name: 'type', value: 'deletion-confirmation' },
                { name: 'locale', value: locale },
            ],
        });
        if (result.error) {
            logger_1.logger.error('Deletion confirmation email failed', {
                action: 'SEND_DELETION_CONFIRMATION',
                email,
                error: result.error.message,
            });
            return {
                success: false,
                error: result.error.message,
            };
        }
        logger_1.logger.info('Deletion confirmation email sent', {
            action: 'SEND_DELETION_CONFIRMATION',
            email,
            messageId: result.data?.id,
        });
        return {
            success: true,
            messageId: result.data?.id,
        };
    }
    catch (error) {
        logger_1.logger.error('Deletion confirmation email exception', {
            action: 'SEND_DELETION_CONFIRMATION',
            email,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
