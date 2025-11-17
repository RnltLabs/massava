/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Templates - Massava Corporate Design
 * Unified design system matching massava.app website
 */

import * as React from 'react';

// Massava Corporate Design Colors - Matching Website
// Based on globals.css OKLCH values
const COLORS = {
  // Primary brand colors - Warm Wellness Tones
  primary: '#a67c52', // Warm terracotta (oklch(0.55 0.12 35))
  primaryLight: '#c39a76', // Light terracotta
  primaryDark: '#8b6842', // Dark terracotta

  // Accent color - Sage Green
  accent: '#93a08a', // Sage green (oklch(0.62 0.08 140))
  accentLight: '#b0baa9',
  accentDark: '#7a8771',

  // Secondary - Warm Sand/Beige
  secondary: '#e0d7c8', // Warm sand (oklch(0.88 0.03 80))
  secondaryDark: '#cfc6b7',

  // Neutral colors - Warm Earth Palette
  white: '#ffffff',
  background: '#f2f0ec', // Warm cream (oklch(0.95 0.01 60))
  cardBg: '#faf9f7', // Soft warm white (oklch(0.98 0.008 50))

  textPrimary: '#3d3630', // Warm dark brown (oklch(0.25 0.02 40))
  textSecondary: '#6b5f52', // Warm medium brown
  textMuted: '#8c7e6f', // Warm muted brown (oklch(0.45 0.02 40))

  // UI colors
  border: '#dfd9d0', // Warm border (oklch(0.88 0.015 60))
  success: '#6b9f7b', // Warm green
  warning: '#d4a574', // Warm gold
  error: '#c97a6a', // Warm red
};

// Massava Email Template Styles - Corporate Design
const styles = {
  // Container
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '640px',
    margin: '0 auto',
    backgroundColor: COLORS.white,
  },

  // Header with warm terracotta gradient matching website
  header: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
    padding: '56px 24px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },

  // Organic decorative elements in header (matching website blobs)
  headerDecoration: {
    position: 'absolute' as const,
    width: '300px',
    height: '300px',
    background: `${COLORS.accent}33`, // 20% opacity
    borderRadius: '50% 40% 60% 50%',
    top: '-100px',
    right: '-50px',
    opacity: '0.3',
  },

  logo: {
    fontSize: '42px',
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: '12px',
    letterSpacing: '1px',
    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'relative' as const,
    zIndex: 1,
  },

  tagline: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    letterSpacing: '0.5px',
    position: 'relative' as const,
    zIndex: 1,
  },

  // Content area with warm background
  content: {
    padding: '48px 32px',
    backgroundColor: COLORS.white,
  },

  greeting: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: '24px',
    lineHeight: '1.3',
  },

  text: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: '1.8',
    marginBottom: '20px',
  },

  textBold: {
    fontSize: '16px',
    color: COLORS.textPrimary,
    lineHeight: '1.8',
    fontWeight: '600',
    marginBottom: '16px',
  },

  // Primary CTA button with terracotta gradient
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '40px 0',
  },

  button: {
    display: 'inline-block',
    padding: '18px 48px',
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
    color: COLORS.white,
    textDecoration: 'none',
    borderRadius: '24px', // Extra soft organic corners (matching 1.5rem radius)
    fontSize: '17px',
    fontWeight: '600',
    textAlign: 'center' as const,
    boxShadow: `0 4px 16px ${COLORS.primary}55`,
    transition: 'all 0.3s ease',
  },

  // Secondary button with sage green
  buttonSecondary: {
    display: 'inline-block',
    padding: '16px 40px',
    backgroundColor: 'transparent',
    color: COLORS.accent,
    textDecoration: 'none',
    border: `2px solid ${COLORS.accent}`,
    borderRadius: '24px',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center' as const,
    transition: 'all 0.3s ease',
  },

  // Info boxes with warm colors
  infoBox: {
    padding: '20px 24px',
    backgroundColor: `${COLORS.accent}15`, // 8% opacity
    border: `2px solid ${COLORS.accent}40`, // 25% opacity
    borderRadius: '16px',
    marginBottom: '24px',
  },

  successBox: {
    padding: '20px 24px',
    backgroundColor: `${COLORS.success}15`,
    border: `2px solid ${COLORS.success}50`,
    borderRadius: '16px',
    marginBottom: '24px',
  },

  warningBox: {
    padding: '20px 24px',
    backgroundColor: `${COLORS.warning}15`,
    border: `2px solid ${COLORS.warning}50`,
    borderRadius: '16px',
    marginBottom: '24px',
  },

  errorBox: {
    padding: '20px 24px',
    backgroundColor: `${COLORS.error}15`,
    border: `2px solid ${COLORS.error}50`,
    borderRadius: '16px',
    marginBottom: '24px',
  },

  highlightBox: {
    padding: '20px 24px',
    backgroundColor: `${COLORS.primary}10`, // 6% opacity
    border: `2px solid ${COLORS.primary}30`, // 19% opacity
    borderRadius: '16px',
    marginBottom: '24px',
  },

  // Booking details card with warm tones
  bookingCard: {
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '20px', // Organic corners
    padding: '32px',
    marginBottom: '32px',
  },

  bookingDetailLabel: {
    fontSize: '13px',
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: '6px',
  },

  bookingDetailValue: {
    fontSize: '18px',
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: '0',
  },

  // List styling
  list: {
    marginLeft: '0',
    paddingLeft: '0',
    listStyleType: 'none',
  },

  listItem: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: '1.8',
    marginBottom: '12px',
    paddingLeft: '28px',
    position: 'relative' as const,
  },

  // Footer with warm background
  footer: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    lineHeight: '1.8',
    marginTop: '32px',
    textAlign: 'center' as const,
  },

  footerSection: {
    marginTop: '48px',
    padding: '40px 32px',
    backgroundColor: COLORS.background,
    borderTop: `1px solid ${COLORS.border}`,
    textAlign: 'center' as const,
  },

  footerText: {
    fontSize: '14px',
    color: COLORS.textMuted,
    lineHeight: '1.8',
    marginBottom: '8px',
  },

  helpText: {
    fontSize: '14px',
    color: COLORS.textMuted,
    lineHeight: '1.8',
    marginBottom: '16px',
  },

  footerLink: {
    color: COLORS.primary,
    textDecoration: 'underline',
    fontWeight: '500',
  },

  copyright: {
    fontSize: '13px',
    color: COLORS.textMuted,
    marginTop: '24px',
  },

  divider: {
    borderTop: `1px solid ${COLORS.border}`,
    margin: '32px 0',
  },

  link: {
    color: COLORS.primary,
    textDecoration: 'underline',
    fontWeight: '500',
  },
};

// ============================================================================
// BASE LAYOUT COMPONENT
// ============================================================================

interface EmailLayoutProps {
  children: React.ReactNode;
}

function EmailLayout({ children }: EmailLayoutProps): React.ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerDecoration}></div>
        <div style={styles.logo}>Massava</div>
        <div style={styles.tagline}>Ihre Wellness-Buchungsplattform</div>
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// EMAIL VERIFICATION TEMPLATE
// ============================================================================

interface EmailVerificationTemplateProps {
  verificationUrl: string;
  locale?: string;
}

export function EmailVerificationTemplate({
  verificationUrl,
  locale = 'de',
}: EmailVerificationTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Verifizieren Sie Ihre E-Mail-Adresse - Massava',
      greeting: 'Willkommen bei Massava! 👋',
      intro: 'Schön, dass Sie dabei sind! Bitte verifizieren Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren und die volle Funktionalität von Massava zu nutzen.',
      buttonText: 'E-Mail jetzt verifizieren',
      expiryTitle: 'Wichtig zu wissen:',
      expiryNotice: 'Dieser Verifizierungslink ist 24 Stunden gültig.',
      alternativeText: 'Falls der Button nicht funktioniert, können Sie auch diesen Link kopieren:',
      footer: 'Sie haben dieses Konto nicht erstellt? Dann können Sie diese E-Mail einfach ignorieren.',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Verify Your Email Address - Massava',
      greeting: 'Welcome to Massava! 👋',
      intro: 'Great to have you here! Please verify your email address to activate your account and enjoy the full functionality of Massava.',
      buttonText: 'Verify Email Now',
      expiryTitle: 'Important to know:',
      expiryNotice: 'This verification link is valid for 24 hours.',
      alternativeText: 'If the button doesn\'t work, you can copy this link:',
      footer: 'Didn\'t create this account? You can simply ignore this email.',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.buttonContainer}>
          <a href={verificationUrl} style={styles.button}>
            {t.buttonText}
          </a>
        </div>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>⏱ {t.expiryTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.expiryNotice}</p>
        </div>

        <p style={styles.text}>{t.alternativeText}</p>
        <p style={{ ...styles.text, wordBreak: 'break-all' as const, fontSize: '13px', backgroundColor: COLORS.background, padding: '12px', borderRadius: '12px' }}>
          {verificationUrl}
        </p>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// WELCOME EMAIL TEMPLATE
// ============================================================================

interface WelcomeEmailTemplateProps {
  name: string;
  locale?: string;
}

