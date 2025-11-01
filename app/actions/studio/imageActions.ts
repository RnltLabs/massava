/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Image Management Actions
 * Server actions for uploading, deleting, and managing studio images
 */

'use server';

import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

export interface ImageActionResult {
  success: boolean;
  error?: string;
  url?: string;
}

export interface GalleryImage {
  url: string;
  coverPhoto: boolean;
  order: number;
}

/**
 * Upload and optimize studio logo
 */
export async function uploadStudioLogo(
  formData: FormData,
  studioId: string
): Promise<ImageActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    const file = formData.get('logo') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = 'webp'; // Always convert to webp
    const filename = `logo-${studioId}-${hash}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'studios', studioId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);

    // Optimize and resize image (square, 400x400)
    await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Delete old logo if exists
    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: { logoUrl: true },
    });

    if (studio?.logoUrl) {
      const oldFilepath = path.join(process.cwd(), 'public', studio.logoUrl);
      if (existsSync(oldFilepath)) {
        await unlink(oldFilepath).catch(() => {
          // Ignore errors if file doesn't exist
        });
      }
    }

    // Generate public URL
    const publicUrl = `/uploads/studios/${studioId}/${filename}`;

    // Update database
    await db.studio.update({
      where: { id: studioId },
      data: { logoUrl: publicUrl },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Logo upload error:', error);
    return {
      success: false,
      error: 'Failed to upload logo',
    };
  }
}

/**
 * Upload and optimize gallery image
 */
export async function uploadGalleryImage(
  formData: FormData,
  studioId: string
): Promise<ImageActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    const file = formData.get('image') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Get current gallery images
    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: { galleryImages: true },
    });

    const currentGallery = (studio?.galleryImages as unknown as GalleryImage[]) || [];

    // Check max images limit
    if (currentGallery.length >= 10) {
      return {
        success: false,
        error: 'Maximum 10 gallery images allowed',
      };
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = 'webp'; // Always convert to webp
    const filename = `gallery-${studioId}-${hash}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'studios', studioId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);

    // Optimize and resize image (max 1200px width, maintain aspect ratio)
    await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Generate public URL
    const publicUrl = `/uploads/studios/${studioId}/${filename}`;

    // Add to gallery (first image is cover photo)
    const newImage: GalleryImage = {
      url: publicUrl,
      coverPhoto: currentGallery.length === 0,
      order: currentGallery.length,
    };

    const updatedGallery = [...currentGallery, newImage];

    // Update database
    await db.studio.update({
      where: { id: studioId },
      data: { galleryImages: updatedGallery as any },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Gallery image upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image',
    };
  }
}

/**
 * Delete gallery image
 */
export async function deleteGalleryImage(
  imageUrl: string,
  studioId: string
): Promise<ImageActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    // Get current gallery images
    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: { galleryImages: true },
    });

    const currentGallery = (studio?.galleryImages as unknown as GalleryImage[]) || [];

    // Remove image from gallery
    const updatedGallery = currentGallery.filter((img) => img.url !== imageUrl);

    // Reorder and reset cover photo if needed
    const reorderedGallery = updatedGallery.map((img, index) => ({
      ...img,
      order: index,
      coverPhoto: index === 0,
    }));

    // Update database
    await db.studio.update({
      where: { id: studioId },
      data: { galleryImages: reorderedGallery as any },
    });

    // Delete file from filesystem
    const filepath = path.join(process.cwd(), 'public', imageUrl);
    if (existsSync(filepath)) {
      await unlink(filepath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete image error:', error);
    return {
      success: false,
      error: 'Failed to delete image',
    };
  }
}

/**
 * Reorder gallery images
 */
export async function reorderGalleryImages(
  images: GalleryImage[],
  studioId: string
): Promise<ImageActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    // Update order and cover photo
    const reorderedImages = images.map((img, index) => ({
      ...img,
      order: index,
      coverPhoto: index === 0,
    }));

    // Update database
    await db.studio.update({
      where: { id: studioId },
      data: { galleryImages: reorderedImages },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reorder images error:', error);
    return {
      success: false,
      error: 'Failed to reorder images',
    };
  }
}

/**
 * Update studio images (for registration flow)
 */
export async function updateStudioImages(
  studioId: string,
  data: {
    logoUrl?: string | null;
    galleryImages?: GalleryImage[] | null;
  }
): Promise<ImageActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    // Update database
    await db.studio.update({
      where: { id: studioId },
      data: {
        logoUrl: data.logoUrl,
        galleryImages: data.galleryImages as any,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update images error:', error);
    return {
      success: false,
      error: 'Failed to update images',
    };
  }
}

/**
 * Delete studio logo
 */
export async function deleteStudioLogo(studioId: string): Promise<ImageActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify user owns the studio
    const ownership = await db.studioOwnership.findFirst({
      where: {
        studioId,
        userId: session.user.id,
      },
    });

    if (!ownership) {
      return {
        success: false,
        error: 'Not authorized to modify this studio',
      };
    }

    // Get current logo
    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: { logoUrl: true },
    });

    if (studio?.logoUrl) {
      // Delete file from filesystem
      const filepath = path.join(process.cwd(), 'public', studio.logoUrl);
      if (existsSync(filepath)) {
        await unlink(filepath).catch(() => {
          // Ignore errors if file doesn't exist
        });
      }
    }

    // Update database
    await db.studio.update({
      where: { id: studioId },
      data: { logoUrl: null },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete logo error:', error);
    return {
      success: false,
      error: 'Failed to delete logo',
    };
  }
}
