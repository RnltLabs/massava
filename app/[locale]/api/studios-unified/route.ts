/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studios API - Unified User Model
 * Phase 3: RBAC + Studio Ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { requirePermissionAPI } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

type ServiceInput = {
  name: string;
  description?: string;
  price: string | number;
  duration: string | number;
};

/**
 * POST /api/studios
 * Create a new studio (requires STUDIO_OWNER or SUPER_ADMIN role)
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Check permission
    const authResult = await requirePermissionAPI(request, 'studio:create');
    if (authResult.response) return authResult.response;
    const user = authResult.user!;

    const body = await request.json();
    const { name, description, address, city, postalCode, phone, email, services } = body;

    // Validate required fields
    if (!name || !address || !city || !phone || !email) {
      logger.warn('Studio creation validation failed', {
        correlationId,
        ipAddress,
        userId: user.id,
        action: 'CREATE_STUDIO',
        resource: 'studio',
        missingFields: { name: !name, address: !address, city: !city, phone: !phone, email: !email },
      });
      return NextResponse.json(
        {
          error: 'Fehlende Pflichtfelder',
          details: {
            name: !name ? 'Name ist erforderlich' : undefined,
            address: !address ? 'Adresse ist erforderlich' : undefined,
            city: !city ? 'Stadt ist erforderlich' : undefined,
            phone: !phone ? 'Telefon ist erforderlich' : undefined,
            email: !email ? 'E-Mail ist erforderlich' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Create studio with services
    const studio = await prisma.studio.create({
      data: {
        name,
        description: description || null,
        address,
        city,
        postalCode: postalCode || null,
        phone,
        email,
        services: {
          create: services?.map((service: ServiceInput) => ({
            name: service.name,
            description: service.description || null,
            price: parseFloat(service.price.toString()),
            duration: parseInt(service.duration.toString()),
          })) || [],
        },
      },
      include: {
        services: true,
      },
    });

    // Create ownership record
    await prisma.studioOwnership.create({
      data: {
        userId: user.id,
        studioId: studio.id,
        isPrimary: true,
        canTransfer: true,
        invitedBy: 'SELF_CREATED',
        acceptedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'STUDIO_CREATED',
      resource: 'studio',
      resourceId: studio.id,
      metadata: {
        studioName: name,
        city,
        servicesCount: services?.length || 0,
      },
      request,
    });

    logger.info('Studio created successfully', {
      correlationId,
      ipAddress,
      userAgent,
      userId: user.id,
      action: 'CREATE_STUDIO',
      resource: 'studio',
      resourceId: studio.id,
      studioName: name,
      city,
    });

    return NextResponse.json({ success: true, studio }, { status: 201 });
  } catch (error) {
    logger.error('Studio creation failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'CREATE_STUDIO',
      resource: 'studio',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Studio-Registrierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/studios
 * List studios (public endpoint)
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);

  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    const studios = await prisma.studio.findMany({
      where: city ? { city: { contains: city, mode: 'insensitive' } } : {},
      include: {
        services: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Studios fetched successfully', {
      correlationId,
      ipAddress,
      action: 'LIST_STUDIOS',
      resource: 'studio',
      count: studios.length,
      filterCity: city,
    });

    return NextResponse.json({ studios });
  } catch (error) {
    logger.error('Studio listing failed', {
      correlationId,
      ipAddress,
      action: 'LIST_STUDIOS',
      resource: 'studio',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Abrufen fehlgeschlagen' },
      { status: 500 }
    );
  }
}
