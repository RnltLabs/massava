/**
 * POST /api/qstash/webhook
 *
 * QStash webhook endpoint for processing queued notifications.
 * Verifies QStash signature before processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { handleNotificationMessage, verifyNotification } from '@/lib/queue/qstash-handlers';
import type { QueueMessage } from '@/lib/queue/qstash-publisher';

export const runtime = 'nodejs';

// Initialize QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Get the canonical webhook URL for signature verification.
 * Uses NEXT_PUBLIC_APP_URL to match the URL QStash uses to call this endpoint.
 * Falls back to request URL if not configured (local dev).
 */
function getWebhookUrl(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return `${appUrl}/api/qstash/webhook`;
  }
  // Fallback for local development
  return request.url;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('upstash-signature');

    if (!signature) {
      console.error('QStash webhook: Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify the signature using the canonical URL (not internal container URL)
    const webhookUrl = getWebhookUrl(request);
    const isValid = await receiver.verify({
      body,
      signature,
      url: webhookUrl,
    });

    if (!isValid) {
      console.error('QStash webhook: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the message
    const message: QueueMessage = JSON.parse(body);
    console.log('QStash webhook received:', message);

    // Verify notification exists and is processable
    const exists = await verifyNotification(message.notificationId);
    if (!exists) {
      console.log('QStash webhook: Notification not found or not processable');
      // Return 200 to prevent QStash from retrying
      return NextResponse.json({ skipped: true });
    }

    // Process the notification
    const result = await handleNotificationMessage(message);

    if (!result.processed) {
      console.error('QStash webhook: Processing failed:', result.error);
      // Return 500 to trigger QStash retry
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QStash webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
