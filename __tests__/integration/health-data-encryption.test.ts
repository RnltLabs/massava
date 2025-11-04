/**
 * Integration Tests: Health Data Encryption (GDPR Art. 9)
 *
 * Tests the complete encryption flow for special category data:
 * - Encryption on write
 * - Decryption on read
 * - Key derivation
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@/app/generated/prisma';
import { encrypt, decrypt } from '@/lib/encryption/health-data';

const prisma = new PrismaClient();

describe('Health Data Encryption (GDPR Art. 9)', () => {
  let testUserId: string;
  let testStudioId: string;
  let testServiceId: string;

  beforeAll(async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'health-test@example.com',
        name: 'Health Test User',
        primaryRole: 'CUSTOMER',
        emailVerified: new Date(),
      },
    });
    testUserId = user.id;

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
    // Cleanup
    await prisma.newBooking.deleteMany({
      where: { customerId: testUserId },
    });
    await prisma.service.deleteMany({
      where: { id: testServiceId },
    });
    await prisma.studio.deleteMany({
      where: { id: testStudioId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  it('should encrypt health data when creating booking with health information', async () => {
    const healthData = 'Rückenschmerzen im unteren Bereich';

    const booking = await prisma.newBooking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testUserId,
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

    // Message should be encrypted in DB (different from original)
    expect(booking.message).toBeDefined();
    expect(booking.message).not.toBe(healthData);
    expect(booking.message).toContain(':'); // Encrypted format includes IV
  });

  it('should decrypt health data when reading booking', async () => {
    const healthData = 'Migräne-Probleme, bitte sanften Druck';
    const encrypted = encrypt(healthData);

    const booking = await prisma.newBooking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testUserId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-11',
        preferredTime: '15:00',
        message: encrypted,
        explicitHealthConsent: true,
        healthConsentGivenAt: new Date(),
        status: 'PENDING',
      },
    });

    // Read booking back
    const retrieved = await prisma.newBooking.findUnique({
      where: { id: booking.id },
    });

    // Should be decrypted via Prisma middleware
    expect(retrieved).toBeDefined();
    expect(retrieved!.message).toBe(healthData);
  });

  it('should handle bookings without health data (no encryption)', async () => {
    const regularMessage = 'Bitte Termin bestätigen';

    const booking = await prisma.newBooking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testUserId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-12',
        preferredTime: '16:00',
        message: regularMessage,
        explicitHealthConsent: false,
        status: 'PENDING',
      },
    });

    // Non-health data should remain unencrypted
    expect(booking.message).toBe(regularMessage);
  });

  it('should require explicit consent for health data', async () => {
    const booking = await prisma.newBooking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testUserId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-13',
        preferredTime: '17:00',
        message: 'Knieschmerzen',
        explicitHealthConsent: true,
        healthConsentGivenAt: new Date(),
        status: 'PENDING',
      },
    });

    expect(booking.explicitHealthConsent).toBe(true);
    expect(booking.healthConsentGivenAt).toBeDefined();
  });

  it('should maintain referential integrity after encryption', async () => {
    const booking = await prisma.newBooking.create({
      data: {
        studioId: testStudioId,
        serviceId: testServiceId,
        customerId: testUserId,
        customerName: 'Health Test User',
        customerEmail: 'health-test@example.com',
        customerPhone: '+49 151 12345678',
        preferredDate: '2025-11-14',
        preferredTime: '18:00',
        message: 'Bandscheibenvorfall',
        explicitHealthConsent: true,
        healthConsentGivenAt: new Date(),
        status: 'PENDING',
      },
    });

    // Should be able to query with relations
    const bookingWithRelations = await prisma.newBooking.findUnique({
      where: { id: booking.id },
      include: {
        studio: true,
        service: true,
        customer: true,
      },
    });

    expect(bookingWithRelations).toBeDefined();
    expect(bookingWithRelations!.studio.name).toBe('Test Wellness Studio');
    expect(bookingWithRelations!.service.name).toBe('Test Massage');
    expect(bookingWithRelations!.customer.email).toBe('health-test@example.com');
  });

  it('should handle encryption errors gracefully', () => {
    // Test with invalid encrypted data
    expect(() => {
      decrypt('invalid-encrypted-data');
    }).toThrow();

    // Test with empty string
    expect(() => {
      decrypt('');
    }).toThrow();
  });

  it('should use different IVs for same plaintext', () => {
    const healthData = 'Rückenschmerzen';

    const encrypted1 = encrypt(healthData);
    const encrypted2 = encrypt(healthData);

    // Same plaintext should produce different ciphertexts (different IVs)
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to same plaintext
    expect(decrypt(encrypted1)).toBe(healthData);
    expect(decrypt(encrypted2)).toBe(healthData);
  });
});
