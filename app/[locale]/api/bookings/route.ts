/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      studioId,
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      preferredDate,
      preferredTime,
      message,
    } = body;

    // Validate required fields
    if (
      !studioId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !preferredDate ||
      !preferredTime
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studioId,
        serviceId: serviceId || null,
        customerName,
        customerEmail,
        customerPhone,
        preferredDate,
        preferredTime,
        message: message || null,
        status: 'PENDING',
      },
      include: {
        studio: true,
        service: true,
      },
    });

    // TODO: Send email notification to studio
    // This will be implemented in the next step with Resend

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
