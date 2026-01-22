/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Booking Count API Tests
 *
 * Tests for the endpoint that returns the total booking count
 * for the authenticated customer.
 */

import { GET } from '@/app/api/bookings/customer/count/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    newBooking: {
      count: jest.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

describe('GET /api/bookings/customer/count', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/bookings/customer/count');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if session has no email', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { name: 'Test User' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/bookings/customer/count');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return booking count for authenticated user', async () => {
    const mockSession = {
      user: {
        email: 'customer@example.com',
        name: 'Test Customer',
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(3);

    const request = new NextRequest('http://localhost:3000/api/bookings/customer/count');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ count: 3 });

    // Verify query
    expect(prisma.newBooking.count).toHaveBeenCalledWith({
      where: {
        customerEmail: 'customer@example.com',
      },
    });
  });

  it('should return 0 if customer has no bookings', async () => {
    const mockSession = {
      user: {
        email: 'newcustomer@example.com',
        name: 'New Customer',
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/bookings/customer/count');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ count: 0 });
  });

  it('should handle database errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockSession = {
      user: {
        email: 'customer@example.com',
        name: 'Test Customer',
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.newBooking.count as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/bookings/customer/count');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Internal server error' });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[API] Error fetching customer booking count:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should only count bookings for the specific customer email', async () => {
    const mockSession = {
      user: {
        email: 'specific@example.com',
        name: 'Specific Customer',
      },
    };

    (auth as jest.Mock).mockResolvedValue(mockSession as any);
    (prisma.newBooking.count as jest.Mock).mockResolvedValue(5);

    const request = new NextRequest('http://localhost:3000/api/bookings/customer/count');
    await GET(request);

    // Verify the query filters by the correct email
    expect(prisma.newBooking.count).toHaveBeenCalledWith({
      where: {
        customerEmail: 'specific@example.com',
      },
    });
  });
});
