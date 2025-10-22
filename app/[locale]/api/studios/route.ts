/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

type ServiceInput = {
  name: string;
  description?: string;
  price: string | number;
  duration: string | number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, address, city, postalCode, phone, email, services } = body;

    // Validate required fields
    if (!name || !address || !city || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
          create: services.map((service: ServiceInput) => ({
            name: service.name,
            description: service.description || null,
            price: parseFloat(service.price.toString()),
            duration: parseInt(service.duration.toString()),
          })),
        },
      },
      include: {
        services: true,
      },
    });

    return NextResponse.json({ success: true, studio }, { status: 201 });
  } catch (error) {
    console.error('Studio registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register studio' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    return NextResponse.json({ studios });
  } catch (error) {
    console.error('Studio listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch studios' },
      { status: 500 }
    );
  }
}
