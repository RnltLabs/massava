/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Gallery Component
 * Displays studio images in a scrollable gallery
 */

'use client';

import React from 'react';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface GalleryImage {
  url: string;
  id?: string;
  order?: number;
  isCover?: boolean;
}

interface StudioGalleryProps {
  galleryImages: unknown;
  studioName: string;
}

/**
 * Validates and extracts gallery images from various formats
 */
const parseGalleryImages = (data: unknown): GalleryImage[] => {
  if (!data) return [];

  try {
    // If it's already an array
    if (Array.isArray(data)) {
      return data
        .filter((item) => {
          // Handle string URLs
          if (typeof item === 'string') return true;
          // Handle objects with url property
          if (typeof item === 'object' && item !== null && 'url' in item) return true;
          return false;
        })
        .map((item, index) => {
          if (typeof item === 'string') {
            return { url: item, order: index };
          }
          const obj = item as Record<string, unknown>;
          return {
            url: String(obj.url),
            id: obj.id ? String(obj.id) : undefined,
            order: typeof obj.order === 'number' ? obj.order : index,
            isCover: Boolean(obj.isCover),
          };
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    return [];
  } catch {
    return [];
  }
};

export function StudioGallery({ galleryImages, studioName }: StudioGalleryProps): React.JSX.Element {
  const images = parseGalleryImages(galleryImages);

  // No images case
  if (images.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Bilder</h3>
        <div className="w-full h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center gap-2">
          <ImageIcon className="h-5 w-5 text-gray-400" />
          <p className="text-sm text-muted-foreground">Keine Bilder vorhanden</p>
        </div>
      </div>
    );
  }

  // Single image case
  if (images.length === 1) {
    return (
      <div className="w-full">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Bilder</h3>
        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
          <Image
            src={images[0].url}
            alt={`${studioName} - Bild 1`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
          />
        </div>
      </div>
    );
  }

  // Multiple images - scrollable gallery
  return (
    <div className="w-full -mx-6 px-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Bilder ({images.length})
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {images.map((image, index) => (
          <div
            key={image.id || index}
            className="relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden border border-border"
          >
            <Image
              src={image.url}
              alt={`${studioName} - Bild ${index + 1}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              sizes="192px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
