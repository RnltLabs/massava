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
 */
export function getWebhookUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL or VERCEL_URL must be set for QStash webhooks');
  }

  // Ensure URL has protocol
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return `${url}/api/qstash/webhook`;
}
