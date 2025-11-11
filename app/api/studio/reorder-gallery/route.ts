/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Reorder Gallery Images
 * POST /api/studio/reorder-gallery
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { studioId, galleryImages } = body;

    if (!studioId || !Array.isArray(galleryImages)) {
      return NextResponse.json(
        { message: 'Studio-ID und Galerie-Bilder erforderlich' },
        { status: 400 }
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

    // Update database
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        galleryImages: JSON.stringify(galleryImages),
      },
    });

    return NextResponse.json({
      success: true,
      galleryImages,
    });
  } catch (error) {
    console.error('Reorder gallery error:', error);
    return NextResponse.json(
      { message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
