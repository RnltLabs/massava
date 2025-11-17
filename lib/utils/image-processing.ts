/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Server-side Image Processing Utilities
 * Uses sharp for high-performance image manipulation
 */

import sharp from 'sharp';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface ProcessImageOptions {
  width: number;
  height: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string | number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface SaveImageOptions extends ProcessImageOptions {
  studioId: string;
  prefix: string;
}

/**
 * Process image buffer with sharp
 */
export async function processImage(
  buffer: Buffer,
  options: ProcessImageOptions
): Promise<Buffer> {
  const {
    width,
    height,
    quality = 85,
    fit = 'cover',
    position = 'center',
    format = 'webp',
  } = options;

  let pipeline = sharp(buffer).resize(width, height, {
    fit,
    position,
  });

  // Apply format-specific settings
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, progressive: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Process logo image (512x512, high quality)
 */
export async function processLogoImage(buffer: Buffer): Promise<Buffer> {
  return processImage(buffer, {
    width: 512,
    height: 512,
    quality: 90,
    fit: 'cover',
    format: 'webp',
  });
}

/**
 * Process gallery image (1200x800, good quality)
 */
export async function processGalleryImage(buffer: Buffer): Promise<Buffer> {
  return processImage(buffer, {
    width: 1200,
    height: 800,
    quality: 85,
    fit: 'cover',
    format: 'webp',
  });
}

/**
 * Save processed image to disk
 */
export async function saveImageToDisk(
  buffer: Buffer,
  options: SaveImageOptions
): Promise<string> {
  const { studioId, prefix } = options;

  // Create upload directory
  const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'studios',
    studioId
  );
  await mkdir(uploadDir, { recursive: true });

  // Generate secure filename
  const filename = `${prefix}-${randomUUID()}.webp`;
  const filePath = path.join(uploadDir, filename);

  // Process and save image
  const processedBuffer = await processImage(buffer, options);
  await writeFile(filePath, processedBuffer);

  // Return public URL
  return `/uploads/studios/${studioId}/${filename}`;
}

/**
 * Save logo image to disk
 */
export async function saveLogoImage(
  buffer: Buffer,
  studioId: string
): Promise<string> {
  return saveImageToDisk(buffer, {
    studioId,
    prefix: 'logo',
    width: 512,
    height: 512,
    quality: 90,
    fit: 'cover',
  });
}

/**
 * Save gallery image to disk
 */
export async function saveGalleryImage(
  buffer: Buffer,
  studioId: string
): Promise<string> {
  return saveImageToDisk(buffer, {
    studioId,
    prefix: 'gallery',
    width: 1200,
    height: 800,
    quality: 85,
    fit: 'cover',
  });
}

/**
 * Delete image from disk
 */
export async function deleteImageFromDisk(imageUrl: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'public', imageUrl);
    await unlink(filePath);
  } catch (error) {
    // File might not exist or already deleted - log but don't throw
    console.warn('Could not delete file:', imageUrl, error);
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
  return sharp(buffer).metadata();
}

/**
 * Validate image buffer
 */
export async function validateImageBuffer(buffer: Buffer): Promise<{
  valid: boolean;
  error?: string;
  metadata?: sharp.Metadata;
}> {
  try {
    const metadata = await getImageMetadata(buffer);

    // Check if it's a valid image format
    if (!metadata.format) {
      return {
        valid: false,
        error: 'Ungültiges Bildformat',
      };
    }

    // Check if format is supported
    const supportedFormats = ['jpeg', 'png', 'webp', 'gif'];
    if (!supportedFormats.includes(metadata.format)) {
      return {
        valid: false,
        error: `Bildformat ${metadata.format} wird nicht unterstützt`,
      };
    }

    // Check dimensions
    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Bilddimensionen konnten nicht ermittelt werden',
      };
    }

    // Check minimum dimensions (at least 100x100)
    if (metadata.width < 100 || metadata.height < 100) {
      return {
        valid: false,
        error: 'Bild ist zu klein (mindestens 100x100 Pixel erforderlich)',
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Fehler beim Validieren des Bildes',
    };
  }
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Extract dominant color from image
 */
export async function extractDominantColor(buffer: Buffer): Promise<{
  r: number;
  g: number;
  b: number;
}> {
  const { dominant } = await sharp(buffer).stats();
  return dominant;
}

/**
 * Optimize existing image file
 */
export async function optimizeImageFile(
  inputPath: string,
  outputPath?: string
): Promise<void> {
  const actualOutputPath = outputPath || inputPath;

  await sharp(inputPath)
    .webp({ quality: 85 })
    .toFile(actualOutputPath);
}
