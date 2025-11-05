/**
 * Integration Tests: Health Data Encryption (GDPR Art. 9)
 *
 * Tests the complete encryption flow for special category data using Prisma Client Extensions:
 * - Automatic encryption on write
 * - Automatic decryption on read
 * - Direct database validation
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma'; // Use shared Prisma instance with extension
import { PrismaClient } from '@/app/generated/prisma';
import { isEncrypted } from '@/lib/encryption/health-data';

describe('Health Data Encryption (GDPR Art. 9)', () => {
  let testCustomerId: string;
  let testStudioId: string;
  let testServiceId: string;

  beforeAll(async () => {
    // Create test data - use Customer model (bookings reference customers, not users)
    const customer = await prisma.customer.create({
      data: {
        email: 'health-test@example.com',
        name: 'Health Test User',
        emailVerified: new Date(),
      },
    });
    testCustomerId = customer.id;

    const studio = await prisma.studio.create({
      data: {
        name: 'Test Wellness Studio',
        address: 'Test Street 1',
        city: 'Test City',
        postalCode: '12345',
        phone: '+49 123 456789',
        email: 'test@studio.com',
      },
    });
    testStudioId = studio.id;

    const service = await prisma.service.create({
      data: {
        studioId: testStudioId,
        name: 'Test Massage',
        description: 'Test service',
        price: 50,
        duration: 60,
      },
    });
    testServiceId = service.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.service.deleteMany({
      where: { studioId: testStudioId },
    });
    await prisma.studio.delete({
      where: { id: testStudioId },
    });
    await prisma.customer.delete({
      where: { id: testCustomerId },
    });
    await prisma.$disconnect();
  });

  it('should encrypt health data when creating booking with health information', async () => {
    const healthData = 'Rückenschmerzen im unteren Bereich';

    // Create booking using extended Prisma client (auto-encrypts)
    const booking = await prisma.booking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testCustomerId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-10',
        preferredTime: '14:00',
        message: healthData,
        explicitHealthConsent: true,
        healthConsentGivenAt: new Date(),
        status: 'PENDING',
      },
    });

    // Through the extended client, we see the DECRYPTED message
    expect(booking.message).toBe(healthData);

    // But in the actual database, it should be ENCRYPTED
    // Use a fresh Prisma client WITHOUT extension to check raw DB value
    const rawClient = new PrismaClient();
    const rawBooking = await rawClient.booking.findUnique({
      where: { id: booking.id },
    });
    await rawClient.$disconnect();

    // Raw message from DB should be encrypted (different from original)
    expect(rawBooking?.message).toBeDefined();
    expect(rawBooking?.message).not.toBe(healthData);
    expect(isEncrypted(rawBooking?.message || '')).toBe(true);

    // Cleanup
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  it('should decrypt health data when reading booking', async () => {
    const healthData = 'Migräne-Probleme, bitte sanften Druck';

    // Create booking with health data (will be auto-encrypted in DB)
    const booking = await prisma.booking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testCustomerId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-11',
        preferredTime: '15:00',
        message: healthData,
        explicitHealthConsent: true,
        healthConsentGivenAt: new Date(),
        status: 'PENDING',
      },
    });

    // When reading with extended client, message should be automatically decrypted
    const readBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(readBooking).toBeDefined();
    expect(readBooking?.message).toBe(healthData);

    // Verify it's actually encrypted in the database
    const rawClient = new PrismaClient();
    const rawBooking = await rawClient.booking.findUnique({
      where: { id: booking.id },
    });
    await rawClient.$disconnect();

    expect(rawBooking?.message).not.toBe(healthData);
    expect(isEncrypted(rawBooking?.message || '')).toBe(true);

    // Cleanup
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  it('should handle bookings without health data', async () => {
    // Create booking WITHOUT message (no health data)
    const booking = await prisma.booking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testCustomerId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-12',
        preferredTime: '16:00',
        message: null,
        explicitHealthConsent: false,
        status: 'PENDING',
      },
    });

    expect(booking.message).toBeNull();

    // Read it back
    const readBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(readBooking?.message).toBeNull();

    // Cleanup
    await prisma.booking.delete({ where: { id: booking.id } });
  });
});