export function WelcomeEmailTemplate({
  name,
  locale = 'de',
}: WelcomeEmailTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Willkommen bei Massava! 🎉',
      greeting: `Hallo ${name}! 🌟`,
      intro: 'Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Willkommen in der Massava-Community!',
      whatNext: 'Das können Sie jetzt tun:',
      step1: '🔍 Wellness-Studios in Ihrer Nähe entdecken',
      step2: '📅 Ihren Wunschtermin schnell und einfach buchen',
      step3: '💆 Ihre Buchungen bequem online verwalten',
      step4: '⭐ Ihre Lieblings-Studios speichern',
      ctaText: 'Studios jetzt entdecken',
      support: 'Haben Sie Fragen oder Anregungen? Wir sind für Sie da!',
      supportEmail: 'Schreiben Sie uns: support@massava.app',
      footer: 'Wir wünschen Ihnen entspannte Momente mit Massava! 🧘',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Welcome to Massava! 🎉',
      greeting: `Hello ${name}! 🌟`,
      intro: 'Your email address has been successfully verified. Welcome to the Massava community!',
      whatNext: 'Here\'s what you can do now:',
      step1: '🔍 Discover wellness studios near you',
      step2: '📅 Book your preferred appointment quickly and easily',
      step3: '💆 Manage your bookings conveniently online',
      step4: '⭐ Save your favorite studios',
      ctaText: 'Discover Studios Now',
      support: 'Have questions or suggestions? We\'re here for you!',
      supportEmail: 'Contact us: support@massava.app',
      footer: 'We wish you relaxing moments with Massava! 🧘',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.successBox}>
          <p style={{ ...styles.textBold, marginBottom: '16px' }}>{t.whatNext}</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.step1}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.step2}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.step3}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.step4}
            </li>
          </ul>
        </div>

        <div style={styles.buttonContainer}>
          <a href={studiosUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <div style={styles.divider}></div>

        <p style={styles.textBold}>{t.support}</p>
        <p style={styles.text}>{t.supportEmail}</p>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// PASSWORD RESET TEMPLATE
// ============================================================================

interface PasswordResetTemplateProps {
  resetUrl: string;
  locale?: string;
}

export function PasswordResetTemplate({
  resetUrl,
  locale = 'de',
}: PasswordResetTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Passwort zurücksetzen - Massava',
      greeting: 'Passwort zurücksetzen 🔐',
      intro: 'Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den Button, um ein neues Passwort zu erstellen.',
      buttonText: 'Neues Passwort erstellen',
      expiryTitle: 'Wichtig:',
      expiryNotice: 'Dieser Link ist aus Sicherheitsgründen nur 1 Stunde gültig.',
      securityTitle: 'Sicherheitshinweis:',
      notRequested: 'Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt dann unverändert.',
      alternativeText: 'Alternativ können Sie diesen Link kopieren:',
      footer: 'Diese E-Mail wurde aus Sicherheitsgründen automatisch versendet.',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Reset Your Password - Massava',
      greeting: 'Reset Your Password 🔐',
      intro: 'You requested to reset your password. Click the button below to create a new password.',
      buttonText: 'Create New Password',
      expiryTitle: 'Important:',
      expiryNotice: 'For security reasons, this link is only valid for 1 hour.',
      securityTitle: 'Security Notice:',
      notRequested: 'If you didn\'t request this, you can ignore this email. Your password will remain unchanged.',
      alternativeText: 'Alternatively, you can copy this link:',
      footer: 'This email was sent automatically for security reasons.',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.buttonContainer}>
          <a href={resetUrl} style={styles.button}>
            {t.buttonText}
          </a>
        </div>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>⏱ {t.expiryTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.expiryNotice}</p>
        </div>

        <div style={styles.errorBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>🔒 {t.securityTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.notRequested}</p>
        </div>

        <p style={styles.text}>{t.alternativeText}</p>
        <p style={{ ...styles.text, wordBreak: 'break-all' as const, fontSize: '13px', backgroundColor: COLORS.background, padding: '12px', borderRadius: '12px' }}>
          {resetUrl}
        </p>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// EMAIL CHANGE VERIFICATION TEMPLATE
// ============================================================================

interface EmailChangeVerificationTemplateProps {
  userName: string;
  newEmail: string;
  verificationUrl: string;
  oldEmail: string;
  locale?: string;
}

export function EmailChangeVerificationTemplate({
  userName,
  newEmail,
  verificationUrl,
  oldEmail,
  locale = 'de',
}: EmailChangeVerificationTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'E-Mail-Adresse bestätigen - Massava',
      greeting: `Hallo ${userName}! 📧`,
      intro: 'Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert.',
      detailsTitle: 'Details der Änderung:',
      oldEmailLabel: 'Aktuelle E-Mail',
      newEmailLabel: 'Neue E-Mail',
      buttonText: 'E-Mail bestätigen',
      expiryTitle: 'Wichtig:',
      expiryNotice: 'Bestätigen Sie Ihre neue E-Mail-Adresse innerhalb von 24 Stunden.',
      securityTitle: 'Sicherheitshinweis:',
      notRequested: 'Falls Sie diese Änderung nicht vorgenommen haben, ignorieren Sie diese E-Mail und kontaktieren Sie uns umgehend.',
      alternativeText: 'Alternativ können Sie diesen Link kopieren:',
      footer: 'Diese E-Mail wurde aus Sicherheitsgründen automatisch versendet.',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Confirm Email Address - Massava',
      greeting: `Hello ${userName}! 📧`,
      intro: 'You have requested to change your email address.',
      detailsTitle: 'Change Details:',
      oldEmailLabel: 'Current Email',
      newEmailLabel: 'New Email',
      buttonText: 'Confirm Email',
      expiryTitle: 'Important:',
      expiryNotice: 'Please confirm your new email address within 24 hours.',
      securityTitle: 'Security Notice:',
      notRequested: 'If you did not make this change, please ignore this email and contact us immediately.',
      alternativeText: 'Alternatively, you can copy this link:',
      footer: 'This email was sent automatically for security reasons.',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.oldEmailLabel}</p>
            <p style={styles.bookingDetailValue}>{oldEmail}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.newEmailLabel}</p>
            <p style={styles.bookingDetailValue}>{newEmail}</p>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <a href={verificationUrl} style={styles.button}>
            {t.buttonText}
          </a>
        </div>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>⚠️ {t.expiryTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.expiryNotice}</p>
        </div>

        <div style={styles.errorBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>🔒 {t.securityTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.notRequested}</p>
        </div>

        <p style={styles.text}>{t.alternativeText}</p>
        <p style={{ ...styles.text, wordBreak: 'break-all' as const, fontSize: '13px', backgroundColor: COLORS.background, padding: '12px', borderRadius: '12px' }}>
          {verificationUrl}
        </p>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// BOOKING REQUEST RECEIVED TEMPLATE
// ============================================================================

interface BookingRequestReceivedTemplateProps {
  bookingId: string;
  customerName: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  message?: string;
  locale?: string;
}

export function BookingRequestReceivedTemplate({
  bookingId,
  customerName,
  studioName,
  serviceName,
  bookingDate,
  bookingTime,
  message,
  locale = 'de',
}: BookingRequestReceivedTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Buchungsanfrage erhalten - Massava',
      greeting: `Hallo ${customerName}! 👋`,
      intro: `Ihre Buchungsanfrage bei ${studioName} wurde erfolgreich übermittelt.`,
      detailsTitle: 'Ihre Buchungsanfrage:',
      bookingNumberLabel: 'Buchungsnummer',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      studioLabel: 'Studio',
      messageTitle: 'Ihre Nachricht:',
      statusTitle: 'Was passiert jetzt?',
      status1: '📧 Das Studio wurde über Ihre Anfrage informiert',
      status2: '⏳ Sie erhalten eine E-Mail, sobald das Studio Ihre Buchung bestätigt oder ablehnt',
      status3: '💼 Wir informieren Sie über jede Statusänderung',
      bookingNumberInfo: `Ihre Buchungsnummer: ${bookingId}`,
      bookingNumberNote: 'Bewahren Sie diese Nummer für Ihre Unterlagen auf.',
      ctaText: 'Weitere Studios entdecken',
      footer: 'Wir halten Sie auf dem Laufenden! 📬',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Booking Request Received - Massava',
      greeting: `Hello ${customerName}! 👋`,
      intro: `Your booking request at ${studioName} has been successfully submitted.`,
      detailsTitle: 'Your Booking Request:',
      bookingNumberLabel: 'Booking Number',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      studioLabel: 'Studio',
      messageTitle: 'Your Message:',
      statusTitle: 'What happens next?',
      status1: '📧 The studio has been notified of your request',
      status2: '⏳ You will receive an email once the studio confirms or declines your booking',
      status3: '💼 We will notify you of any status changes',
      bookingNumberInfo: `Your booking number: ${bookingId}`,
      bookingNumberNote: 'Keep this number for your records.',
      ctaText: 'Discover More Studios',
      footer: 'We\'ll keep you updated! 📬',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.infoBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.primary }}>✓ Anfrage übermittelt</p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.studioLabel}</p>
            <p style={styles.bookingDetailValue}>{studioName}</p>
          </div>
        </div>

        {message && (
          <div style={styles.infoBox}>
            <p style={{ ...styles.textBold, marginBottom: '8px' }}>💬 {t.messageTitle}</p>
            <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{message}</p>
          </div>
        )}

        <p style={styles.textBold}>{t.statusTitle}</p>

        <div style={styles.list}>
          <p style={styles.listItem}>{t.status1}</p>
          <p style={styles.listItem}>{t.status2}</p>
          <p style={styles.listItem}>{t.status3}</p>
        </div>

        <div style={styles.highlightBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px' }}>{t.bookingNumberInfo}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '14px' }}>{t.bookingNumberNote}</p>
        </div>

        <div style={styles.buttonContainer}>
          <a href={studiosUrl} style={styles.buttonSecondary}>
            {t.ctaText}
          </a>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// BOOKING CONFIRMATION TEMPLATE
// ============================================================================

interface BookingConfirmationTemplateProps {
  bookingId: string;
  customerName: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  studioAddress?: string;
  studioPhone?: string;
  message?: string;
  locale?: string;
}

export function BookingConfirmationTemplate({
  bookingId,
  customerName,
  studioName,
  serviceName,
  bookingDate,
  bookingTime,
  studioAddress,
  studioPhone,
  message,
  locale = 'de',
}: BookingConfirmationTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Buchung bestätigt - Massava',
      greeting: `Hallo ${customerName}! 🎉`,
      intro: `Gute Nachrichten! Ihre Buchung bei ${studioName} wurde bestätigt.`,
      detailsTitle: 'Ihre Buchungsdetails:',
      bookingNumberLabel: 'Buchungsnummer',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      studioLabel: 'Studio',
      addressLabel: 'Adresse',
      phoneLabel: 'Telefon',
      messageTitle: 'Nachricht vom Studio:',
      nextSteps: 'Was Sie jetzt tun können:',
      step1: '📅 Termin in Ihren Kalender eintragen',
      step2: '📍 Route zum Studio planen',
      step3: '📞 Bei Fragen das Studio kontaktieren',
      importantTitle: 'Wichtig:',
      importantText: 'Bitte erscheinen Sie pünktlich zu Ihrem Termin. Bei Verspätungen oder Terminänderungen kontaktieren Sie bitte direkt das Studio.',
      ctaText: 'Weitere Studios entdecken',
      footer: 'Wir wünschen Ihnen eine entspannende Zeit! 🧘',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Booking Confirmed - Massava',
      greeting: `Hello ${customerName}! 🎉`,
      intro: `Good news! Your booking at ${studioName} has been confirmed.`,
      detailsTitle: 'Your Booking Details:',
      bookingNumberLabel: 'Booking Number',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      studioLabel: 'Studio',
      addressLabel: 'Address',
      phoneLabel: 'Phone',
      messageTitle: 'Message from Studio:',
      nextSteps: 'What you can do now:',
      step1: '📅 Add appointment to your calendar',
      step2: '📍 Plan route to studio',
      step3: '📞 Contact studio if you have questions',
      importantTitle: 'Important:',
      importantText: 'Please arrive on time for your appointment. For delays or changes, please contact the studio directly.',
      ctaText: 'Discover More Studios',
      footer: 'We wish you a relaxing time! 🧘',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.successBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.success }}>✓ Buchung bestätigt</p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>

          <div style={{ marginBottom: studioAddress || studioPhone ? '20px' : '0' }}>
            <p style={styles.bookingDetailLabel}>{t.studioLabel}</p>
            <p style={styles.bookingDetailValue}>{studioName}</p>
          </div>

          {studioAddress && (
            <div style={{ marginBottom: studioPhone ? '20px' : '0' }}>
              <p style={styles.bookingDetailLabel}>{t.addressLabel}</p>
              <p style={{ ...styles.text, marginBottom: '0' }}>{studioAddress}</p>
            </div>
          )}

          {studioPhone && (
            <div>
              <p style={styles.bookingDetailLabel}>{t.phoneLabel}</p>
              <p style={{ ...styles.text, marginBottom: '0' }}>
                <a href={`tel:${studioPhone}`} style={styles.link}>{studioPhone}</a>
              </p>
            </div>
          )}
        </div>

        {message && (
          <div style={styles.infoBox}>
            <p style={{ ...styles.textBold, marginBottom: '8px' }}>💬 {t.messageTitle}</p>
            <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{message}</p>
          </div>
        )}

        <p style={styles.textBold}>{t.nextSteps}</p>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={{ position: 'absolute', left: '0' }}>✓</span>
            {t.step1}
          </li>
          <li style={styles.listItem}>
            <span style={{ position: 'absolute', left: '0' }}>✓</span>
            {t.step2}
          </li>
          <li style={styles.listItem}>
            <span style={{ position: 'absolute', left: '0' }}>✓</span>
            {t.step3}
          </li>
        </ul>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>⚠️ {t.importantTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.importantText}</p>
        </div>

        <div style={styles.buttonContainer}>
          <a href={studiosUrl} style={styles.buttonSecondary}>
            {t.ctaText}
          </a>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// BOOKING CANCELLATION TEMPLATE
