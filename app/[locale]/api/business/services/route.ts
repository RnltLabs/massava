/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Service Schema
 */
const serviceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  category: z.string().min(2).max(50).optional(),
});

/**
 * Get user's studio
 */
async function getUserStudio(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  return user?.ownedStudios[0]?.studio ?? null;
}

/**
 * GET /api/business/services
 * Get all services for the authenticated user's studio
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return NextResponse.json({ error: 'No studio found' }, { status: 404 });
    }

    const services = await prisma.service.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('GET /api/business/services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/business/services
 * Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return NextResponse.json({ error: 'No studio found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = serviceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        ...validated.data,
        studioId: studio.id,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('POST /api/business/services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/business/services
 * Update an existing service
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return NextResponse.json({ error: 'No studio found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const validated = serviceSchema.safeParse(data);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Verify service belongs to user's studio
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        studioId: studio.id,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = await prisma.service.update({
      where: { id },
      data: validated.data,
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error('PUT /api/business/services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/business/services
 * Delete a service
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return NextResponse.json({ error: 'No studio found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Verify service belongs to user's studio
    const service = await prisma.service.findFirst({
      where: {
        id,
        studioId: studio.id,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('DELETE /api/business/services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
