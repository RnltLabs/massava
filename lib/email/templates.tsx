/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Templates - German Language
 * STRATEGY.md Section 8.2 - Phase 2.5 Quick Wins
 */

import * as React from 'react';

// Email Template Styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#ffffff',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  tagline: {
    fontSize: '14px',
    color: '#666666',
  },
  content: {
    padding: '0 20px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '20px',
  },
  text: {
    fontSize: '16px',
    color: '#333333',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  button: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#000000',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center' as const,
    margin: '20px 0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  warning: {
    padding: '16px',
    backgroundColor: '#fff3cd',
    borderLeft: '4px solid #ffc107',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#856404',
    marginBottom: '20px',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
    fontSize: '12px',
    color: '#666666',
    textAlign: 'center' as const,
  },
  link: {
    color: '#000000',
    textDecoration: 'underline',
  },
  divider: {
    borderTop: '1px solid #e0e0e0',
    margin: '30px 0',
  },
};

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
      greeting: 'Willkommen bei Massava!',
      intro: 'Vielen Dank für Ihre Registrierung. Bitte verifizieren Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.',
      buttonText: 'E-Mail verifizieren',
      expiryNotice: 'Dieser Link ist 24 Stunden gültig.',
      alternativeText: 'Wenn der Button nicht funktioniert, kopieren Sie bitte den folgenden Link in Ihren Browser:',
      footer: 'Falls Sie dieses Konto nicht erstellt haben, ignorieren Sie diese E-Mail bitte.',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Verify Your Email Address - Massava',
      greeting: 'Welcome to Massava!',
      intro: 'Thank you for registering. Please verify your email address to activate your account.',
      buttonText: 'Verify Email',
      expiryNotice: 'This link is valid for 24 hours.',
      alternativeText: 'If the button doesn\'t work, please copy the following link into your browser:',
      footer: 'If you didn\'t create this account, please ignore this email.',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Massava</div>
        <div style={styles.tagline}>Ihre Massage-Buchungsplattform</div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.heading}>{t.greeting}</h1>

        <p style={styles.text}>{t.intro}</p>

        <div style={styles.buttonContainer}>
          <a href={verificationUrl} style={styles.button}>
            {t.buttonText}
          </a>
        </div>

        <div style={styles.warning}>
          <strong>⏱ {t.expiryNotice}</strong>
        </div>

        <p style={styles.text}>
          {t.alternativeText}
        </p>
        <p style={{ ...styles.text, wordBreak: 'break-all' as const, fontSize: '12px' }}>
          <a href={verificationUrl} style={styles.link}>{verificationUrl}</a>
        </p>
      </div>

      <div style={styles.footer}>
        <p>{t.footer}</p>
        <p style={{ marginTop: '10px' }}>{t.copyright}</p>
      </div>
    </div>
  );
}

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
      subject: 'Willkommen bei Massava!',
      greeting: `Hallo ${name}!`,
      intro: 'Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Willkommen bei Massava!',
      whatNext: 'Was Sie jetzt tun können:',
      step1: '✓ Durchsuchen Sie Massage-Studios in Ihrer Nähe',
      step2: '✓ Buchen Sie Ihre erste Massage',
      step3: '✓ Verwalten Sie Ihre Termine bequem online',
      ctaText: 'Jetzt Studios entdecken',
      support: 'Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung.',
      footer: 'Viel Freude mit Massava!',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Welcome to Massava!',
      greeting: `Hello ${name}!`,
      intro: 'Your email address has been successfully verified. Welcome to Massava!',
      whatNext: 'What you can do now:',
      step1: '✓ Browse massage studios near you',
      step2: '✓ Book your first massage',
      step3: '✓ Manage your appointments conveniently online',
      ctaText: 'Discover Studios Now',
      support: 'If you have any questions or issues, we are happy to help.',
      footer: 'Enjoy using Massava!',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const basePath = process.env.NODE_ENV === 'production' ? '/massava' : '';
  const studiosUrl = `${appUrl}${basePath}/studios`;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Massava</div>
        <div style={styles.tagline}>Ihre Massage-Buchungsplattform</div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.heading}>{t.greeting}</h1>

        <p style={styles.text}>{t.intro}</p>

        <div style={{ margin: '30px 0' }}>
          <p style={{ ...styles.text, fontWeight: 'bold', marginBottom: '15px' }}>
            {t.whatNext}
          </p>
          <ul style={{ fontSize: '16px', color: '#333333', lineHeight: '1.8' }}>
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
          </ul>
        </div>

        <div style={styles.buttonContainer}>
          <a href={studiosUrl} style={styles.button}>
            {t.ctaText}
          </a>
        </div>

        <div style={styles.divider}></div>

        <p style={styles.text}>{t.support}</p>
      </div>

      <div style={styles.footer}>
        <p>{t.footer}</p>
        <p style={{ marginTop: '10px' }}>{t.copyright}</p>
      </div>
    </div>
  );
}

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
      greeting: 'Passwort zurücksetzen',
      intro: 'Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den Button unten, um ein neues Passwort zu erstellen.',
      buttonText: 'Neues Passwort erstellen',
      expiryNotice: 'Dieser Link ist 1 Stunde gültig.',
      notRequested: 'Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt unverändert.',
      alternativeText: 'Wenn der Button nicht funktioniert, kopieren Sie bitte den folgenden Link in Ihren Browser:',
      footer: 'Diese E-Mail wurde aus Sicherheitsgründen automatisch versendet.',
      copyright: '© 2025 Massava. Alle Rechte vorbehalten.',
    },
    en: {
      subject: 'Reset Your Password - Massava',
      greeting: 'Reset Your Password',
      intro: 'You have requested to reset your password. Click the button below to create a new password.',
      buttonText: 'Create New Password',
      expiryNotice: 'This link is valid for 1 hour.',
      notRequested: 'If you didn\'t request this, please ignore this email. Your password will remain unchanged.',
      alternativeText: 'If the button doesn\'t work, please copy the following link into your browser:',
      footer: 'This email was sent automatically for security reasons.',
      copyright: '© 2025 Massava. All rights reserved.',
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Massava</div>
        <div style={styles.tagline}>Ihre Massage-Buchungsplattform</div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.heading}>{t.greeting}</h1>

        <p style={styles.text}>{t.intro}</p>

        <div style={styles.buttonContainer}>
          <a href={resetUrl} style={styles.button}>
            {t.buttonText}
          </a>
        </div>

        <div style={styles.warning}>
          <strong>⏱ {t.expiryNotice}</strong>
        </div>

        <div style={{ ...styles.warning, backgroundColor: '#f8d7da', borderColor: '#f5c6cb', color: '#721c24', marginTop: '20px' }}>
          <strong>🔒 {t.notRequested}</strong>
        </div>

        <p style={styles.text}>
          {t.alternativeText}
        </p>
        <p style={{ ...styles.text, wordBreak: 'break-all' as const, fontSize: '12px' }}>
          <a href={resetUrl} style={styles.link}>{resetUrl}</a>
        </p>
      </div>

      <div style={styles.footer}>
        <p>{t.footer}</p>
        <p style={{ marginTop: '10px' }}>{t.copyright}</p>
      </div>
    </div>
  );
}