// ============================================================================

interface BookingCancellationTemplateProps {
  bookingId: string;
  customerName: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationReason?: string;
  locale?: string;
}

export function BookingCancellationTemplate({
  bookingId,
  customerName,
  studioName,
  serviceName,
  bookingDate,
  bookingTime,
  cancellationReason,
  locale = 'de',
}: BookingCancellationTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Buchung abgelehnt - Massava',
      greeting: `Hallo ${customerName}`,
      intro: `Leider muss ${studioName} Ihre Buchungsanfrage ablehnen.`,
      detailsTitle: 'Details der abgelehnten Buchung:',
      bookingNumberLabel: 'Buchungsnummer',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      studioLabel: 'Studio',
      reasonTitle: 'Grund der Absage:',
      noReason: 'Kein spezifischer Grund angegeben',
      whatNextTitle: 'Was Sie jetzt tun können:',
      whatNext: 'Kein Problem! Bei Massava finden Sie viele weitere Studios und alternative Termine.',
      step1: '🔍 Andere Studios in Ihrer Nähe entdecken',
      step2: '📅 Alternative Termine finden',
      step3: '⭐ Vielleicht ein neues Lieblings-Studio entdecken',
      ctaText: 'Neuen Termin finden',
      support: 'Wir helfen Ihnen gerne, den perfekten Termin zu finden!',
      footer: 'Ihr Massava-Team',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Booking Declined - Massava',
      greeting: `Hello ${customerName}`,
      intro: `Unfortunately, ${studioName} has to decline your booking request.`,
      detailsTitle: 'Details of Declined Booking:',
      bookingNumberLabel: 'Booking Number',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      studioLabel: 'Studio',
      reasonTitle: 'Reason for Cancellation:',
      noReason: 'No specific reason provided',
      whatNextTitle: 'What you can do now:',
      whatNext: 'No problem! At Massava you can find many more studios and alternative appointments.',
      step1: '🔍 Discover other studios near you',
      step2: '📅 Find alternative appointments',
      step3: '⭐ Maybe discover a new favorite studio',
      ctaText: 'Find New Appointment',
      support: 'We\'re happy to help you find the perfect appointment!',
      footer: 'Your Massava Team',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.studioLabel}</p>
            <p style={styles.bookingDetailValue}>{studioName}</p>
          </div>
        </div>

        {cancellationReason && (
          <div style={styles.infoBox}>
            <p style={{ ...styles.textBold, marginBottom: '8px' }}>💬 {t.reasonTitle}</p>
            <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{cancellationReason}</p>
          </div>
        )}

        {!cancellationReason && (
          <div style={styles.infoBox}>
            <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px', fontStyle: 'italic' }}>{t.noReason}</p>
          </div>
        )}

        <div style={styles.divider}></div>

        <p style={styles.textBold}>{t.whatNextTitle}</p>
        <p style={styles.text}>{t.whatNext}</p>

        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={{ position: 'absolute', left: '0' }}>✓</span>
            {t.step1}
          </li>
          <li style={styles.listItem}>
            <span style={{ position: 'absolute', left: '0' }}>✓</span>
            {t.step2}
          </li>
          <li style={styles.listItem}>
            <span style={{ position: 'absolute', left: '0' }}>✓</span>
            {t.step3}
          </li>
        </ul>

        <div style={styles.buttonContainer}>
          <a href={studiosUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <p style={{ ...styles.text, textAlign: 'center' as const }}>{t.support}</p>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION CODE TEMPLATE
// ============================================================================

interface TwoFactorCodeTemplateProps {
  userName: string;
  code: string; // 6-digit code
  expiresInMinutes: number;
  locale?: string;
}

export function TwoFactorCodeTemplate({
  userName,
  code,
  expiresInMinutes,
  locale = 'de',
}: TwoFactorCodeTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Ihr Sicherheitscode - Massava',
      greeting: `Hallo ${userName}! 🔐`,
      intro: 'Hier ist Ihr Sicherheitscode für die Anmeldung:',
      codeLabel: 'Ihr Sicherheitscode',
      expiryTitle: 'Wichtig:',
      expiryNotice: `⏱ Dieser Code ist ${expiresInMinutes} Minuten gültig.`,
      securityTitle: 'Sicherheitshinweis:',
      notRequested: 'Falls Sie sich nicht anmelden wollten, ignorieren Sie diese E-Mail und kontaktieren Sie uns umgehend, wenn Sie verdächtige Aktivitäten bemerken.',
      footer: 'Geben Sie diesen Code niemals an Dritte weiter.',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Your Security Code - Massava',
      greeting: `Hello ${userName}! 🔐`,
      intro: 'Here is your security code for login:',
      codeLabel: 'Your Security Code',
      expiryTitle: 'Important:',
      expiryNotice: `⏱ This code is valid for ${expiresInMinutes} minutes.`,
      securityTitle: 'Security Notice:',
      notRequested: 'If you did not attempt to log in, please ignore this email and contact us immediately if you notice suspicious activity.',
      footer: 'Never share this code with anyone.',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.bookingCard}>
          <p style={styles.bookingDetailLabel}>{t.codeLabel}</p>
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: COLORS.primary,
            letterSpacing: '8px',
            textAlign: 'center' as const,
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            padding: '24px',
            margin: '16px 0',
          }}>
            {code}
          </div>
        </div>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>⚠️ {t.expiryTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.expiryNotice}</p>
        </div>

        <div style={styles.errorBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>🔒 {t.securityTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.notRequested}</p>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// ACCOUNT DELETION SCHEDULED TEMPLATE
// ============================================================================

interface AccountDeletionScheduledTemplateProps {
  userName: string;
  deletionDate: string; // formatted date (e.g., "15. Dezember 2025")
  cancelUrl: string;
  locale?: string;
}

export function AccountDeletionScheduledTemplate({
  userName,
  deletionDate,
  cancelUrl,
  locale = 'de',
}: AccountDeletionScheduledTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Konto-Löschung geplant - Massava',
      greeting: `Hallo ${userName}`,
      intro: 'Sie haben die Löschung Ihres Kontos beantragt. Diese wird in 30 Tagen durchgeführt.',
      warningTitle: `⚠️ Ihr Konto wird am ${deletionDate} gelöscht.`,
      detailsTitle: 'Was wird gelöscht?',
      detail1: '🗑 Alle Ihre persönlichen Daten werden unwiderruflich gelöscht',
      detail2: '📅 Alle zukünftigen Buchungen werden automatisch storniert',
      detail3: '🏢 Studio-Zugriffe und Berechtigungen werden entfernt',
      detail4: '📧 Sie erhalten keine weiteren E-Mails von Massava',
      cancelTitle: 'Möchten Sie die Löschung abbrechen?',
      cancelText: 'Falls Sie es sich anders überlegt haben, können Sie die Löschung bis zum {deletionDate} jederzeit abbrechen.',
      buttonText: 'Löschung abbrechen',
      continueTitle: 'Nichts tun?',
      continueText: 'Falls Sie die Löschung durchführen möchten, müssen Sie nichts weiter tun. Ihr Konto wird automatisch gelöscht.',
      footer: 'Wir bedauern, Sie gehen zu sehen.',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Account Deletion Scheduled - Massava',
      greeting: `Hello ${userName}`,
      intro: 'You have requested to delete your account. This will be completed in 30 days.',
      warningTitle: `⚠️ Your account will be deleted on ${deletionDate}.`,
      detailsTitle: 'What will be deleted?',
      detail1: '🗑 All your personal data will be permanently deleted',
      detail2: '📅 All future bookings will be automatically cancelled',
      detail3: '🏢 Studio access and permissions will be removed',
      detail4: '📧 You will no longer receive emails from Massava',
      cancelTitle: 'Want to cancel the deletion?',
      cancelText: 'If you changed your mind, you can cancel the deletion at any time until {deletionDate}.',
      buttonText: 'Cancel Deletion',
      continueTitle: 'Do nothing?',
      continueText: 'If you want to proceed with the deletion, you don\'t need to do anything. Your account will be deleted automatically.',
      footer: 'We\'re sorry to see you go.',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '0', fontSize: '18px', textAlign: 'center' as const }}>
            {t.warningTitle}
          </p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <ul style={{ ...styles.list, marginBottom: '0' }}>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>•</span>
              {t.detail1}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>•</span>
              {t.detail2}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>•</span>
              {t.detail3}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>•</span>
              {t.detail4}
            </li>
          </ul>
        </div>

        <div style={styles.divider}></div>

        <p style={styles.textBold}>{t.cancelTitle}</p>
        <p style={styles.text}>{t.cancelText.replace('{deletionDate}', deletionDate)}</p>

        <div style={styles.buttonContainer}>
          <a href={cancelUrl} style={styles.button}>
            {t.buttonText}
          </a>
        </div>

        <div style={styles.infoBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>{t.continueTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.continueText}</p>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// ACCOUNT DELETION CONFIRMED TEMPLATE
// ============================================================================

interface AccountDeletionConfirmedTemplateProps {
  userName: string;
  locale?: string;
}

export function AccountDeletionConfirmedTemplate({
  userName,
  locale = 'de',
}: AccountDeletionConfirmedTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Konto gelöscht - Massava',
      greeting: `Hallo ${userName}`,
      intro: '✓ Ihr Massava-Konto wurde erfolgreich gelöscht.',
      confirmationTitle: 'Was wurde gelöscht?',
      confirmation1: '✓ Alle Ihre persönlichen Daten wurden gemäß DSGVO unwiderruflich gelöscht',
      confirmation2: '✓ Alle Buchungen wurden storniert',
      confirmation3: '✓ Alle Studio-Zugriffe wurden entfernt',
      confirmation4: '✓ Sie wurden von allen Mailinglisten entfernt',
      reactivationTitle: 'Möchten Sie wiederkommen?',
      reactivationText: 'Falls Sie in Zukunft wieder bei Massava buchen möchten, können Sie jederzeit ein neues Konto erstellen. Wir würden uns freuen, Sie wieder bei uns zu sehen!',
      buttonText: 'Neues Konto erstellen',
      footer: 'Vielen Dank, dass Sie Teil von Massava waren.',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Account Deleted - Massava',
      greeting: `Hello ${userName}`,
      intro: '✓ Your Massava account has been successfully deleted.',
      confirmationTitle: 'What was deleted?',
      confirmation1: '✓ All your personal data has been permanently deleted in accordance with GDPR',
      confirmation2: '✓ All bookings have been cancelled',
      confirmation3: '✓ All studio access has been removed',
      confirmation4: '✓ You have been removed from all mailing lists',
      reactivationTitle: 'Want to come back?',
      reactivationText: 'If you want to book with Massava in the future, you can create a new account at any time. We would be happy to see you again!',
      buttonText: 'Create New Account',
      footer: 'Thank you for being part of Massava.',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const signupUrl = `${appUrl}/${locale}/auth/signup`;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>

        <div style={styles.successBox}>
          <p style={{ ...styles.textBold, marginBottom: '0', fontSize: '18px', textAlign: 'center' as const }}>
            {t.intro}
          </p>
        </div>

        <p style={styles.textBold}>{t.confirmationTitle}</p>

        <div style={styles.bookingCard}>
          <ul style={{ ...styles.list, marginBottom: '0' }}>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.confirmation1}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.confirmation2}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.confirmation3}
            </li>
            <li style={styles.listItem}>
              <span style={{ position: 'absolute', left: '0' }}>✓</span>
              {t.confirmation4}
            </li>
          </ul>
        </div>

        <div style={styles.divider}></div>

        <p style={styles.textBold}>{t.reactivationTitle}</p>
        <p style={styles.text}>{t.reactivationText}</p>

        <div style={styles.buttonContainer}>
          <a href={signupUrl} style={styles.buttonSecondary}>
            {t.buttonText}
          </a>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

