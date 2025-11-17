/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Get Gallery Images
 * GET /api/studio/[studioId]/gallery-images
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
): Promise<NextResponse> {
  try {
    const { studioId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Verify studio ownership
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      include: {
        ownerships: {
          where: {
            user: { email: session.user.email },
          },
        },
      },
    });

    if (!studio || studio.ownerships.length === 0) {
      return NextResponse.json(
        { message: 'Studio nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      );
    }

    // Parse gallery images
    let galleryImages: string[] = [];
    if (studio.galleryImages) {
      try {
        const parsed = JSON.parse(studio.galleryImages as string);
        galleryImages = Array.isArray(parsed) ? parsed : [];
      } catch {
        // If parsing fails, return empty array
      }
    }

    return NextResponse.json({
      success: true,
      galleryImages,
    });
  } catch (error) {
    console.error('Get gallery images error:', error);
    return NextResponse.json(
      { message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
