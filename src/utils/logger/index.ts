/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

const CRITICAL_WEBHOOK = 'https://discord.com/api/webhooks/1429204966098341961/2WBnra3u3BuUz8nvQxYeFd92EkO13G8AF11xF_B0v-v5u_2rTbYEFqc0PEV25OJOYnIV';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  /**
   * Log a critical/fatal error to Discord
   * This bypasses GlitchTip for immediate notification
   */
  async fatal(message: string, error?: Error, context?: LogContext): Promise<void> {
    // Only send to Discord in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('[FATAL]', message, error, context);
      return;
    }

    // Only send to critical-alerts if PRODUCTION environment (not staging)
    // Staging fatal errors should NOT go to critical-alerts
    const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'production';
    if (environment !== 'production') {
      console.error('[FATAL - STAGING]', message, error, context);
      return;
    }

    try {
      const fields: Array<{ name: string; value: string; inline: boolean }> = [];

      // Error details
      if (error) {
        fields.push({
          name: 'Error Message',
          value: `\`\`\`${this.truncate(error.message, 1000)}\`\`\``,
          inline: false,
        });

        if (error.stack) {
          fields.push({
            name: 'Stack Trace',
            value: `\`\`\`${this.truncate(error.stack, 1000)}\`\`\``,
            inline: false,
          });
        }
      }

      // Context
      if (context && Object.keys(context).length > 0) {
        const contextStr = JSON.stringify(context, null, 2);
        fields.push({
          name: 'Context',
          value: `\`\`\`json\n${this.truncate(contextStr, 1000)}\`\`\``,
          inline: false,
        });
      }

      // Metadata
      fields.push(
        {
          name: 'App',
          value: 'Massava',
          inline: true,
        },
        {
          name: 'Environment',
          value: process.env.NODE_ENV || 'unknown',
          inline: true,
        },
        {
          name: 'Version',
          value: '0.1.0',
          inline: true,
        }
      );

      const payload = {
        content: '@everyone',
        embeds: [
          {
            title: `💀 ${message}`,
            color: 10038562, // Dark Red
            fields,
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Level: FATAL',
            },
          },
        ],
      };

      // Use fetch (available in both Node.js 18+ and browser)
      await fetch(CRITICAL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[Logger] Failed to send fatal error to Discord:', err);
    }
  }

  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }
}

export const logger = new Logger();
