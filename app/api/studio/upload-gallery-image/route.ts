/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Upload Gallery Image
 * POST /api/studio/upload-gallery-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GALLERY_IMAGES = 8;

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const studioId = formData.get('studioId') as string;

    if (!file || !studioId) {
      return NextResponse.json(
        { message: 'Datei und Studio-ID erforderlich' },
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

    // Check if max images reached
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      return NextResponse.json(
        { message: `Maximale Anzahl von ${MAX_GALLERY_IMAGES} Bildern erreicht` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Ungültiger Dateityp. Nur JPG, PNG oder WebP erlaubt.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'Datei zu groß. Maximale Größe: 5MB.' },
        { status: 400 }
      );
    }

    // Process image with sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedImage = await sharp(buffer)
      .resize(1200, 800, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Save to disk
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'studios',
      studioId
    );
    await mkdir(uploadDir, { recursive: true });

    const filename = `gallery-${randomUUID()}.webp`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, processedImage);

    // Generate public URL
    const imageUrl = `/uploads/studios/${studioId}/${filename}`;

    // Update database - append to gallery
    const updatedGalleryImages = [...galleryImages, imageUrl];
    await prisma.studio.update({
      where: { id: studioId },
      data: {
        galleryImages: JSON.stringify(updatedGalleryImages),
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Gallery image upload error:', error);
    return NextResponse.json(
      { message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
