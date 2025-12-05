/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Booking Request Count API Tests
 *
 * Tests for the endpoint that returns the total booking request count
 * for the authenticated studio owner's studio.
 */

import { GET } from '@/app/api/studio/bookings/count/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    studioOwnership: {
      findFirst: jest.fn(),
    },
    newBooking: {
      count: jest.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

describe('GET /api/studio/bookings/count', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if session has no user ID', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 404 if user has no studio ownership', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'owner@example.com',
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'No studio found' });
  });

  it('should return booking request count for studio owner', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'owner@example.com',
      },
    };

    const mockOwnership = {
      studioId: 'studio-456',
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockResolvedValue(mockOwnership);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(5);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ count: 5 });

    // Verify ownership query
    expect(prisma.studioOwnership.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
      },
      select: {
        studioId: true,
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    // Verify booking count query
    expect(prisma.newBooking.count).toHaveBeenCalledWith({
      where: {
        studioId: 'studio-456',
      },
    });
  });

  it('should return 0 if studio has no booking requests', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'newowner@example.com',
      },
    };

    const mockOwnership = {
      studioId: 'studio-789',
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockResolvedValue(mockOwnership);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ count: 0 });
  });

  it('should return 1 for first booking request (trigger case)', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'owner@example.com',
      },
    };

    const mockOwnership = {
      studioId: 'studio-456',
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockResolvedValue(mockOwnership);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ count: 1 });
  });

  it('should handle database errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockSession = {
      user: {
        id: 'user-123',
        email: 'owner@example.com',
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Internal server error' });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[API] Error fetching studio booking count:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should use most recent studio ownership if user owns multiple studios', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'multiowner@example.com',
      },
    };

    const mockOwnership = {
      studioId: 'studio-latest',
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockResolvedValue(mockOwnership);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(3);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    await GET(request);

    // Verify it orders by invitedAt desc to get most recent
    expect(prisma.studioOwnership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          invitedAt: 'desc',
        },
      })
    );
  });

  it('should count all bookings regardless of status', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'owner@example.com',
      },
    };

    const mockOwnership = {
      studioId: 'studio-456',
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.studioOwnership.findFirst as jest.Mock).mockResolvedValue(mockOwnership);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(10);

    const request = new NextRequest('http://localhost:3000/api/studio/bookings/count');
    await GET(request);

    // Verify it counts ALL bookings (no status filter)
    expect(prisma.newBooking.count).toHaveBeenCalledWith({
      where: {
        studioId: 'studio-456',
      },
    });
  });
});