// ============================================================================
// PLAIN TEXT VERSIONS
// ============================================================================

export function getPlainTextVerification(verificationUrl: string, locale = 'de'): string {
  const content = {
    de: `
Willkommen bei Massava! 👋

Schön, dass Sie dabei sind! Bitte verifizieren Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.

Verifizierungslink:
${verificationUrl}

⏱ Dieser Link ist 24 Stunden gültig.

Sie haben dieses Konto nicht erstellt? Dann können Sie diese E-Mail einfach ignorieren.

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Welcome to Massava! 👋

Great to have you here! Please verify your email address to activate your account.

Verification link:
${verificationUrl}

⏱ This link is valid for 24 hours.

Didn't create this account? You can simply ignore this email.

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextWelcome(name: string, locale = 'de'): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  const content = {
    de: `
Hallo ${name}! 🌟

Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Willkommen in der Massava-Community!

Das können Sie jetzt tun:
✓ 🔍 Wellness-Studios in Ihrer Nähe entdecken
✓ 📅 Ihren Wunschtermin schnell und einfach buchen
✓ 💆 Ihre Buchungen bequem online verwalten
✓ ⭐ Ihre Lieblings-Studios speichern

Studios entdecken: ${studiosUrl}

Haben Sie Fragen oder Anregungen? Wir sind für Sie da!
Schreiben Sie uns: support@massava.app

Wir wünschen Ihnen entspannte Momente mit Massava! 🧘

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${name}! 🌟

Your email address has been successfully verified. Welcome to the Massava community!

Here's what you can do now:
✓ 🔍 Discover wellness studios near you
✓ 📅 Book your preferred appointment quickly and easily
✓ 💆 Manage your bookings conveniently online
✓ ⭐ Save your favorite studios

Discover studios: ${studiosUrl}

Have questions or suggestions? We're here for you!
Contact us: support@massava.app

We wish you relaxing moments with Massava! 🧘

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextPasswordReset(resetUrl: string, locale = 'de'): string {
  const content = {
    de: `
Passwort zurücksetzen 🔐

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Passwort zurücksetzen:
${resetUrl}

⏱ Wichtig: Dieser Link ist aus Sicherheitsgründen nur 1 Stunde gültig.

🔒 Sicherheitshinweis: Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt dann unverändert.

Diese E-Mail wurde aus Sicherheitsgründen automatisch versendet.

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Reset Your Password 🔐

You requested to reset your password.

Reset password:
${resetUrl}

⏱ Important: For security reasons, this link is only valid for 1 hour.

🔒 Security Notice: If you didn't request this, you can ignore this email. Your password will remain unchanged.

This email was sent automatically for security reasons.

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextEmailChangeVerification(
  userName: string,
  newEmail: string,
  verificationUrl: string,
  oldEmail: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${userName}! 📧

Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert.

Details der Änderung:

Aktuelle E-Mail: ${oldEmail}
Neue E-Mail: ${newEmail}

E-Mail bestätigen:
${verificationUrl}

⚠️ Wichtig: Bestätigen Sie Ihre neue E-Mail-Adresse innerhalb von 24 Stunden.

🔒 Sicherheitshinweis: Falls Sie diese Änderung nicht vorgenommen haben, ignorieren Sie diese E-Mail und kontaktieren Sie uns umgehend.

Diese E-Mail wurde aus Sicherheitsgründen automatisch versendet.

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${userName}! 📧

You have requested to change your email address.

Change Details:

Current Email: ${oldEmail}
New Email: ${newEmail}

Confirm Email:
${verificationUrl}

⚠️ Important: Please confirm your new email address within 24 hours.

🔒 Security Notice: If you did not make this change, please ignore this email and contact us immediately.

This email was sent automatically for security reasons.

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextBookingRequestReceived(
  bookingId: string,
  customerName: string,
  studioName: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  message?: string,
  locale = 'de'
): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  const content = {
    de: `
Hallo ${customerName}! 👋

Ihre Buchungsanfrage bei ${studioName} wurde erfolgreich übermittelt.

✓ Anfrage übermittelt

Ihre Buchungsanfrage:

Buchungsnummer: ${bookingId}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}
Studio: ${studioName}

${message ? `💬 Ihre Nachricht:\n${message}\n` : ''}

Was passiert jetzt?

📧 Das Studio wurde über Ihre Anfrage informiert
⏳ Sie erhalten eine E-Mail, sobald das Studio Ihre Buchung bestätigt oder ablehnt
💼 Wir informieren Sie über jede Statusänderung

Ihre Buchungsnummer: ${bookingId}
Bewahren Sie diese Nummer für Ihre Unterlagen auf.

Weitere Studios entdecken: ${studiosUrl}

Wir halten Sie auf dem Laufenden! 📬

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${customerName}! 👋

Your booking request at ${studioName} has been successfully submitted.

✓ Request Submitted

Your Booking Request:

Booking Number: ${bookingId}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}
Studio: ${studioName}

${message ? `💬 Your Message:\n${message}\n` : ''}

What happens next?

📧 The studio has been notified of your request
⏳ You will receive an email once the studio confirms or declines your booking
💼 We will notify you of any status changes

Your booking number: ${bookingId}
Keep this number for your records.

Discover More Studios: ${studiosUrl}

We'll keep you updated! 📬

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextBookingConfirmation(
  bookingId: string,
  customerName: string,
  studioName: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  studioAddress?: string,
  studioPhone?: string,
  message?: string,
  locale = 'de'
): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  const content = {
    de: `
Hallo ${customerName}! 🎉

Gute Nachrichten! Ihre Buchung bei ${studioName} wurde bestätigt.

✓ Buchung bestätigt

Ihre Buchungsdetails:

Buchungsnummer: ${bookingId}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}
Studio: ${studioName}
${studioAddress ? `Adresse: ${studioAddress}` : ''}
${studioPhone ? `Telefon: ${studioPhone}` : ''}

${message ? `💬 Nachricht vom Studio:\n${message}\n` : ''}

Was Sie jetzt tun können:
✓ 📅 Termin in Ihren Kalender eintragen
✓ 📍 Route zum Studio planen
✓ 📞 Bei Fragen das Studio kontaktieren

⚠️ Wichtig: Bitte erscheinen Sie pünktlich zu Ihrem Termin. Bei Verspätungen oder Terminänderungen kontaktieren Sie bitte direkt das Studio.

Weitere Studios entdecken: ${studiosUrl}

Wir wünschen Ihnen eine entspannende Zeit! 🧘

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${customerName}! 🎉

Good news! Your booking at ${studioName} has been confirmed.

✓ Booking Confirmed

Your Booking Details:

Booking Number: ${bookingId}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}
Studio: ${studioName}
${studioAddress ? `Address: ${studioAddress}` : ''}
${studioPhone ? `Phone: ${studioPhone}` : ''}

${message ? `💬 Message from Studio:\n${message}\n` : ''}

What you can do now:
✓ 📅 Add appointment to your calendar
✓ 📍 Plan route to studio
✓ 📞 Contact studio if you have questions

⚠️ Important: Please arrive on time for your appointment. For delays or changes, please contact the studio directly.

Discover More Studios: ${studiosUrl}

We wish you a relaxing time! 🧘

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextBookingCancellation(
  bookingId: string,
  customerName: string,
  studioName: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  cancellationReason?: string,
  locale = 'de'
): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const studiosUrl = `${appUrl}/de/studios`;

  const content = {
    de: `
Hallo ${customerName}

Leider muss ${studioName} Ihre Buchungsanfrage ablehnen.

Details der abgelehnten Buchung:

Buchungsnummer: ${bookingId}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}
Studio: ${studioName}

${cancellationReason ? `💬 Grund der Absage:\n${cancellationReason}\n` : '💬 Kein spezifischer Grund angegeben\n'}

Was Sie jetzt tun können:

Kein Problem! Bei Massava finden Sie viele weitere Studios und alternative Termine.

✓ 🔍 Andere Studios in Ihrer Nähe entdecken
✓ 📅 Alternative Termine finden
✓ ⭐ Vielleicht ein neues Lieblings-Studio entdecken

Neuen Termin finden: ${studiosUrl}

Wir helfen Ihnen gerne, den perfekten Termin zu finden!

Ihr Massava-Team

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${customerName}

Unfortunately, ${studioName} has to decline your booking request.

Details of Declined Booking:

Booking Number: ${bookingId}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}
Studio: ${studioName}

${cancellationReason ? `💬 Reason for Cancellation:\n${cancellationReason}\n` : '💬 No specific reason provided\n'}

What you can do now:

No problem! At Massava you can find many more studios and alternative appointments.

✓ 🔍 Discover other studios near you
✓ 📅 Find alternative appointments
✓ ⭐ Maybe discover a new favorite studio

Find New Appointment: ${studiosUrl}

We're happy to help you find the perfect appointment!

Your Massava Team

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

// ============================================================================
// BOOKING REMINDER TEMPLATE
// ============================================================================

interface BookingReminderTemplateProps {
  bookingId: string;
  customerName: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  studioAddress?: string;
  studioPhone?: string;
  locale?: string;
}

export function BookingReminderTemplate({
  bookingId,
  customerName,
  studioName,
  serviceName,
  bookingDate,
  bookingTime,
  studioAddress,
  studioPhone,
  locale = 'de',
}: BookingReminderTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Erinnerung: Ihr Termin morgen - Massava',
      greeting: `Hallo ${customerName}! 📅`,
      intro: 'Dies ist eine Erinnerung an Ihren Termin morgen.',
      reminderTitle: '⏰ Termin in 24 Stunden',
      detailsTitle: 'Ihre Termindetails:',
      bookingNumberLabel: 'Buchungsnummer',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      studioLabel: 'Studio',
      addressLabel: 'Adresse',
      phoneLabel: 'Telefon',
      importantTitle: 'Wichtig:',
      importantText: 'Bitte erscheinen Sie pünktlich zu Ihrem Termin. Bei Verspätung oder Absage kontaktieren Sie bitte direkt das Studio.',
      contactTitle: 'Studio-Kontakt:',
      contactText: 'Bei Fragen oder Änderungen können Sie das Studio direkt kontaktieren:',
      footer: 'Wir freuen uns auf Ihren Besuch! 🧘',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Reminder: Your Appointment Tomorrow - Massava',
      greeting: `Hello ${customerName}! 📅`,
      intro: 'This is a reminder about your appointment tomorrow.',
      reminderTitle: '⏰ Appointment in 24 Hours',
      detailsTitle: 'Your Appointment Details:',
      bookingNumberLabel: 'Booking Number',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      studioLabel: 'Studio',
      addressLabel: 'Address',
      phoneLabel: 'Phone',
      importantTitle: 'Important:',
      importantText: 'Please arrive on time for your appointment. For delays or cancellations, please contact the studio directly.',
      contactTitle: 'Studio Contact:',
      contactText: 'If you have questions or need changes, you can contact the studio directly:',
      footer: 'We look forward to your visit! 🧘',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.infoBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.accent }}>
            {t.reminderTitle}
          </p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>

          <div style={{ marginBottom: '0' }}>
            <p style={styles.bookingDetailLabel}>{t.studioLabel}</p>
            <p style={styles.bookingDetailValue}>{studioName}</p>
          </div>
        </div>

        <div style={styles.warningBox}>
          <p style={{ ...styles.textBold, marginBottom: '8px' }}>⚠️ {t.importantTitle}</p>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{t.importantText}</p>
        </div>

        {(studioAddress || studioPhone) && (
          <div>
            <p style={styles.textBold}>{t.contactTitle}</p>
            <p style={styles.text}>{t.contactText}</p>

            <div style={styles.infoBox}>
              {studioAddress && (
                <div style={{ marginBottom: studioPhone ? '16px' : '0' }}>
                  <p style={styles.bookingDetailLabel}>{t.addressLabel}</p>
                  <p style={{ ...styles.text, marginBottom: '0' }}>{studioAddress}</p>
                </div>
              )}

              {studioPhone && (
                <div>
                  <p style={styles.bookingDetailLabel}>{t.phoneLabel}</p>
                  <p style={{ ...styles.text, marginBottom: '0' }}>
                    <a href={`tel:${studioPhone}`} style={styles.link}>{studioPhone}</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>{t.footer}</p>
        <p style={styles.footerText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextBookingReminder(
  bookingId: string,
  customerName: string,
  studioName: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  studioAddress?: string,
  studioPhone?: string,
  locale = 'de'
): string {
  const contactSection = studioAddress || studioPhone ? `
Studio-Kontakt:

Bei Fragen oder Änderungen können Sie das Studio direkt kontaktieren:
${studioAddress ? `Adresse: ${studioAddress}` : ''}
${studioPhone ? `Telefon: ${studioPhone}` : ''}
` : '';

  const contactSectionEn = studioAddress || studioPhone ? `
Studio Contact:

If you have questions or need changes, you can contact the studio directly:
${studioAddress ? `Address: ${studioAddress}` : ''}
${studioPhone ? `Phone: ${studioPhone}` : ''}
` : '';

  const content = {
    de: `
Hallo ${customerName}! 📅

Dies ist eine Erinnerung an Ihren Termin morgen.

⏰ Termin in 24 Stunden

Ihre Termindetails:

Buchungsnummer: ${bookingId}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}
Studio: ${studioName}

⚠️ Wichtig: Bitte erscheinen Sie pünktlich zu Ihrem Termin. Bei Verspätung oder Absage kontaktieren Sie bitte direkt das Studio.
${contactSection}
Wir freuen uns auf Ihren Besuch! 🧘

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${customerName}! 📅

This is a reminder about your appointment tomorrow.

⏰ Appointment in 24 Hours

Your Appointment Details:

Booking Number: ${bookingId}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}
Studio: ${studioName}

⚠️ Important: Please arrive on time for your appointment. For delays or cancellations, please contact the studio directly.
${contactSectionEn}
We look forward to your visit! 🧘

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}


export function getPlainTextTwoFactorCode(
  userName: string,
  code: string,
  expiresInMinutes: number,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${userName}\! 🔐

Hier ist Ihr Sicherheitscode für die Anmeldung:

━━━━━━━━━━━━━━━━━━━━━━━━━━

  ${code}

━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱ Wichtig: Dieser Code ist ${expiresInMinutes} Minuten gültig.

🔒 Sicherheitshinweis:
Falls Sie sich nicht anmelden wollten, ignorieren Sie diese E-Mail und kontaktieren Sie uns umgehend, wenn Sie verdächtige Aktivitäten bemerken.

Geben Sie diesen Code niemals an Dritte weiter.

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${userName}\! 🔐

Here is your security code for login:

━━━━━━━━━━━━━━━━━━━━━━━━━━

  ${code}

━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱ Important: This code is valid for ${expiresInMinutes} minutes.

🔒 Security Notice:
If you did not attempt to log in, please ignore this email and contact us immediately if you notice suspicious activity.

Never share this code with anyone.

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextAccountDeletionScheduled(
  userName: string,
  deletionDate: string,
  cancelUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${userName}

Sie haben die Löschung Ihres Kontos beantragt. Diese wird in 30 Tagen durchgeführt.

⚠️ Ihr Konto wird am ${deletionDate} gelöscht.

Was wird gelöscht?

• 🗑 Alle Ihre persönlichen Daten werden unwiderruflich gelöscht
• 📅 Alle zukünftigen Buchungen werden automatisch storniert
• 🏢 Studio-Zugriffe und Berechtigungen werden entfernt
• 📧 Sie erhalten keine weiteren E-Mails von Massava

Möchten Sie die Löschung abbrechen?

Falls Sie es sich anders überlegt haben, können Sie die Löschung bis zum ${deletionDate} jederzeit abbrechen.

Löschung abbrechen: ${cancelUrl}

Nichts tun?

Falls Sie die Löschung durchführen möchten, müssen Sie nichts weiter tun. Ihr Konto wird automatisch gelöscht.

Wir bedauern, Sie gehen zu sehen.

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${userName}

You have requested to delete your account. This will be completed in 30 days.

⚠️ Your account will be deleted on ${deletionDate}.

What will be deleted?

• 🗑 All your personal data will be permanently deleted
• 📅 All future bookings will be automatically cancelled
• 🏢 Studio access and permissions will be removed
• 📧 You will no longer receive emails from Massava

Want to cancel the deletion?

If you changed your mind, you can cancel the deletion at any time until ${deletionDate}.

Cancel Deletion: ${cancelUrl}

Do nothing?

If you want to proceed with the deletion, you don't need to do anything. Your account will be deleted automatically.

We're sorry to see you go.

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextAccountDeletionConfirmed(
  userName: string,
  locale = 'de'
): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const signupUrl = `${appUrl}/${locale}/auth/signup`;

  const content = {
    de: `
Hallo ${userName}

✓ Ihr Massava-Konto wurde erfolgreich gelöscht.

Was wurde gelöscht?

✓ Alle Ihre persönlichen Daten wurden gemäß DSGVO unwiderruflich gelöscht
✓ Alle Buchungen wurden storniert
✓ Alle Studio-Zugriffe wurden entfernt
✓ Sie wurden von allen Mailinglisten entfernt

Möchten Sie wiederkommen?

Falls Sie in Zukunft wieder bei Massava buchen möchten, können Sie jederzeit ein neues Konto erstellen. Wir würden uns freuen, Sie wieder bei uns zu sehen\!

Neues Konto erstellen: ${signupUrl}

Vielen Dank, dass Sie Teil von Massava waren.

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${userName}

✓ Your Massava account has been successfully deleted.

What was deleted?

✓ All your personal data has been permanently deleted in accordance with GDPR
✓ All bookings have been cancelled
✓ All studio access has been removed
✓ You have been removed from all mailing lists

Want to come back?

If you want to book with Massava in the future, you can create a new account at any time. We would be happy to see you again\!

Create New Account: ${signupUrl}

Thank you for being part of Massava.

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

// ============================================================================
// PHASE 3: STUDIO OWNER NOTIFICATIONS
// ============================================================================

// ============================================================================
// TASK 3.1: NEW BOOKING NOTIFICATION FOR STUDIO OWNERS
// ============================================================================

interface NewBookingNotificationTemplateProps {
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
  locale?: string;
}

export function NewBookingNotificationTemplate({
  studioName,
  ownerName,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  bookingDate,
  bookingTime,
  message,
  dashboardUrl,
  locale = 'de',
}: NewBookingNotificationTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: `Neue Buchungsanfrage - ${studioName}`,
      greeting: `Hallo ${ownerName}! 📅`,
      intro: `Sie haben eine neue Buchungsanfrage für ${studioName} erhalten.`,
      successBox: '✓ Neue Buchungsanfrage eingegangen',
      detailsTitle: 'Buchungsdetails:',
      bookingNumberLabel: 'Buchungsnummer',
      customerNameLabel: 'Kunde',
      customerEmailLabel: 'E-Mail',
      customerPhoneLabel: 'Telefon',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      messageTitle: 'Nachricht vom Kunden:',
      actionRequired: '⏰ Bitte bestätigen oder lehnen Sie die Buchung ab.',
      ctaText: 'Buchung verwalten',
      footer: 'Vielen Dank für Ihr Engagement! 💼',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: `New Booking Request - ${studioName}`,
      greeting: `Hello ${ownerName}! 📅`,
      intro: `You have received a new booking request for ${studioName}.`,
      successBox: '✓ New booking request received',
      detailsTitle: 'Booking Details:',
      bookingNumberLabel: 'Booking Number',
      customerNameLabel: 'Customer',
      customerEmailLabel: 'Email',
      customerPhoneLabel: 'Phone',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      messageTitle: 'Customer Message:',
      actionRequired: '⏰ Please confirm or decline this booking.',
      ctaText: 'Manage Booking',
      footer: 'Thank you for your commitment! 💼',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.infoBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.success }}>
            {t.successBox}
          </p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.customerNameLabel}</p>
            <p style={styles.bookingDetailValue}>{customerName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.customerEmailLabel}</p>
            <p style={styles.bookingDetailValue}>{customerEmail}</p>
          </div>

          {customerPhone && (
            <div style={{ marginBottom: '20px' }}>
              <p style={styles.bookingDetailLabel}>{t.customerPhoneLabel}</p>
              <p style={styles.bookingDetailValue}>{customerPhone}</p>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>
        </div>

        {message && (
          <div style={styles.infoBox}>
            <p style={{ ...styles.textBold, marginBottom: '8px' }}>💬 {t.messageTitle}</p>
            <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{message}</p>
          </div>
        )}

        <div style={styles.highlightBox}>
          <p style={{ ...styles.textBold, marginBottom: '0', color: COLORS.warning }}>
            {t.actionRequired}
          </p>
        </div>

        <div style={styles.buttonContainer}>
          <a href={dashboardUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextNewBookingNotification(
  studioName: string,
  ownerName: string,
  bookingId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string | undefined,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  message: string | undefined,
  dashboardUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${ownerName}! 📅

Sie haben eine neue Buchungsanfrage für ${studioName} erhalten.

✓ Neue Buchungsanfrage eingegangen

Buchungsdetails:

Buchungsnummer: ${bookingId}
Kunde: ${customerName}
E-Mail: ${customerEmail}
${customerPhone ? `Telefon: ${customerPhone}` : ''}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}

${message ? `💬 Nachricht vom Kunden:\n${message}\n` : ''}

⏰ Bitte bestätigen oder lehnen Sie die Buchung ab.

Buchung verwalten: ${dashboardUrl}

Vielen Dank für Ihr Engagement! 💼

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${ownerName}! 📅

You have received a new booking request for ${studioName}.

✓ New booking request received

Booking Details:

Booking Number: ${bookingId}
Customer: ${customerName}
Email: ${customerEmail}
${customerPhone ? `Phone: ${customerPhone}` : ''}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}

${message ? `💬 Customer Message:\n${message}\n` : ''}

⏰ Please confirm or decline this booking.

Manage Booking: ${dashboardUrl}

Thank you for your commitment! 💼

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

// ============================================================================
// TASK 3.2: BOOKING CANCELLED BY CUSTOMER NOTIFICATION FOR STUDIO OWNERS
// ============================================================================

interface BookingCancelledByCustomerTemplateProps {
  studioName: string;
  ownerName: string;
  bookingId: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationReason?: string;
  dashboardUrl: string;
  locale?: string;
}

export function BookingCancelledByCustomerTemplate({
  studioName,
  ownerName,
  bookingId,
  customerName,
  serviceName,
  bookingDate,
  bookingTime,
  cancellationReason,
  dashboardUrl,
  locale = 'de',
}: BookingCancelledByCustomerTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: `Buchung storniert - ${studioName}`,
      greeting: `Hallo ${ownerName}`,
      intro: `Ein Kunde hat seine Buchung storniert.`,
      warningBox: '⚠️ Buchung storniert',
      detailsTitle: 'Stornierungsdetails:',
      bookingNumberLabel: 'Buchungsnummer',
      customerNameLabel: 'Kunde',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      reasonTitle: 'Stornierungsgrund:',
      ctaText: 'Dashboard öffnen',
      footer: 'Der Zeitslot ist nun wieder verfügbar. 📅',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: `Booking Cancelled - ${studioName}`,
      greeting: `Hello ${ownerName}`,
      intro: `A customer has cancelled their booking.`,
      warningBox: '⚠️ Booking cancelled',
      detailsTitle: 'Cancellation Details:',
      bookingNumberLabel: 'Booking Number',
      customerNameLabel: 'Customer',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      reasonTitle: 'Cancellation Reason:',
      ctaText: 'Open Dashboard',
      footer: 'The time slot is now available again. 📅',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={{ ...styles.infoBox, backgroundColor: '#fff3cd', borderLeft: `4px solid ${COLORS.warning}` }}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.warning }}>
            {t.warningBox}
          </p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.customerNameLabel}</p>
            <p style={styles.bookingDetailValue}>{customerName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>
        </div>

        {cancellationReason && (
          <div style={styles.infoBox}>
            <p style={{ ...styles.textBold, marginBottom: '8px' }}>💬 {t.reasonTitle}</p>
            <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>{cancellationReason}</p>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <a href={dashboardUrl} style={styles.buttonSecondary}>
            {t.ctaText}
          </a>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextBookingCancelledByCustomer(
  studioName: string,
  ownerName: string,
  bookingId: string,
  customerName: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  cancellationReason: string | undefined,
  dashboardUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${ownerName}

Ein Kunde hat seine Buchung storniert.

⚠️ Buchung storniert

Stornierungsdetails:

Buchungsnummer: ${bookingId}
Kunde: ${customerName}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}

${cancellationReason ? `💬 Stornierungsgrund:\n${cancellationReason}\n` : ''}

Dashboard öffnen: ${dashboardUrl}

Der Zeitslot ist nun wieder verfügbar. 📅

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${ownerName}

A customer has cancelled their booking.

⚠️ Booking cancelled

Cancellation Details:

Booking Number: ${bookingId}
Customer: ${customerName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}

${cancellationReason ? `💬 Cancellation Reason:\n${cancellationReason}\n` : ''}

Open Dashboard: ${dashboardUrl}

The time slot is now available again. 📅

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

// ============================================================================
// TASK 3.3: STUDIO REGISTRATION WELCOME
// ============================================================================

interface StudioRegistrationWelcomeTemplateProps {
  studioName: string;
  ownerName: string;
  studioId: string;
  dashboardUrl: string;
  onboardingUrl: string;
  locale?: string;
}

export function StudioRegistrationWelcomeTemplate({
  studioName,
  ownerName,
  studioId,
  dashboardUrl,
  onboardingUrl,
  locale = 'de',
}: StudioRegistrationWelcomeTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: `Willkommen bei Massava - ${studioName}`,
      greeting: `Hallo ${ownerName}! 🎉`,
      intro: `Herzlich willkommen! Ihr Studio ${studioName} wurde erfolgreich registriert.`,
      successBox: '✓ Studio-Registrierung abgeschlossen',
      nextStepsTitle: 'Nächste Schritte:',
      step1: '📋 Studio-Profil vervollständigen',
      step2: '💆 Services hinzufügen',
      step3: '📅 Öffnungszeiten eintragen',
      step4: '🖼️ Galerie-Bilder hochladen',
      studioIdLabel: 'Ihre Studio-ID',
      ctaPrimary: 'Onboarding starten',
      ctaSecondary: 'Dashboard öffnen',
      footer: 'Viel Erfolg mit Ihrem Studio! 🌟',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: `Welcome to Massava - ${studioName}`,
      greeting: `Hello ${ownerName}! 🎉`,
      intro: `Welcome! Your studio ${studioName} has been successfully registered.`,
      successBox: '✓ Studio registration completed',
      nextStepsTitle: 'Next Steps:',
      step1: '📋 Complete studio profile',
      step2: '💆 Add services',
      step3: '📅 Set opening hours',
      step4: '🖼️ Upload gallery images',
      studioIdLabel: 'Your Studio ID',
      ctaPrimary: 'Start Onboarding',
      ctaSecondary: 'Open Dashboard',
      footer: 'Good luck with your studio! 🌟',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.infoBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.success }}>
            {t.successBox}
          </p>
        </div>

        <p style={styles.textBold}>{t.nextStepsTitle}</p>

        <div style={styles.list}>
          <p style={styles.listItem}>{t.step1}</p>
          <p style={styles.listItem}>{t.step2}</p>
          <p style={styles.listItem}>{t.step3}</p>
          <p style={styles.listItem}>{t.step4}</p>
        </div>

        <div style={styles.highlightBox}>
          <p style={{ ...styles.text, marginBottom: '4px', fontSize: '14px', color: COLORS.textMuted }}>
            {t.studioIdLabel}
          </p>
          <p style={{ ...styles.textBold, marginBottom: '0', fontFamily: 'monospace', fontSize: '16px' }}>
            {studioId}
          </p>
        </div>

        <div style={styles.buttonContainer}>
          <a href={onboardingUrl} style={styles.button}>
            {t.ctaPrimary}
          </a>
        </div>

        <div style={styles.buttonContainer}>
          <a href={dashboardUrl} style={styles.buttonSecondary}>
            {t.ctaSecondary}
          </a>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextStudioRegistrationWelcome(
  studioName: string,
  ownerName: string,
  studioId: string,
  dashboardUrl: string,
  onboardingUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${ownerName}! 🎉

Herzlich willkommen! Ihr Studio ${studioName} wurde erfolgreich registriert.

✓ Studio-Registrierung abgeschlossen

Nächste Schritte:

📋 Studio-Profil vervollständigen
💆 Services hinzufügen
📅 Öffnungszeiten eintragen
🖼️ Galerie-Bilder hochladen

Ihre Studio-ID: ${studioId}

Onboarding starten: ${onboardingUrl}

Dashboard öffnen: ${dashboardUrl}

Viel Erfolg mit Ihrem Studio! 🌟

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${ownerName}! 🎉

Welcome! Your studio ${studioName} has been successfully registered.

✓ Studio registration completed

Next Steps:

📋 Complete studio profile
💆 Add services
📅 Set opening hours
🖼️ Upload gallery images

Your Studio ID: ${studioId}

Start Onboarding: ${onboardingUrl}

Open Dashboard: ${dashboardUrl}

Good luck with your studio! 🌟

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

// ============================================================================
// TASK 3.4: STUDIO DELETION WORKFLOW
// ============================================================================

interface StudioDeletionWarningTemplateProps {
  studioName: string;
  ownerName: string;
  deletionDate: string;
  cancelUrl: string;
  locale?: string;
}

export function StudioDeletionWarningTemplate({
  studioName,
  ownerName,
  deletionDate,
  cancelUrl,
  locale = 'de',
}: StudioDeletionWarningTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: `Studio-Löschung geplant - ${studioName}`,
      greeting: `Hallo ${ownerName}`,
      intro: `Ihr Studio ${studioName} wird am ${deletionDate} gelöscht.`,
      warningBox: '⚠️ Studio-Löschung geplant',
      gracePeriodTitle: 'Wichtige Information:',
      gracePeriodText: 'Sie haben 30 Tage Zeit, um diese Löschung abzubrechen. Nach Ablauf dieser Frist werden alle Daten unwiderruflich gelöscht.',
      whatWillBeDeleted: 'Was wird gelöscht?',
      deleteItem1: '✓ Alle Studio-Informationen (Name, Adresse, Beschreibung)',
      deleteItem2: '✓ Alle Services und Preise',
      deleteItem3: '✓ Alle Buchungen (vergangene und zukünftige)',
      deleteItem4: '✓ Alle Öffnungszeiten und Zeitslots',
      deleteItem5: '✓ Alle Galerie-Bilder und Logos',
      ctaText: 'Löschung abbrechen',
      footer: 'Wenn Sie diese E-Mail ignorieren, wird Ihr Studio am angegebenen Datum gelöscht.',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: `Studio Deletion Scheduled - ${studioName}`,
      greeting: `Hello ${ownerName}`,
      intro: `Your studio ${studioName} will be deleted on ${deletionDate}.`,
      warningBox: '⚠️ Studio deletion scheduled',
      gracePeriodTitle: 'Important Information:',
      gracePeriodText: 'You have 30 days to cancel this deletion. After this period, all data will be permanently deleted.',
      whatWillBeDeleted: 'What will be deleted?',
      deleteItem1: '✓ All studio information (name, address, description)',
      deleteItem2: '✓ All services and prices',
      deleteItem3: '✓ All bookings (past and future)',
      deleteItem4: '✓ All opening hours and time slots',
      deleteItem5: '✓ All gallery images and logos',
      ctaText: 'Cancel Deletion',
      footer: 'If you ignore this email, your studio will be deleted on the specified date.',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={{ ...styles.infoBox, backgroundColor: '#fff3cd', borderLeft: `4px solid ${COLORS.warning}` }}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.warning }}>
            {t.warningBox}
          </p>
        </div>

        <p style={styles.textBold}>{t.gracePeriodTitle}</p>
        <p style={styles.text}>{t.gracePeriodText}</p>

        <p style={styles.textBold}>{t.whatWillBeDeleted}</p>

        <div style={styles.list}>
          <p style={styles.listItem}>{t.deleteItem1}</p>
          <p style={styles.listItem}>{t.deleteItem2}</p>
          <p style={styles.listItem}>{t.deleteItem3}</p>
          <p style={styles.listItem}>{t.deleteItem4}</p>
          <p style={styles.listItem}>{t.deleteItem5}</p>
        </div>

        <div style={styles.buttonContainer}>
          <a href={cancelUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <div style={styles.highlightBox}>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '14px' }}>
            {t.footer}
          </p>
        </div>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextStudioDeletionWarning(
  studioName: string,
  ownerName: string,
  deletionDate: string,
  cancelUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${ownerName}

Ihr Studio ${studioName} wird am ${deletionDate} gelöscht.

⚠️ Studio-Löschung geplant

Wichtige Information:

Sie haben 30 Tage Zeit, um diese Löschung abzubrechen. Nach Ablauf dieser Frist werden alle Daten unwiderruflich gelöscht.

Was wird gelöscht?

✓ Alle Studio-Informationen (Name, Adresse, Beschreibung)
✓ Alle Services und Preise
✓ Alle Buchungen (vergangene und zukünftige)
✓ Alle Öffnungszeiten und Zeitslots
✓ Alle Galerie-Bilder und Logos

Löschung abbrechen: ${cancelUrl}

Wenn Sie diese E-Mail ignorieren, wird Ihr Studio am angegebenen Datum gelöscht.

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${ownerName}

Your studio ${studioName} will be deleted on ${deletionDate}.

⚠️ Studio deletion scheduled

Important Information:

You have 30 days to cancel this deletion. After this period, all data will be permanently deleted.

What will be deleted?

✓ All studio information (name, address, description)
✓ All services and prices
✓ All bookings (past and future)
✓ All opening hours and time slots
✓ All gallery images and logos

Cancel Deletion: ${cancelUrl}

If you ignore this email, your studio will be deleted on the specified date.

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

interface StudioDeletionConfirmedTemplateProps {
  studioName: string;
  ownerName: string;
  locale?: string;
}

export function StudioDeletionConfirmedTemplate({
  studioName,
  ownerName,
  locale = 'de',
}: StudioDeletionConfirmedTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: `Studio gelöscht - ${studioName}`,
      greeting: `Hallo ${ownerName}`,
      intro: `Ihr Studio ${studioName} wurde erfolgreich gelöscht.`,
      successBox: '✓ Studio wurde gelöscht',
      deletedTitle: 'Was wurde gelöscht?',
      deletedItem1: '✓ Alle Studio-Informationen wurden gemäß DSGVO unwiderruflich gelöscht',
      deletedItem2: '✓ Alle Services und Preise wurden entfernt',
      deletedItem3: '✓ Alle Buchungen wurden storniert',
      deletedItem4: '✓ Alle Öffnungszeiten und Zeitslots wurden gelöscht',
      deletedItem5: '✓ Alle Galerie-Bilder und Logos wurden entfernt',
      comebackTitle: 'Möchten Sie ein neues Studio erstellen?',
      comebackText: 'Falls Sie in Zukunft wieder ein Studio bei Massava betreiben möchten, können Sie jederzeit ein neues Studio registrieren. Wir würden uns freuen, Sie wieder bei uns zu sehen!',
      footer: 'Vielen Dank, dass Sie Teil von Massava waren. 🙏',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: `Studio Deleted - ${studioName}`,
      greeting: `Hello ${ownerName}`,
      intro: `Your studio ${studioName} has been successfully deleted.`,
      successBox: '✓ Studio deleted',
      deletedTitle: 'What was deleted?',
      deletedItem1: '✓ All studio information has been permanently deleted in accordance with GDPR',
      deletedItem2: '✓ All services and prices have been removed',
      deletedItem3: '✓ All bookings have been cancelled',
      deletedItem4: '✓ All opening hours and time slots have been deleted',
      deletedItem5: '✓ All gallery images and logos have been removed',
      comebackTitle: 'Want to create a new studio?',
      comebackText: 'If you want to operate a studio with Massava in the future, you can register a new studio at any time. We would be happy to see you again!',
      footer: 'Thank you for being part of Massava. 🙏',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const dashboardUrl = `${appUrl}/de/dashboard`;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.infoBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', color: COLORS.success }}>
            {t.successBox}
          </p>
        </div>

        <p style={styles.textBold}>{t.deletedTitle}</p>

        <div style={styles.list}>
          <p style={styles.listItem}>{t.deletedItem1}</p>
          <p style={styles.listItem}>{t.deletedItem2}</p>
          <p style={styles.listItem}>{t.deletedItem3}</p>
          <p style={styles.listItem}>{t.deletedItem4}</p>
          <p style={styles.listItem}>{t.deletedItem5}</p>
        </div>

        <p style={styles.textBold}>{t.comebackTitle}</p>
        <p style={styles.text}>{t.comebackText}</p>

        <div style={styles.buttonContainer}>
          <a href={dashboardUrl} style={styles.buttonSecondary}>
            Neues Studio registrieren
          </a>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextStudioDeletionConfirmed(
  studioName: string,
  ownerName: string,
  locale = 'de'
): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const dashboardUrl = `${appUrl}/de/dashboard`;

  const content = {
    de: `
Hallo ${ownerName}

✓ Ihr Studio ${studioName} wurde erfolgreich gelöscht.

Was wurde gelöscht?

✓ Alle Studio-Informationen wurden gemäß DSGVO unwiderruflich gelöscht
✓ Alle Services und Preise wurden entfernt
✓ Alle Buchungen wurden storniert
✓ Alle Öffnungszeiten und Zeitslots wurden gelöscht
✓ Alle Galerie-Bilder und Logos wurden entfernt

Möchten Sie ein neues Studio erstellen?

Falls Sie in Zukunft wieder ein Studio bei Massava betreiben möchten, können Sie jederzeit ein neues Studio registrieren. Wir würden uns freuen, Sie wieder bei uns zu sehen!

Neues Studio registrieren: ${dashboardUrl}

Vielen Dank, dass Sie Teil von Massava waren. 🙏

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${ownerName}

✓ Your studio ${studioName} has been successfully deleted.

What was deleted?

✓ All studio information has been permanently deleted in accordance with GDPR
✓ All services and prices have been removed
✓ All bookings have been cancelled
✓ All opening hours and time slots have been deleted
✓ All gallery images and logos have been removed

Want to create a new studio?

If you want to operate a studio with Massava in the future, you can register a new studio at any time. We would be happy to see you again!

Register New Studio: ${dashboardUrl}

Thank you for being part of Massava. 🙏

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}


// ============================================================================
// REVIEW REQUEST TEMPLATE (Task 4.2)
// ============================================================================

interface ReviewRequestTemplateProps {
  customerName: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  reviewUrl: string;
  locale?: string;
}

export function ReviewRequestTemplate({
  customerName,
  studioName,
  serviceName,
  bookingDate,
  reviewUrl,
  locale = 'de',
}: ReviewRequestTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Wie war Ihr Termin? - Massava',
      greeting: `Hallo ${customerName}! ⭐`,
      intro: `Wir hoffen, Sie hatten einen entspannenden Termin bei ${studioName}.`,
      question: `Wie zufrieden waren Sie mit Ihrer ${serviceName}?`,
      ctaText: 'Jetzt bewerten',
      incentive: 'Ihre Bewertung hilft anderen Kunden und unterstützt lokale Studios.',
      bookingDetailsTitle: 'Ihr Termin:',
      studioLabel: 'Studio',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      whyReview: 'Warum Ihre Bewertung wichtig ist:',
      reason1: '⭐ Hilft anderen Kunden bei der Entscheidung',
      reason2: '💪 Unterstützt lokale Wellness-Studios',
      reason3: '📈 Verbessert die Qualität der Services',
      footer: 'Vielen Dank für Ihre Unterstützung! 🙏',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'How was your appointment? - Massava',
      greeting: `Hello ${customerName}! ⭐`,
      intro: `We hope you had a relaxing appointment at ${studioName}.`,
      question: `How satisfied were you with your ${serviceName}?`,
      ctaText: 'Leave a Review',
      incentive: 'Your review helps other customers and supports local studios.',
      bookingDetailsTitle: 'Your Appointment:',
      studioLabel: 'Studio',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      whyReview: 'Why your review matters:',
      reason1: '⭐ Helps other customers make decisions',
      reason2: '💪 Supports local wellness studios',
      reason3: '📈 Improves service quality',
      footer: 'Thank you for your support! 🙏',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>
        <p style={styles.text}>{t.intro}</p>

        <div style={styles.highlightBox}>
          <p style={{ ...styles.textBold, marginBottom: '4px', fontSize: '18px', color: COLORS.primary }}>
            {t.question}
          </p>
        </div>

        <p style={styles.textBold}>{t.bookingDetailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.studioLabel}</p>
            <p style={styles.bookingDetailValue}>{studioName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <a href={reviewUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <div style={styles.infoBox}>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px', textAlign: 'center' as const }}>
            ✨ {t.incentive}
          </p>
        </div>

        <p style={styles.textBold}>{t.whyReview}</p>

        <div style={styles.list}>
          <p style={styles.listItem}>{t.reason1}</p>
          <p style={styles.listItem}>{t.reason2}</p>
          <p style={styles.listItem}>{t.reason3}</p>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextReviewRequest(
  customerName: string,
  studioName: string,
  serviceName: string,
  bookingDate: string,
  reviewUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${customerName}! ⭐

Wir hoffen, Sie hatten einen entspannenden Termin bei ${studioName}.

Wie zufrieden waren Sie mit Ihrer ${serviceName}?

Ihr Termin:

Studio: ${studioName}
Service: ${serviceName}
Datum: ${bookingDate}

Jetzt bewerten: ${reviewUrl}

✨ Ihre Bewertung hilft anderen Kunden und unterstützt lokale Studios.

Warum Ihre Bewertung wichtig ist:

⭐ Hilft anderen Kunden bei der Entscheidung
💪 Unterstützt lokale Wellness-Studios
📈 Verbessert die Qualität der Services

Vielen Dank für Ihre Unterstützung! 🙏

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${customerName}! ⭐

We hope you had a relaxing appointment at ${studioName}.

How satisfied were you with your ${serviceName}?

Your Appointment:

Studio: ${studioName}
Service: ${serviceName}
Date: ${bookingDate}

Leave a Review: ${reviewUrl}

✨ Your review helps other customers and supports local studios.

Why your review matters:

⭐ Helps other customers make decisions
💪 Supports local wellness studios
📈 Improves service quality

Thank you for your support! 🙏

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

// ============================================================================
// CUSTOMER CANCELLATION CONFIRMATION (Task 4.3)
// ============================================================================

interface CustomerCancellationConfirmationTemplateProps {
  customerName: string;
  bookingId: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  rebookUrl: string;
  locale?: string;
}

export function CustomerCancellationConfirmationTemplate({
  customerName,
  bookingId,
  studioName,
  serviceName,
  bookingDate,
  bookingTime,
  rebookUrl,
  locale = 'de',
}: CustomerCancellationConfirmationTemplateProps): React.ReactElement {
  const content = {
    de: {
      subject: 'Buchung storniert - Massava',
      greeting: `Hallo ${customerName}`,
      confirmation: '✓ Ihre Buchung wurde erfolgreich storniert.',
      detailsTitle: 'Stornierte Buchung:',
      bookingNumberLabel: 'Buchungsnummer',
      serviceLabel: 'Service',
      dateLabel: 'Datum',
      timeLabel: 'Uhrzeit',
      studioLabel: 'Studio',
      info: 'Sie können jederzeit einen neuen Termin buchen.',
      ctaText: 'Neuen Termin buchen',
      footer: 'Wir freuen uns, Sie bald wieder zu sehen! 🙏',
      help: 'Bei Fragen erreichen Sie uns unter support@massava.app',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Booking Cancelled - Massava',
      greeting: `Hello ${customerName}`,
      confirmation: '✓ Your booking has been successfully cancelled.',
      detailsTitle: 'Cancelled Booking:',
      bookingNumberLabel: 'Booking Number',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      studioLabel: 'Studio',
      info: 'You can book a new appointment anytime.',
      ctaText: 'Book New Appointment',
      footer: 'We look forward to seeing you again soon! 🙏',
      help: 'If you have questions, reach us at support@massava.app',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <EmailLayout>
      <div style={styles.content}>
        <h1 style={styles.greeting}>{t.greeting}</h1>

        <div style={styles.successBox}>
          <p style={{ ...styles.textBold, marginBottom: '0', color: COLORS.success }}>
            {t.confirmation}
          </p>
        </div>

        <p style={styles.textBold}>{t.detailsTitle}</p>

        <div style={styles.bookingCard}>
          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.bookingNumberLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingId}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.serviceLabel}</p>
            <p style={styles.bookingDetailValue}>{serviceName}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.dateLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingDate}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={styles.bookingDetailLabel}>{t.timeLabel}</p>
            <p style={styles.bookingDetailValue}>{bookingTime}</p>
          </div>

          <div>
            <p style={styles.bookingDetailLabel}>{t.studioLabel}</p>
            <p style={styles.bookingDetailValue}>{studioName}</p>
          </div>
        </div>

        <div style={styles.infoBox}>
          <p style={{ ...styles.text, marginBottom: '0', fontSize: '15px' }}>
            {t.info}
          </p>
        </div>

        <div style={styles.buttonContainer}>
          <a href={rebookUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <p style={styles.footer}>{t.footer}</p>
      </div>

      <div style={styles.footerSection}>
        <p style={styles.helpText}>{t.help}</p>
        <p style={styles.copyright}>{t.copyright}</p>
      </div>
    </EmailLayout>
  );
}

export function getPlainTextCustomerCancellationConfirmation(
  customerName: string,
  bookingId: string,
  studioName: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string,
  rebookUrl: string,
  locale = 'de'
): string {
  const content = {
    de: `
Hallo ${customerName}

✓ Ihre Buchung wurde erfolgreich storniert.

Stornierte Buchung:

Buchungsnummer: ${bookingId}
Service: ${serviceName}
Datum: ${bookingDate}
Uhrzeit: ${bookingTime}
Studio: ${studioName}

Sie können jederzeit einen neuen Termin buchen.

Neuen Termin buchen: ${rebookUrl}

Wir freuen uns, Sie bald wieder zu sehen! 🙏

Bei Fragen erreichen Sie uns unter support@massava.app

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${customerName}

✓ Your booking has been successfully cancelled.

Cancelled Booking:

Booking Number: ${bookingId}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${bookingTime}
Studio: ${studioName}

You can book a new appointment anytime.

Book New Appointment: ${rebookUrl}

We look forward to seeing you again soon! 🙏

If you have questions, reach us at support@massava.app

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}
