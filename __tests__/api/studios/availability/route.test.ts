/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Availability API - Unit Tests
 */

import { GET } from '@/app/api/studios/[studioId]/availability/route';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/result';

// Mock the slots library
jest.mock('@/lib/slots', () => ({
  calculateAvailableSlots: jest.fn(),
}));

import { calculateAvailableSlots } from '@/lib/slots';

describe('Studio Availability API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return available slots for valid request', async () => {
    const mockSlots = [
      {
        startTime: '09:00',
        endTime: '09:15',
        available: true,
        remainingCapacity: 3,
      },
      {
        startTime: '09:15',
        endTime: '09:30',
        available: true,
        remainingCapacity: 2,
      },
      {
        startTime: '09:30',
        endTime: '09:45',
        available: false,
        remainingCapacity: 0,
        reason: 'at_capacity' as const,
      },
    ];

    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok(mockSlots));

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.studioId).toBe('test-studio-id');
    expect(data.date).toBe('2025-12-01');
    expect(data.slots).toHaveLength(3);
    expect(data.meta.totalSlots).toBe(3);
    expect(data.meta.availableSlots).toBe(2);

    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'test-studio-id',
      '2025-12-01',
      undefined,
      { includeUnavailable: false, minCapacity: 1 }
    );
  });

  it('should validate date format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=invalid-date'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Ungültige Query-Parameter');
    expect(data.details.date).toBeDefined();
  });

  it('should reject dates in the past', async () => {
    const pastDate = '2020-01-01';

    const request = new NextRequest(
      `http://localhost:3000/api/studios/test-studio-id/availability?date=${pastDate}`
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Ungültige Query-Parameter');
  });

  it('should handle studio not found error', async () => {
    jest.mocked(calculateAvailableSlots).mockResolvedValue(
      err({ type: 'STUDIO_NOT_FOUND', studioId: 'test-studio-id' })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('Studio nicht gefunden');
  });

  it('should handle invalid opening hours error', async () => {
    jest.mocked(calculateAvailableSlots).mockResolvedValue(
      err({ type: 'INVALID_OPENING_HOURS', studioId: 'test-studio-id' })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Ungültige Öffnungszeiten');
  });

  it('should handle database error', async () => {
    jest.mocked(calculateAvailableSlots).mockResolvedValue(
      err({ type: 'DATABASE_ERROR', message: 'Connection failed' })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Datenbankfehler');
    expect(data.message).toBe('Connection failed');
  });

  it('should filter slots by time range', async () => {
    const mockSlots = [
      {
        startTime: '09:00',
        endTime: '09:15',
        available: true,
        remainingCapacity: 3,
      },
      {
        startTime: '10:00',
        endTime: '10:15',
        available: true,
        remainingCapacity: 2,
      },
      {
        startTime: '11:00',
        endTime: '11:15',
        available: true,
        remainingCapacity: 1,
      },
    ];

    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok(mockSlots));

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01&startTime=09:30&endTime=10:30'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.slots).toHaveLength(1);
    expect(data.slots[0].startTime).toBe('10:00');
  });

  it('should support includeUnavailable parameter', async () => {
    const mockSlots = [
      {
        startTime: '09:00',
        endTime: '09:15',
        available: true,
        remainingCapacity: 3,
      },
      {
        startTime: '09:15',
        endTime: '09:30',
        available: false,
        remainingCapacity: 0,
        reason: 'at_capacity' as const,
      },
    ];

    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok(mockSlots));

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01&includeUnavailable=true'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.slots).toHaveLength(2);
    expect(data.meta.availableSlots).toBe(1);
    expect(data.meta.totalSlots).toBe(2);

    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'test-studio-id',
      '2025-12-01',
      undefined,
      { includeUnavailable: true, minCapacity: 1 }
    );
  });

  it('should support minCapacity parameter', async () => {
    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok([]));

    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01&minCapacity=2'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(200);

    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'test-studio-id',
      '2025-12-01',
      undefined,
      { includeUnavailable: false, minCapacity: 2 }
    );
  });

  it('should support serviceId parameter', async () => {
    jest.mocked(calculateAvailableSlots).mockResolvedValue(ok([]));

    const validServiceId = 'clw1234567890abcdefghij'; // Valid CUID format

    const request = new NextRequest(
      `http://localhost:3000/api/studios/test-studio-id/availability?date=2025-12-01&serviceId=${validServiceId}`
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(200);

    expect(calculateAvailableSlots).toHaveBeenCalledWith(
      'test-studio-id',
      '2025-12-01',
      validServiceId,
      { includeUnavailable: false, minCapacity: 1 }
    );
  });

  it('should require date parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/studios/test-studio-id/availability'
    );

    const response = await GET(request, {
      params: { studioId: 'test-studio-id' },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Ungültige Query-Parameter');
  });

  it('should validate invalid studioId', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/studios//availability?date=2025-12-01'
    );

    const response = await GET(request, {
      params: { studioId: '' },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Ungültige Studio-ID');
  });
});
