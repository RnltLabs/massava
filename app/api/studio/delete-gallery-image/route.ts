/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Delete Gallery Image
 * DELETE /api/studio/delete-gallery-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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
    const { studioId, imageUrl } = body;

    if (!studioId || !imageUrl) {
      return NextResponse.json(
        { message: 'Studio-ID und Bild-URL erforderlich' },
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

    // Parse existing gallery images
    let galleryImages: string[] = [];
    if (studio.galleryImages) {
      try {
        const parsed = JSON.parse(studio.galleryImages as string);
        galleryImages = Array.isArray(parsed) ? parsed : [];
      } catch {
        // If parsing fails, treat as empty array
      }
    }

    // Check if image exists in gallery
    if (!galleryImages.includes(imageUrl)) {
      return NextResponse.json(
        { message: 'Bild nicht in Galerie gefunden' },
        { status: 404 }
      );
    }

    // Remove image from array
    const updatedGalleryImages = galleryImages.filter((url) => url !== imageUrl);

    // Update database
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        galleryImages: JSON.stringify(updatedGalleryImages),
      },
    });

    // Delete file from disk (best effort - don't fail if file doesn't exist)
    try {
      const filePath = path.join(process.cwd(), 'public', imageUrl);
      await unlink(filePath);
    } catch (error) {
      // File might not exist or already deleted - log but continue
      console.warn('Could not delete file:', imageUrl, error);
    }

    return NextResponse.json({
      success: true,
      galleryImages: updatedGalleryImages,
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    return NextResponse.json(
      { message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
