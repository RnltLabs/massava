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
