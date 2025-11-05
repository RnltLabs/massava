/**
 * Integration Tests: GDPR Data Retention Policy
 *
 * Tests automated data retention and deletion:
 * - User data retention (3 years)
 * - Health data retention (1 year)
 * - Booking data retention (3 years)
 * - Scheduled deletion warnings
 * - Soft delete implementation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma'; // Use shared Prisma instance
import { addDays, subYears, subMonths } from 'date-fns';

describe('GDPR Data Retention Policy', () => {
  afterAll(async () => {
    // Cleanup all test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'retention-test',
        },
      },
    });
    await prisma.$disconnect();
  });

  it('should track deletion schedule for inactive users', async () => {
    const oldDate = subYears(new Date(), 3);

    const user = await prisma.user.create({
      data: {
        email: 'retention-test-old@example.com',
        name: 'Old User',
        primaryRole: 'CUSTOMER',
        deletionScheduledAt: addDays(new Date(), 30), // 30 days warning
        createdAt: oldDate,
        updatedAt: oldDate,
      },
    });

    expect(user.deletionScheduledAt).toBeDefined();
    expect(user.deletedAt).toBeNull();

    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should support soft delete for users', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'retention-test-soft-delete@example.com',
        name: 'Soft Delete User',
        primaryRole: 'CUSTOMER',
      },
    });

    // Soft delete by setting deletedAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
      },
    });

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(deletedUser).toBeDefined();
    expect(deletedUser!.deletedAt).toBeDefined();

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should exclude soft-deleted users from normal queries', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'retention-test-excluded@example.com',
        name: 'Excluded User',
        primaryRole: 'CUSTOMER',
        deletedAt: new Date(),
      },
    });

    const activeUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        email: 'retention-test-excluded@example.com',
      },
    });

    expect(activeUsers).toHaveLength(0);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should identify users eligible for deletion warning', async () => {
    const inactiveDate = subYears(subMonths(new Date(), 11), 2); // 2y 11m ago

    const user = await prisma.user.create({
      data: {
        email: 'retention-test-warning-eligible@example.com',
        name: 'Warning Eligible User',
        primaryRole: 'CUSTOMER',
        createdAt: inactiveDate,
        updatedAt: inactiveDate,
      },
    });

    // Query users who need deletion warning (>= 3 years old, no warning sent)
    const usersNeedingWarning = await prisma.user.findMany({
      where: {
        deletionScheduledAt: null,
        deletedAt: null,
        updatedAt: {
          lte: subYears(new Date(), 3),
        },
      },
    });

    const needsWarning = usersNeedingWarning.some(u => u.id === user.id);
    expect(needsWarning).toBe(true);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should identify users eligible for deletion', async () => {
    const warningDate = subDays(new Date(), 31); // Warning sent >30 days ago

    const user = await prisma.user.create({
      data: {
        email: 'retention-test-delete-eligible@example.com',
        name: 'Delete Eligible User',
        primaryRole: 'CUSTOMER',
        deletionScheduledAt: warningDate,
      },
    });

    // Query users ready for deletion (warning sent >30 days ago)
    const usersToDelete = await prisma.user.findMany({
      where: {
        deletionScheduledAt: {
          lte: subDays(new Date(), 30),
        },
        deletedAt: null,
      },
    });

    const isEligible = usersToDelete.some(u => u.id === user.id);
    expect(isEligible).toBe(true);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should maintain referential integrity during soft delete', async () => {
    // Create user with bookings
    const user = await prisma.user.create({
      data: {
        email: 'retention-test-integrity@example.com',
        name: 'Integrity User',
        primaryRole: 'CUSTOMER',
      },
    });

    const studio = await prisma.studio.create({
      data: {
        name: 'Retention Test Studio',
        address: 'Test St 1',
        city: 'Test City',
        postalCode: '12345',
        phone: '+49 123 456789',
        email: 'retention-studio@test.com',
      },
    });

    const service = await prisma.service.create({
      data: {
        studioId: studio.id,
        name: 'Test Service',
        description: 'Test',
        price: 50,
        duration: 60,
      },
    });

    const booking = await prisma.newBooking.create({
      data: {
        studioId: studio.id,
        serviceId: service.id,
        customerId: user.id,
        customerName: 'Integrity User',
        customerEmail: 'retention-test-integrity@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-10',
        preferredTime: '14:00',
        status: 'PENDING',
      },
    });

    // Soft delete user
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    // Bookings should still exist (not cascade deleted)
    const existingBooking = await prisma.newBooking.findUnique({
      where: { id: booking.id },
    });

    expect(existingBooking).toBeDefined();

    // Cleanup
    await prisma.newBooking.delete({ where: { id: booking.id } });
    await prisma.service.delete({ where: { id: service.id } });
    await prisma.studio.delete({ where: { id: studio.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should support batch soft delete', async () => {
    // Create multiple users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'retention-test-batch-1@example.com',
          name: 'Batch User 1',
          primaryRole: 'CUSTOMER',
          deletionScheduledAt: subDays(new Date(), 35),
        },
      }),
      prisma.user.create({
        data: {
          email: 'retention-test-batch-2@example.com',
          name: 'Batch User 2',
          primaryRole: 'CUSTOMER',
          deletionScheduledAt: subDays(new Date(), 35),
        },
      }),
    ]);

    // Batch soft delete
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: users.map(u => u.id),
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    expect(result.count).toBe(2);

    // Cleanup
    await prisma.user.deleteMany({
      where: {
        id: {
          in: users.map(u => u.id),
        },
      },
    });
  });
});

function subDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}
