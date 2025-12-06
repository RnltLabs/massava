/**
 * QStash Client Configuration
 *
 * Singleton client for Upstash QStash serverless message queue.
 */

import { Client } from '@upstash/qstash';

let qstashClient: Client | null = null;

/**
 * Get or create QStash client instance
 */
export function getQStashClient(): Client {
  if (qstashClient) {
    return qstashClient;
  }

  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }

  qstashClient = new Client({ token });
  return qstashClient;
}

/**
 * Get the webhook URL for QStash callbacks
 * Only call this if QStash is configured
 *
 * For local development, defaults to http://localhost:3000 if neither
 * NEXT_PUBLIC_APP_URL nor VERCEL_URL are set
 */
export function getWebhookUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL or VERCEL_URL must be set for QStash webhooks in production. ' +
      'For local development, either: ' +
      '1) Add NEXT_PUBLIC_APP_URL="http://localhost:3000" to .env.local, or ' +
      '2) Leave it blank to use the default localhost URL'
    );
  }

  // Ensure URL has protocol
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return `${url}/api/qstash/webhook`;
}
