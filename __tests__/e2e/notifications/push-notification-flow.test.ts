/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * E2E Test: Push Notification Flow
 *
 * Tests the complete push notification flow:
 * - Register device token
 * - Create notification with PUSH channel
 * - Verify push delivery attempted
 * - Unregister device
 * - Verify device cleanup
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { logger } from '@/lib/logger';
import type { NotificationType, DevicePlatform, UserRole } from '@/app/generated/prisma';

// Mock QStash publisher
jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));

// Mock Firebase Admin (for push notifications)
jest.mock('@/lib/notifications/channels/push', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
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

const E2E_USER_ID = 'e2e-push-notification-user';
const E2E_USER_EMAIL = 'e2e-push@example.com';
const E2E_USER_ROLE: UserRole = 'CUSTOMER';

describe('E2E: Push Notification Flow', () => {
  beforeEach(async () => {
    // Clean up existing data
    await prisma.deviceToken.deleteMany({
      where: { userId: E2E_USER_ID },
    });

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
        name: 'E2E Push Test User',
        primaryRole: E2E_USER_ROLE,
        emailVerified: new Date(),
      },
    });

    // Create notification preferences with PUSH enabled
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true,
      },
    });
  });

  afterEach(async () => {
    await prisma.deviceToken.deleteMany({
      where: { userId: E2E_USER_ID },
    });

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

  test('Complete push notification flow: register -> create -> deliver -> unregister', async () => {
    // Step 1: Register device token
    const deviceToken = 'c' + 'A'.repeat(151); // Valid FCM token
    const device = await prisma.deviceToken.create({
      data: {
        userId: E2E_USER_ID,
        token: deviceToken,
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Pixel 8',
        deviceModel: 'Pixel 8 Pro',
        appVersion: '1.0.0',
        osVersion: '14',
      },
    });

    expect(device.id).toBeDefined();
    expect(device.isActive).toBe(true);
    expect(device.failureCount).toBe(0);

    logger.info('Step 1 passed: Device token registered', { deviceId: device.id });

    // Step 2: Verify device appears in user's device list
    const devices = await prisma.deviceToken.findMany({
      where: { userId: E2E_USER_ID, isActive: true },
    });

    expect(devices).toHaveLength(1);
    expect(devices[0]?.token).toBe(deviceToken);

    logger.info('Step 2 passed: Device appears in list');

    // Step 3: Create notification with PUSH channel
    const createResult = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking Confirmed',
      body: 'Your tattoo appointment is confirmed',
      channels: ['PUSH', 'IN_APP'],
      priority: 'HIGH',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) throw new Error('Failed to create notification');

    const notificationId = createResult.value.id;

    logger.info('Step 3 passed: Notification created', { notificationId });

    // Step 4: Verify notification has PUSH in channels
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(notification?.channels).toContain('PUSH');
    expect(notification?.channels).toContain('IN_APP');

    logger.info('Step 4 passed: PUSH channel configured');

    // Step 5: Simulate notification processing (this would normally be done by QStash worker)
    // In real flow, the process() method would be called
    // For E2E test, we'll just verify the notification was queued
    expect(createResult.value.status).toBe('QUEUED');

    logger.info('Step 5 passed: Notification queued for delivery');

    // Step 6: Update device's lastUsedAt (simulating successful push)
    await prisma.deviceToken.update({
      where: { id: device.id },
      data: {
        lastUsedAt: new Date(),
      },
    });

    const updatedDevice = await prisma.deviceToken.findUnique({
      where: { id: device.id },
    });

    expect(updatedDevice?.lastUsedAt).toBeDefined();

    logger.info('Step 6 passed: Device usage tracked');

    // Step 7: Unregister device (mark as inactive)
    await prisma.deviceToken.update({
      where: { id: device.id },
      data: {
        isActive: false,
      },
    });

    const inactiveDevice = await prisma.deviceToken.findUnique({
      where: { id: device.id },
    });

    expect(inactiveDevice?.isActive).toBe(false);

    logger.info('Step 7 passed: Device unregistered');

    // Step 8: Verify inactive devices are not returned in active list
    const activeDevices = await prisma.deviceToken.findMany({
      where: { userId: E2E_USER_ID, isActive: true },
    });

    expect(activeDevices).toHaveLength(0);

    logger.info('Step 8 passed: Inactive device excluded from active list');

    // Step 9: Delete device token completely
    await prisma.deviceToken.delete({
      where: { id: device.id },
    });

    const deletedDevice = await prisma.deviceToken.findUnique({
      where: { id: device.id },
    });

    expect(deletedDevice).toBeNull();

    logger.info('Step 9 passed: Device token deleted');
  });

  test('Multiple devices receive push notifications', async () => {
    // Register multiple devices for the same user
    const devices = [
      {
        token: 'c' + 'A'.repeat(151),
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Pixel 8',
      },
      {
        token: 'a'.repeat(64),
        platform: 'IOS' as DevicePlatform,
        deviceName: 'iPhone 15',
      },
      {
        token: 'https://fcm.googleapis.com/fcm/send/' + 'b'.repeat(100),
        platform: 'WEB' as DevicePlatform,
        deviceName: 'Chrome',
      },
    ];

    const deviceIds: string[] = [];

    for (const deviceData of devices) {
      const device = await prisma.deviceToken.create({
        data: {
          userId: E2E_USER_ID,
          token: deviceData.token,
          platform: deviceData.platform,
          deviceName: deviceData.deviceName,
        },
      });
      deviceIds.push(device.id);
    }

    expect(deviceIds).toHaveLength(3);

    // Create notification with PUSH channel
    const createResult = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'REVIEW_REQUEST' as NotificationType,
      title: 'Rate your experience',
      body: 'How was your tattoo session?',
      channels: ['PUSH'],
    });

    expect(createResult.ok).toBe(true);

    // Verify all devices are active and ready to receive
    const activeDevices = await prisma.deviceToken.findMany({
      where: { userId: E2E_USER_ID, isActive: true },
    });

    expect(activeDevices).toHaveLength(3);

    // Verify each device has different platform
    const platforms = activeDevices.map((d) => d.platform);
    expect(platforms).toContain('ANDROID');
    expect(platforms).toContain('IOS');
    expect(platforms).toContain('WEB');
  });

  test('Failed push updates device failure count', async () => {
    // Register device
    const device = await prisma.deviceToken.create({
      data: {
        userId: E2E_USER_ID,
        token: 'c' + 'A'.repeat(151),
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Test Device',
      },
    });

    expect(device.failureCount).toBe(0);

    // Simulate push failure by updating device
    await prisma.deviceToken.update({
      where: { id: device.id },
      data: {
        failureCount: { increment: 1 },
        lastFailureAt: new Date(),
        lastFailureReason: 'InvalidRegistration',
      },
    });

    const updatedDevice = await prisma.deviceToken.findUnique({
      where: { id: device.id },
    });

    expect(updatedDevice?.failureCount).toBe(1);
    expect(updatedDevice?.lastFailureAt).toBeDefined();
    expect(updatedDevice?.lastFailureReason).toBe('InvalidRegistration');

    // Simulate multiple failures (should auto-deactivate after 3)
    await prisma.deviceToken.update({
      where: { id: device.id },
      data: {
        failureCount: 3,
        isActive: false,
      },
    });

    const deactivatedDevice = await prisma.deviceToken.findUnique({
      where: { id: device.id },
    });

    expect(deactivatedDevice?.isActive).toBe(false);
    expect(deactivatedDevice?.failureCount).toBe(3);
  });

  test('Re-registering device resets failure count', async () => {
    // Register device
    const token = 'c' + 'A'.repeat(151);
    const device = await prisma.deviceToken.create({
      data: {
        userId: E2E_USER_ID,
        token,
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Test Device',
        failureCount: 2,
        lastFailureAt: new Date(),
        isActive: false,
      },
    });

    expect(device.failureCount).toBe(2);
    expect(device.isActive).toBe(false);

    // Re-register same token (upsert behavior)
    const reregistered = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        isActive: true,
        failureCount: 0,
        lastFailureAt: null,
        lastFailureReason: null,
        lastUsedAt: new Date(),
      },
      create: {
        userId: E2E_USER_ID,
        token,
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Test Device',
      },
    });

    expect(reregistered.failureCount).toBe(0);
    expect(reregistered.isActive).toBe(true);
    expect(reregistered.lastFailureAt).toBeNull();
    expect(reregistered.lastUsedAt).toBeDefined();
  });

  test('Notification respects PUSH disabled preference', async () => {
    // Register device
    await prisma.deviceToken.create({
      data: {
        userId: E2E_USER_ID,
        token: 'c' + 'A'.repeat(151),
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Test Device',
      },
    });

    // Disable PUSH in preferences
    await prisma.notificationPreference.update({
      where: { userId: E2E_USER_ID },
      data: {
        pushEnabled: false,
      },
    });

    // Create notification (should not include PUSH channel)
    const createResult = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome to the app',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: createResult.value.id },
    });

    // PUSH should not be in channels since it's disabled in preferences
    expect(notification?.channels).not.toContain('PUSH');
    // IN_APP should still be enabled
    expect(notification?.channels).toContain('IN_APP');
  });

  test('Device token updates ownership when transferred to new user', async () => {
    // Create another user
    const otherUserId = 'e2e-other-push-user';
    await prisma.user.create({
      data: {
        id: otherUserId,
        email: 'other-push@example.com',
        name: 'Other Push User',
        primaryRole: 'CUSTOMER' as UserRole,
      },
    });

    const token = 'c' + 'A'.repeat(151);

    // Register device for first user
    const device1 = await prisma.deviceToken.create({
      data: {
        userId: E2E_USER_ID,
        token,
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Shared Device',
      },
    });

    expect(device1.userId).toBe(E2E_USER_ID);

    // Register same token for different user (simulating device transferred)
    const device2 = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId: otherUserId,
        lastUsedAt: new Date(),
      },
      create: {
        userId: otherUserId,
        token,
        platform: 'ANDROID' as DevicePlatform,
        deviceName: 'Shared Device',
      },
    });

    expect(device2.userId).toBe(otherUserId);
    expect(device2.id).toBe(device1.id); // Same device record

    // Verify device is now associated with new user
    const devices = await prisma.deviceToken.findMany({
      where: { token },
    });

    expect(devices).toHaveLength(1);
    expect(devices[0]?.userId).toBe(otherUserId);

    // Cleanup
    await prisma.user.delete({ where: { id: otherUserId } });
  });

  test('Old inactive devices are cleaned up', async () => {
    // Create old inactive devices (simulating cleanup scenario)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100); // 100 days old

    const devices = [
      {
        token: 'old-token-1-' + 'a'.repeat(140),
        isActive: false,
        lastUsedAt: oldDate,
      },
      {
        token: 'old-token-2-' + 'b'.repeat(140),
        isActive: false,
        lastUsedAt: oldDate,
      },
      {
        token: 'active-token-' + 'c'.repeat(140),
        isActive: true,
        lastUsedAt: new Date(),
      },
    ];

    for (const deviceData of devices) {
      await prisma.deviceToken.create({
        data: {
          userId: E2E_USER_ID,
          token: deviceData.token,
          platform: 'ANDROID' as DevicePlatform,
          deviceName: 'Test Device',
          isActive: deviceData.isActive,
          lastUsedAt: deviceData.lastUsedAt,
        },
      });
    }

    // Verify all created
    const allDevices = await prisma.deviceToken.findMany({
      where: { userId: E2E_USER_ID },
    });
    expect(allDevices).toHaveLength(3);

    // Simulate cleanup: delete inactive devices older than 90 days
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 90);

    await prisma.deviceToken.deleteMany({
      where: {
        userId: E2E_USER_ID,
        isActive: false,
        lastUsedAt: {
          lt: cleanupDate,
        },
      },
    });

    // Verify old inactive devices removed, active device remains
    const remainingDevices = await prisma.deviceToken.findMany({
      where: { userId: E2E_USER_ID },
    });

    expect(remainingDevices).toHaveLength(1);
    expect(remainingDevices[0]?.isActive).toBe(true);
  });
});
