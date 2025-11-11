/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Image Validation Utilities
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_GALLERY_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_GALLERY_IMAGES = 8;

export const LOGO_DIMENSIONS = {
  width: 512,
  height: 512,
} as const;

export const GALLERY_DIMENSIONS = {
  width: 1200,
  height: 800,
} as const;

export interface ImageValidationError {
  field: string;
  message: string;
}

export interface ImageValidationResult {
  valid: boolean;
  errors: ImageValidationError[];
}

/**
 * Validate image file for logo upload
 */
export function validateLogoFile(file: File): ImageValidationResult {
  const errors: ImageValidationError[] = [];

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push({
      field: 'type',
      message: 'Nur JPG, PNG oder WebP Dateien sind erlaubt.',
    });
  }

  // Check file size
  if (file.size > MAX_LOGO_SIZE) {
    errors.push({
      field: 'size',
      message: `Datei zu groß. Maximale Größe: ${formatFileSize(MAX_LOGO_SIZE)}.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image file for gallery upload
 */
export function validateGalleryImageFile(file: File): ImageValidationResult {
  const errors: ImageValidationError[] = [];

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push({
      field: 'type',
      message: 'Nur JPG, PNG oder WebP Dateien sind erlaubt.',
    });
  }

  // Check file size
  if (file.size > MAX_GALLERY_IMAGE_SIZE) {
    errors.push({
      field: 'size',
      message: `Datei zu groß. Maximale Größe: ${formatFileSize(MAX_GALLERY_IMAGE_SIZE)}.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple files for gallery upload
 */
export function validateGalleryFiles(
  files: File[],
  currentImageCount: number
): ImageValidationResult {
  const errors: ImageValidationError[] = [];

  // Check if adding files would exceed max
  if (currentImageCount + files.length > MAX_GALLERY_IMAGES) {
    errors.push({
      field: 'count',
      message: `Maximale Anzahl von ${MAX_GALLERY_IMAGES} Bildern würde überschritten. Sie können noch ${
        MAX_GALLERY_IMAGES - currentImageCount
      } Bild(er) hinzufügen.`,
    });
  }

  // Validate each file
  files.forEach((file, index) => {
    const result = validateGalleryImageFile(file);
    if (!result.valid) {
      result.errors.forEach((error) => {
        errors.push({
          field: `file-${index}`,
          message: `${file.name}: ${error.message}`,
        });
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file is an image by extension
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * Generate secure filename with UUID
 */
export function generateSecureFilename(prefix: string, extension: string = 'webp'): string {
  // Using timestamp + random string for uniqueness
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

/**
 * Validate image dimensions (client-side)
 */
export async function validateImageDimensions(
  file: File,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<ImageValidationResult> {
  const errors: ImageValidationError[] = [];

  try {
    const dimensions = await getImageDimensions(file);

    if (minWidth && dimensions.width < minWidth) {
      errors.push({
        field: 'dimensions',
        message: `Bildbreite zu klein. Mindestens ${minWidth}px erforderlich.`,
      });
    }

    if (minHeight && dimensions.height < minHeight) {
      errors.push({
        field: 'dimensions',
        message: `Bildhöhe zu klein. Mindestens ${minHeight}px erforderlich.`,
      });
    }

    if (maxWidth && dimensions.width > maxWidth) {
      errors.push({
        field: 'dimensions',
        message: `Bildbreite zu groß. Maximal ${maxWidth}px erlaubt.`,
      });
    }

    if (maxHeight && dimensions.height > maxHeight) {
      errors.push({
        field: 'dimensions',
        message: `Bildhöhe zu groß. Maximal ${maxHeight}px erlaubt.`,
      });
    }
  } catch (error) {
    errors.push({
      field: 'dimensions',
      message: 'Bilddimensionen konnten nicht gelesen werden.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
