import { z } from 'zod';

/**
 * Validation schema for individual image file
 */
export const imageFileSchema = z.object({
  url: z.string().url('Invalid image URL'),
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().max(5 * 1024 * 1024, 'Image must be smaller than 5MB'),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

/**
 * Validation schema for gallery image with metadata
 */
export const galleryImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  coverPhoto: z.boolean(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
});

/**
 * Validation schema for images step in registration
 */
export const imagesStepSchema = z.object({
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  galleryImages: z
    .array(galleryImageSchema)
    .max(10, 'Maximum 10 gallery images allowed')
    .optional()
    .nullable(),
});

/**
 * Type exports
 */
export type ImageFileData = z.infer<typeof imageFileSchema>;
export type GalleryImageData = z.infer<typeof galleryImageSchema>;
export type ImagesStepData = z.infer<typeof imagesStepSchema>;

/**
 * Client-side types for file preview (before upload)
 * These are not validated by Zod since File objects are not serializable
 */
export interface ImageFilePreview {
  file: File;
  previewUrl: string; // URL.createObjectURL result
}

export interface GalleryImagePreview {
  file: File;
  previewUrl: string;
  coverPhoto: boolean;
  order: number;
}

export interface ImagesStepPreview {
  logoFile: ImageFilePreview | null;
  galleryFiles: GalleryImagePreview[];
}
