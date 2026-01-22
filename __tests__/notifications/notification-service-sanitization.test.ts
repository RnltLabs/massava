/**
 * Notification Service Sanitization Integration Tests
 *
 * Tests that the NotificationService properly sanitizes all inputs before storage,
 * protecting against XSS attacks at the service layer.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';

// Mock dependencies
jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('NotificationService Sanitization Integration', () => {
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({
      where: { userId: testUserId },
    });

    // Create test user with notification preferences
    await prisma.user.upsert({
      where: { id: testUserId },
      create: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        notificationPreference: {
          create: {
            pushEnabled: true,
            emailEnabled: true,
            inAppEnabled: true,
          },
        },
      },
      update: {},
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.notification.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.notificationPreference.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  it('should sanitize XSS in title before storage', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: '<script>alert("xss")</script>Booking Confirmed',
      body: 'Your booking is confirmed',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    expect(notification?.title).not.toContain('<script>');
    expect(notification?.title).not.toContain('</script>');
    expect(notification?.title).toBe('alert(&quot;xss&quot;)Booking Confirmed');
  });

  it('should sanitize XSS in body before storage', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Your booking at <img src=x onerror=alert(1)> Studio ABC',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    expect(notification?.body).not.toContain('<img');
    expect(notification?.body).not.toContain('onerror');
    expect(notification?.body).toBe('Your booking at  Studio ABC');
  });

  it('should reject dangerous actionUrl', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Click to view',
      actionUrl: 'javascript:alert("xss")',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    expect(notification?.actionUrl).toBeNull();
  });

  it('should allow safe actionUrl', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Click to view',
      actionUrl: '/bookings/123',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    expect(notification?.actionUrl).toBe('/bookings/123');
  });

  it('should sanitize metadata strings', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      metadata: {
        studioName: '<script>alert(1)</script>Studio ABC',
        serviceName: 'Haircut <b>Premium</b>',
        customerNote: 'Please arrive on time & bring ID',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    const metadata = notification?.metadata as any;

    expect(metadata.studioName).not.toContain('<script>');
    expect(metadata.studioName).toBe('alert(1)Studio ABC');
    expect(metadata.serviceName).toBe('Haircut Premium');
    expect(metadata.customerNote).toBe('Please arrive on time &amp; bring ID');
  });

  it('should preserve non-string metadata values', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      metadata: {
        price: 50,
        duration: 60,
        confirmed: true,
        rating: 4.5,
        tags: ['haircut', 'premium'],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    const metadata = notification?.metadata as any;

    expect(metadata.price).toBe(50);
    expect(metadata.duration).toBe(60);
    expect(metadata.confirmed).toBe(true);
    expect(metadata.rating).toBe(4.5);
    expect(metadata.tags).toEqual(['haircut', 'premium']);
  });

  it('should sanitize nested metadata objects', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      metadata: {
        studio: {
          name: '<script>XSS</script>Studio',
          address: {
            street: 'Main <b>Street</b>',
            city: 'Berlin',
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    const metadata = notification?.metadata as any;

    expect(metadata.studio.name).toBe('XSSStudio');
    expect(metadata.studio.address.street).toBe('Main Street');
    expect(metadata.studio.address.city).toBe('Berlin');
  });

  it('should log warning when sanitization modifies input', async () => {
    const { logger } = await import('@/lib/logger');

    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: '<script>alert(1)</script>Malicious',
      body: 'Normal body',
    });

    expect(result.ok).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      'Notification content was sanitized (potential XSS attempt)',
      expect.objectContaining({
        userId: testUserId,
        type: 'SYSTEM_MAINTENANCE',
        sanitizationPerformed: true,
      })
    );
  });

  it('should not log warning for clean content', async () => {
    const { logger } = await import('@/lib/logger');
    jest.clearAllMocks();

    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Clean Booking Title',
      body: 'Clean body text',
    });

    expect(result.ok).toBe(true);
    expect(logger.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('sanitized'),
      expect.any(Object)
    );
  });

  it('should handle multiple XSS vectors in single notification', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: '<img src=x onerror=alert(1)>',
      body: '<iframe src="javascript:alert(1)"></iframe>',
      actionUrl: 'data:text/html,<script>alert(1)</script>',
      metadata: {
        studioName: '<svg onload=alert(1)>',
        note: 'Test<script>Evil</script>',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();

    // All XSS should be stripped
    expect(notification?.title).not.toContain('<');
    expect(notification?.title).not.toContain('onerror');
    expect(notification?.body).not.toContain('<iframe');
    expect(notification?.actionUrl).toBeNull();

    const metadata = notification?.metadata as any;
    expect(metadata.studioName).not.toContain('<svg');
    expect(metadata.note).not.toContain('<script>');
  });

  it('should truncate overly long titles', async () => {
    const longTitle = 'A'.repeat(200); // Exceeds MAX_TITLE_LENGTH (100)

    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: longTitle,
      body: 'Normal body',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    expect(notification?.title.length).toBeLessThanOrEqual(100);
    expect(notification?.title).toMatch(/\.\.\.$/);
  });

  it('should truncate overly long bodies', async () => {
    const longBody = 'B'.repeat(600); // Exceeds MAX_BODY_LENGTH (500)

    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Notification',
      body: longBody,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    expect(notification?.body.length).toBeLessThanOrEqual(500);
    expect(notification?.body).toMatch(/\.\.\.$/);
  });

  it('should sanitize template-generated content', async () => {
    // Test with metadata that will be injected into templates
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      metadata: {
        studioName: '<script>alert(1)</script>Studio ABC',
        serviceName: 'Haircut <img src=x onerror=alert(1)>',
        appointmentTime: '2025-01-15T14:00:00Z',
        bookingId: 'booking-123',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();

    // Template output should be sanitized
    expect(notification?.title).not.toContain('<script>');
    expect(notification?.body).not.toContain('<script>');
    expect(notification?.body).not.toContain('onerror');
  });

  it('should handle bookingId context safely', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      bookingId: '<script>alert(1)</script>',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    // bookingId is stored as-is (not displayed), but should be escaped if used in templates
    expect(notification?.bookingId).toBe('<script>alert(1)</script>');
  });

  it('should handle studioId context safely', async () => {
    const result = await notificationService.create({
      userId: testUserId,
      type: 'SYSTEM_MAINTENANCE',
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      studioId: '<script>alert(1)</script>',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification).not.toBeNull();
    // studioId is stored as-is (not displayed), but should be escaped if used in templates
    expect(notification?.studioId).toBe('<script>alert(1)</script>');
  });
});
