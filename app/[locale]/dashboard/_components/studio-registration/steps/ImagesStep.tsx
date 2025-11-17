'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { LogoUpload } from '../components/LogoUpload';
import { GalleryUpload } from '../components/GalleryUpload';
import { useToast } from '@/components/ui/use-toast';
import type { ImageFilePreview, GalleryImagePreview } from '../validation/imagesSchema';

/**
 * Images Step - Step 3
 * Client-side preview only (files uploaded after studio creation)
 */
export function ImagesStep(): React.JSX.Element {
  const { state, updateImages, goToNextStep, setErrors } = useStudioRegistration();
  const { toast } = useToast();

  const [logoFile, setLogoFile] = useState<ImageFilePreview | null>(
    state.formData.images?.logoFile || null
  );
  const [galleryFiles, setGalleryFiles] = useState<GalleryImagePreview[]>(
    state.formData.images?.galleryFiles || []
  );

  /**
   * Cleanup preview URLs on unmount
   */
  useEffect(() => {
    return () => {
      if (logoFile?.previewUrl) {
        URL.revokeObjectURL(logoFile.previewUrl);
      }
      galleryFiles.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  /**
   * Handle logo selection
   */
  const handleLogoSelect = (file: File): void => {
    // Clean up old preview URL
    if (logoFile?.previewUrl) {
      URL.revokeObjectURL(logoFile.previewUrl);
    }

    // Create new preview URL
    const previewUrl = URL.createObjectURL(file);
    const newLogoFile: ImageFilePreview = {
      file,
      previewUrl,
    };

    setLogoFile(newLogoFile);
    updateImages({ logoFile: newLogoFile, galleryFiles });

    toast({
      title: 'Logo ausgewählt',
      description: 'Dein Studio-Logo wurde ausgewählt.',
    });
  };

  /**
   * Handle logo delete
   */
  const handleLogoDelete = (): void => {
    // Clean up preview URL
    if (logoFile?.previewUrl) {
      URL.revokeObjectURL(logoFile.previewUrl);
    }

    setLogoFile(null);
    updateImages({ logoFile: null, galleryFiles });

    toast({
      title: 'Logo entfernt',
      description: 'Dein Studio-Logo wurde entfernt',
    });
  };

  /**
   * Handle gallery image selection
   */
  const handleGallerySelect = (files: File[]): void => {
    // Validate max images
    if (galleryFiles.length + files.length > 10) {
      toast({
        title: 'Zu viele Bilder',
        description: 'Maximal 10 Galerie-Bilder erlaubt',
        variant: 'destructive',
      });
      return;
    }

    // Create preview URLs for new files
    const newGalleryFiles: GalleryImagePreview[] = files.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      coverPhoto: galleryFiles.length === 0 && index === 0,
      order: galleryFiles.length + index,
    }));

    const updatedGallery = [...galleryFiles, ...newGalleryFiles];
    setGalleryFiles(updatedGallery);
    updateImages({ logoFile, galleryFiles: updatedGallery });

    toast({
      title: `${files.length} Bild${files.length > 1 ? 'er' : ''} ausgewählt`,
      description: 'Galerie aktualisiert',
    });
  };

  /**
   * Handle gallery image delete
   */
  const handleGalleryDelete = (index: number): void => {
    const fileToDelete = galleryFiles[index];

    // Clean up preview URL
    if (fileToDelete?.previewUrl) {
      URL.revokeObjectURL(fileToDelete.previewUrl);
    }

    const updatedGallery = galleryFiles.filter((_, i) => i !== index);

    // Reorder and reset cover photo
    const reorderedGallery = updatedGallery.map((img, i) => ({
      ...img,
      order: i,
      coverPhoto: i === 0,
    }));

    setGalleryFiles(reorderedGallery);
    updateImages({ logoFile, galleryFiles: reorderedGallery });

    toast({
      title: 'Bild gelöscht',
      description: 'Bild aus Galerie entfernt',
    });
  };

  /**
   * Handle gallery reorder
   */
  const handleGalleryReorder = (newOrder: GalleryImagePreview[]): void => {
    setGalleryFiles(newOrder);
    updateImages({ logoFile, galleryFiles: newOrder });
  };

  /**
   * Handle continue
   */
  const handleContinue = (): void => {
    // Images are optional, always allow to continue
    setErrors({});
    goToNextStep();
  };

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Studio-Bilder</h2>
        <p className="text-sm text-gray-600">Optional - kann später hinzugefügt werden</p>
      </div>

      {/* Compact Logo + Gallery in one card */}
      <div className="space-y-3">
        {/* Logo Section - Compact */}
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-terracotta-600" />
              <span className="text-sm font-medium">Logo</span>
              <span className="text-xs text-gray-500">(Optional)</span>
            </div>
            {logoFile && (
              <span className="text-xs text-green-600">✓ Ausgewählt</span>
            )}
          </div>
          <LogoUpload
            mode="preview"
            logoFile={logoFile}
            onSelect={handleLogoSelect}
            onDelete={handleLogoDelete}
            studioName={state.formData.basicInfo.name || 'Studio'}
            studioId={state.studioId}
          />
        </div>

        {/* Gallery Section - Compact */}
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-terracotta-600" />
              <span className="text-sm font-medium">Galerie</span>
              <span className="text-xs text-gray-500">(max. 10)</span>
            </div>
            {galleryFiles.length > 0 && (
              <span className="text-xs text-green-600">
                {galleryFiles.length} Bild{galleryFiles.length > 1 ? 'er' : ''}
              </span>
            )}
          </div>
          <GalleryUpload
            mode="preview"
            galleryFiles={galleryFiles}
            onSelect={handleGallerySelect}
            onDelete={handleGalleryDelete}
            onReorder={handleGalleryReorder}
            maxImages={10}
          />
        </div>
      </div>

      {/* Compact tip */}
      <div className="text-xs text-center text-gray-500 px-2">
        JPG, PNG oder WebP • Max. 5MB pro Bild
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={handleContinue}
          style={{ backgroundColor: '#B56550' }}
          className="w-full h-12 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Weiter
        </Button>

        <Button
          variant="ghost"
          onClick={handleContinue}
          className="w-full text-sm text-gray-600"
        >
          Überspringen
        </Button>
      </div>
    </div>
  );
}
