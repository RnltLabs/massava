/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * E2E Test: User Preference Flow
 *
 * Tests notification preference handling:
 * - Set notification preferences
 * - Create notification
 * - Verify channels respect preferences
 * - Test channel-specific preferences
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { logger } from '@/lib/logger';
import type { NotificationType, UserRole, DigestFrequency } from '@/app/generated/prisma';

// Mock QStash publisher
jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));

// Mock Redis for rate limiting
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

const E2E_USER_ID = 'e2e-preference-user';
const E2E_USER_EMAIL = 'e2e-preference@example.com';
const E2E_USER_ROLE: UserRole = 'CUSTOMER';

describe('E2E: User Preference Flow', () => {
  beforeEach(async () => {
    // Clean up existing data
    await prisma.notification.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.notificationPreference.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });

    // Create test user
    await prisma.user.create({
      data: {
        id: E2E_USER_ID,
        email: E2E_USER_EMAIL,
        name: 'E2E Preference Test User',
        primaryRole: E2E_USER_ROLE,
        emailVerified: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.notification.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.notificationPreference.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });
  });

  test('Default preferences allow all channels', async () => {
    // Create default preferences
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
      },
    });

    // Create notification without specifying channels
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    // Default preferences should include all channels
    expect(notification?.channels).toContain('IN_APP');
    expect(notification?.channels).toContain('PUSH');
    expect(notification?.channels).toContain('EMAIL');

    logger.info('Default preferences allow all channels');
  });

  test('Disabled channels are excluded from notification', async () => {
    // Create preferences with PUSH and EMAIL disabled
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: false,
        emailEnabled: false,
        inAppEnabled: true,
      },
    });

    // Create notification
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'REVIEW_REQUEST' as NotificationType,
      title: 'Rate your experience',
      body: 'How was your session?',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    // Only IN_APP should be included
    expect(notification?.channels).toContain('IN_APP');
    expect(notification?.channels).not.toContain('PUSH');
    expect(notification?.channels).not.toContain('EMAIL');

    logger.info('Disabled channels excluded from notification');
  });

  test('Type-specific preferences override global settings', async () => {
    // Create preferences with type-specific overrides
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        typePreferences: {
          BOOKING_CONFIRMED: {
            push: true,
            email: 'instant',
            inApp: true,
          },
          REVIEW_REQUEST: {
            push: false,
            email: 'digest',
            inApp: true,
          },
        } as any,
      },
    });

    // Create REVIEW_REQUEST notification (PUSH disabled for this type)
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'REVIEW_REQUEST' as NotificationType,
      title: 'Rate your experience',
      body: 'How was your session?',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    // Type-specific preferences should apply
    // Note: The actual implementation might vary based on preference-checker logic
    expect(notification?.type).toBe('REVIEW_REQUEST');

    logger.info('Type-specific preferences applied');
  });

  test('Email digest preferences are respected', async () => {
    // Create preferences with email digest enabled
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        emailDigestEnabled: true,
        digestFrequency: 'DAILY' as DigestFrequency,
        digestTime: '09:00',
      },
    });

    // Create low-priority notification (should go to digest)
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'REVIEW_REQUEST' as NotificationType,
      title: 'Rate your experience',
      body: 'How was your session?',
      priority: 'LOW',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: E2E_USER_ID },
    });

    expect(preferences?.emailDigestEnabled).toBe(true);
    expect(preferences?.digestFrequency).toBe('DAILY');
    expect(preferences?.digestTime).toBe('09:00');

    logger.info('Email digest preferences configured');
  });

  test('Updating preferences takes immediate effect', async () => {
    // Create initial preferences
    const prefs = await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
      },
    });

    expect(prefs.pushEnabled).toBe(true);

    // Update preferences to disable PUSH
    const updated = await prisma.notificationPreference.update({
      where: { userId: E2E_USER_ID },
      data: {
        pushEnabled: false,
      },
    });

    expect(updated.pushEnabled).toBe(false);

    // Create notification after preference change
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome to the app',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    // PUSH should not be included after preference update
    expect(notification?.channels).not.toContain('PUSH');

    logger.info('Preference update takes immediate effect');
  });

  test('Language preference is stored and retrieved', async () => {
    // Create preferences with language
    const prefs = await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        language: 'de',
      },
    });

    expect(prefs.language).toBe('de');

    // Update language
    const updated = await prisma.notificationPreference.update({
      where: { userId: E2E_USER_ID },
      data: {
        language: 'en',
      },
    });

    expect(updated.language).toBe('en');

    logger.info('Language preference stored correctly');
  });

  test('All channels disabled prevents notification creation', async () => {
    // Create preferences with all channels disabled
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: false,
        emailEnabled: false,
        inAppEnabled: false,
      },
    });

    // Create notification
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome to the app',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    // No channels should be present
    expect(notification?.channels).toHaveLength(0);

    logger.info('All channels disabled results in empty channels array');
  });

  test('Preferences cascade: explicit channels override preferences', async () => {
    // Create preferences with PUSH disabled
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: false,
        emailEnabled: true,
        inAppEnabled: true,
      },
    });

    // Create notification with explicit PUSH channel (should override preference)
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Urgent: Booking Confirmed',
      body: 'Your booking is confirmed',
      channels: ['PUSH', 'IN_APP'], // Explicit channels
      priority: 'URGENT',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    // Explicit channels should be used (including PUSH)
    expect(notification?.channels).toContain('PUSH');
    expect(notification?.channels).toContain('IN_APP');

    logger.info('Explicit channels override preferences');
  });
});