// Plain text versions for email clients that don't support HTML
export function getPlainTextVerification(verificationUrl: string, locale = 'de'): string {
  const content = {
    de: `
Willkommen bei Massava!

Vielen Dank für Ihre Registrierung. Bitte verifizieren Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.

Verifizierungslink:
${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Falls Sie dieses Konto nicht erstellt haben, ignorieren Sie diese E-Mail bitte.

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Welcome to Massava!

Thank you for registering. Please verify your email address to activate your account.

Verification link:
${verificationUrl}

This link is valid for 24 hours.

If you didn't create this account, please ignore this email.

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextWelcome(name: string, locale = 'de'): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const basePath = process.env.NODE_ENV === 'production' ? '/massava' : '';
  const studiosUrl = `${appUrl}${basePath}/studios`;

  const content = {
    de: `
Hallo ${name}!

Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Willkommen bei Massava!

Was Sie jetzt tun können:
- Durchsuchen Sie Massage-Studios in Ihrer Nähe
- Buchen Sie Ihre erste Massage
- Verwalten Sie Ihre Termine bequem online

Studios entdecken: ${studiosUrl}

Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung.

Viel Freude mit Massava!

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Hello ${name}!

Your email address has been successfully verified. Welcome to Massava!

What you can do now:
- Browse massage studios near you
- Book your first massage
- Manage your appointments conveniently online

Discover studios: ${studiosUrl}

If you have any questions or issues, we are happy to help.

Enjoy using Massava!

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}

export function getPlainTextPasswordReset(resetUrl: string, locale = 'de'): string {
  const content = {
    de: `
Passwort zurücksetzen

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Passwort zurücksetzen:
${resetUrl}

Dieser Link ist 1 Stunde gültig.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt unverändert.

Diese E-Mail wurde aus Sicherheitsgründen automatisch versendet.

© 2025 Massava. Alle Rechte vorbehalten.
    `.trim(),
    en: `
Reset Your Password

You have requested to reset your password.

Reset password:
${resetUrl}

This link is valid for 1 hour.

If you didn't request this, please ignore this email. Your password will remain unchanged.

This email was sent automatically for security reasons.

© 2025 Massava. All rights reserved.
    `.trim(),
  };

  return content[locale as keyof typeof content] || content.de;
}
