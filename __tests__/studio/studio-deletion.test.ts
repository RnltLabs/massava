/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Deletion Tests
 * Unit and integration tests for studio deletion feature
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { deleteStudio, verifyUserPassword } from '@/app/actions/studio/deleteStudio';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    studioOwnership: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    studio: {
      delete: vi.fn(),
    },
    service: {
      deleteMany: vi.fn(),
    },
    newBooking: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    rm: vi.fn(),
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

describe('Studio Deletion', () => {
  const mockUserId = 'user-123';
  const mockStudioId = 'studio-456';
  const mockPassword = 'correct-password';
  const mockHashedPassword = '$2a$10$mockhashedpassword';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteStudio', () => {
    it('should successfully delete studio with valid credentials', async () => {
      // Mock authenticated session
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      // Mock user with password
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock password verification
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // Mock studio ownership
      vi.mocked(db.studioOwnership.findFirst).mockResolvedValue({
        id: 'ownership-123',
        userId: mockUserId,
        studioId: mockStudioId,
        canTransfer: false,
        invitedBy: null,
        invitedAt: new Date(),
        acceptedAt: new Date(),
        studio: {
          id: mockStudioId,
          name: 'Test Studio',
          galleryImages: null,
          logoUrl: null,
        },
      });

      // Mock transaction
      vi.mocked(db.$transaction).mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        return callback({
          service: {
            deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
          },
          newBooking: {
            deleteMany: vi.fn().mockResolvedValue({ count: 10 }),
          },
          studioOwnership: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          studio: {
            delete: vi.fn().mockResolvedValue({ id: mockStudioId }),
          },
        } as never);
      });

      // Mock file system (no images)
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT') as never);

      const result = await deleteStudio({
        studioId: mockStudioId,
        password: mockPassword,
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject deletion with incorrect password', async () => {
      // Mock authenticated session
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      // Mock user with password
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock password verification (WRONG PASSWORD)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await deleteStudio({
        studioId: mockStudioId,
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Falsches Passwort');
    });

    it('should reject deletion if user is not authenticated', async () => {
      // Mock unauthenticated session
      vi.mocked(auth).mockResolvedValue(null);

      const result = await deleteStudio({
        studioId: mockStudioId,
        password: mockPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nicht authentifiziert');
    });

    it('should reject deletion if user does not own the studio', async () => {
      // Mock authenticated session
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      // Mock user with password
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock password verification
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // Mock NO ownership found
      vi.mocked(db.studioOwnership.findFirst).mockResolvedValue(null);

      const result = await deleteStudio({
        studioId: mockStudioId,
        password: mockPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Studio nicht gefunden');
    });

    it('should delete studio images from file system if they exist', async () => {
      // Mock authenticated session
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      // Mock user with password
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock password verification
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // Mock studio ownership
      vi.mocked(db.studioOwnership.findFirst).mockResolvedValue({
        id: 'ownership-123',
        userId: mockUserId,
        studioId: mockStudioId,
        canTransfer: false,
        invitedBy: null,
        invitedAt: new Date(),
        acceptedAt: new Date(),
        studio: {
          id: mockStudioId,
          name: 'Test Studio',
          galleryImages: ['image1.jpg', 'image2.jpg'],
          logoUrl: 'logo.jpg',
        },
      });

      // Mock transaction
      vi.mocked(db.$transaction).mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        return callback({
          service: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
          newBooking: { deleteMany: vi.fn().mockResolvedValue({ count: 10 }) },
          studioOwnership: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
          studio: { delete: vi.fn().mockResolvedValue({ id: mockStudioId }) },
        } as never);
      });

      // Mock file system (images exist)
      vi.mocked(fs.access).mockResolvedValue(undefined as never);
      vi.mocked(fs.rm).mockResolvedValue(undefined as never);

      const result = await deleteStudio({
        studioId: mockStudioId,
        password: mockPassword,
      });

      expect(result.success).toBe(true);
      expect(fs.rm).toHaveBeenCalled();
    });
  });

  describe('verifyUserPassword', () => {
    it('should successfully verify correct password', async () => {
      // Mock authenticated session
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      // Mock user with password
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock password verification
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await verifyUserPassword(mockPassword);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject incorrect password', async () => {
      // Mock authenticated session
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      // Mock user with password
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock password verification (WRONG)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await verifyUserPassword('wrong-password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Falsches Passwort');
    });

    it('should reject if user is not authenticated', async () => {
      // Mock unauthenticated session
      vi.mocked(auth).mockResolvedValue(null);

      const result = await verifyUserPassword(mockPassword);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nicht authentifiziert');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow deletion within rate limit', async () => {
      // First attempt
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'owner@example.com' },
        expires: new Date().toISOString(),
      });

      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'owner@example.com',
        password: mockHashedPassword,
        name: 'Test Owner',
        emailVerified: new Date(),
        image: null,
        primaryRole: 'STUDIO_OWNER',
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      // Attempt 1
      await deleteStudio({ studioId: mockStudioId, password: 'wrong1' });
      // Attempt 2
      await deleteStudio({ studioId: mockStudioId, password: 'wrong2' });
      // Attempt 3
      await deleteStudio({ studioId: mockStudioId, password: 'wrong3' });

      // All should fail with wrong password, not rate limit
      const result = await deleteStudio({ studioId: mockStudioId, password: 'wrong4' });

      // Fourth attempt should be rate limited
      expect(result.success).toBe(false);
      expect(result.error).toContain('Zu viele Löschversuche');
    });
  });
});
