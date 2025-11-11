/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { LogoUpload } from '@/app/[locale]/dashboard/_components/studio-registration/components/LogoUpload';
import { GalleryUpload } from '@/app/[locale]/dashboard/_components/studio-registration/components/GalleryUpload';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ImageFilePreview, GalleryImagePreview } from '@/app/[locale]/dashboard/_components/studio-registration/validation/imagesSchema';

interface ImagesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  studioName: string;
  currentLogo?: string | null;
  currentGallery?: Array<{
    url: string;
    coverPhoto: boolean;
    order: number;
  }>;
}

export function ImagesPopup({
  open,
  onOpenChange,
  studioId,
  studioName,
  currentLogo,
  currentGallery = [],
}: ImagesPopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  /**
   * Handle logo upload (immediate upload)
   */
  const handleLogoUpload = async (file: File): Promise<void> => {
    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/studio/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      toast({
        title: 'Logo hochgeladen',
        description: 'Dein Studio-Logo wurde erfolgreich hochgeladen.',
      });

      router.refresh();
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Fehler',
        description: 'Logo konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  /**
   * Handle logo delete
   */
  const handleLogoDelete = async (): Promise<void> => {
    try {
      const response = await fetch('/api/studio/delete-logo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete logo');
      }

      toast({
        title: 'Logo gelöscht',
        description: 'Dein Studio-Logo wurde entfernt.',
      });

      router.refresh();
    } catch (error) {
      console.error('Logo delete error:', error);
      toast({
        title: 'Fehler',
        description: 'Logo konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle gallery upload
   */
  const handleGalleryUpload = async (files: File[]): Promise<void> => {
    setIsUploadingGallery(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/studio/upload-gallery', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload gallery images');
      }

      toast({
        title: 'Bilder hochgeladen',
        description: `${files.length} Bild${files.length > 1 ? 'er' : ''} erfolgreich hochgeladen.`,
      });

      router.refresh();
    } catch (error) {
      console.error('Gallery upload error:', error);
      toast({
        title: 'Fehler',
        description: 'Bilder konnten nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  /**
   * Handle gallery image delete
   */
  const handleGalleryDelete = async (index: number): Promise<void> => {
    try {
      const imageToDelete = currentGallery[index];
      if (!imageToDelete) return;

      const response = await fetch('/api/studio/delete-gallery-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageToDelete.url }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      toast({
        title: 'Bild gelöscht',
        description: 'Bild aus Galerie entfernt',
      });

      router.refresh();
    } catch (error) {
      console.error('Gallery delete error:', error);
      toast({
        title: 'Fehler',
        description: 'Bild konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle gallery reorder
   */
  const handleGalleryReorder = async (newOrder: Array<{
    url: string;
    coverPhoto: boolean;
    order: number;
  }>): Promise<void> => {
    try {
      const response = await fetch('/api/studio/reorder-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: newOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder images');
      }

      toast({
        title: 'Reihenfolge gespeichert',
        description: 'Galerie-Reihenfolge wurde aktualisiert.',
      });

      router.refresh();
    } catch (error) {
      console.error('Gallery reorder error:', error);
      toast({
        title: 'Fehler',
        description: 'Reihenfolge konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Bilder bearbeiten</h2>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isUploadingLogo || isUploadingGallery}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="space-y-4 pb-6">
          {/* Logo Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Logo</span>
                <span className="text-xs text-gray-500">(Optional)</span>
              </div>
              {currentLogo && (
                <span className="text-xs text-green-600">✓ Vorhanden</span>
              )}
            </div>
            <LogoUpload
              mode="upload"
              currentUrl={currentLogo || null}
              onUpload={handleLogoUpload}
              onDelete={handleLogoDelete}
              isUploading={isUploadingLogo}
              studioName={studioName}
              studioId={studioId}
            />
          </div>

          {/* Gallery Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Galerie</span>
                <span className="text-xs text-gray-500">(max. 10)</span>
              </div>
              {currentGallery.length > 0 && (
                <span className="text-xs text-green-600">
                  {currentGallery.length} Bild{currentGallery.length > 1 ? 'er' : ''}
                </span>
              )}
            </div>
            <GalleryUpload
              mode="upload"
              images={currentGallery}
              onUpload={handleGalleryUpload}
              onDelete={handleGalleryDelete}
              onReorder={handleGalleryReorder}
              isUploading={isUploadingGallery}
              maxImages={10}
            />
          </div>

          {/* Tips */}
          <div className="text-xs text-center text-gray-500 px-2">
            JPG, PNG oder WebP • Max. 5MB pro Bild
          </div>
        </div>

        <div className={cn(
          "flex gap-2 mt-6",
          isMobile ? "sticky bottom-0 bg-[#F4EDE8] py-4 border-t -mx-6 px-6" : ""
        )}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploadingLogo || isUploadingGallery}
            className="flex-1"
          >
            Schließen
          </Button>
        </div>
      </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          style={{ backgroundColor: '#F4EDE8' }}
          className="h-[80vh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Bilder bearbeiten</SheetTitle>
          </VisuallyHidden>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: '#F4EDE8' }}
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Bilder bearbeiten</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
