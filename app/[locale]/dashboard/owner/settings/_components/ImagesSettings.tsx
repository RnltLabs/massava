/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Images Settings Component
 * Allows studio owners to manage their logo and gallery images
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { LogoUpload } from '@/app/(main)/dashboard/_components/studio-registration/components/LogoUpload';
import { GalleryUpload } from '@/app/(main)/dashboard/_components/studio-registration/components/GalleryUpload';
import { uploadStudioLogo, uploadGalleryImage, deleteGalleryImage, reorderGalleryImages } from '@/app/actions/studio/imageActions';
import { Info, Check } from 'lucide-react';

interface GalleryImage {
  url: string;
  coverPhoto: boolean;
  order: number;
}

interface ImagesSettingsProps {
  studioId: string;
  initialLogoUrl?: string | null;
  initialGalleryImages?: GalleryImage[];
}

export function ImagesSettings({
  studioId,
  initialLogoUrl,
  initialGalleryImages = []
}: ImagesSettingsProps): React.JSX.Element {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialLogoUrl || undefined);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialGalleryImages);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleLogoUpload = async (file: File): Promise<void> => {
    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadStudioLogo(formData, studioId);

      if (result.success && result.url) {
        setLogoUrl(result.url);
        setShowSuccess(true);
        toast({
          title: 'Logo hochgeladen!',
          description: 'Dein Studio-Logo wurde erfolgreich aktualisiert.',
        });

        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        toast({
          title: 'Upload fehlgeschlagen',
          description: result.error || 'Logo konnte nicht hochgeladen werden',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoDelete = (): void => {
    setLogoUrl(undefined);
    toast({
      title: 'Logo entfernt',
      description: 'Das Logo wurde erfolgreich entfernt.',
    });
  };

  const handleGalleryUpload = async (files: File[]): Promise<void> => {
    setIsUploadingGallery(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return uploadGalleryImage(formData, studioId);
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(r => r.success && r.url);

      if (successfulUploads.length > 0) {
        const newImages: GalleryImage[] = successfulUploads.map((result, index) => ({
          url: result.url!,
          coverPhoto: galleryImages.length === 0 && index === 0, // First image becomes cover if gallery is empty
          order: galleryImages.length + index,
        }));

        const updatedGallery = [...galleryImages, ...newImages];
        setGalleryImages(updatedGallery);

        // Save to database
        await reorderGalleryImages(updatedGallery, studioId);

        setShowSuccess(true);
        toast({
          title: 'Bilder hochgeladen!',
          description: `${successfulUploads.length} ${successfulUploads.length === 1 ? 'Bild wurde' : 'Bilder wurden'} erfolgreich hochgeladen.`,
        });

        setTimeout(() => setShowSuccess(false), 3000);
      }

      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        toast({
          title: 'Teilweise fehlgeschlagen',
          description: `${failedUploads.length} ${failedUploads.length === 1 ? 'Bild konnte' : 'Bilder konnten'} nicht hochgeladen werden.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleGalleryDelete = (index: number): void => {
    const imageUrl = galleryImages[index]?.url;
    if (!imageUrl) return;

    // Optimistically update UI
    const updatedGallery = galleryImages.filter((_, i) => i !== index);

    // Recalculate order and cover photo
    const reorderedGallery = updatedGallery.map((img, i) => ({
      ...img,
      order: i,
      coverPhoto: i === 0, // First image is always cover
    }));

    setGalleryImages(reorderedGallery);

    // Delete from database asynchronously
    deleteGalleryImage(imageUrl, studioId)
      .then((result) => {
        if (result.success) {
          // Save reordered gallery if not empty
          if (reorderedGallery.length > 0) {
            return reorderGalleryImages(reorderedGallery, studioId);
          }
        } else {
          // Revert on error
          setGalleryImages(galleryImages);
          toast({
            title: 'Löschen fehlgeschlagen',
            description: result.error || 'Bild konnte nicht gelöscht werden',
            variant: 'destructive',
          });
        }
        return Promise.resolve({ success: true });
      })
      .then(() => {
        toast({
          title: 'Bild gelöscht',
          description: 'Das Bild wurde erfolgreich entfernt.',
        });
      })
      .catch(() => {
        // Revert on error
        setGalleryImages(galleryImages);
        toast({
          title: 'Fehler',
          description: 'Ein unerwarteter Fehler ist aufgetreten',
          variant: 'destructive',
        });
      });
  };

  const handleGalleryReorder = (reorderedImages: GalleryImage[]): void => {
    // Recalculate order and cover photo
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      order: index,
      coverPhoto: index === 0, // First image is always cover
    }));

    setGalleryImages(updatedImages);

    // Save to database asynchronously
    reorderGalleryImages(updatedImages, studioId)
      .then((result) => {
        if (result.success) {
          toast({
            title: 'Reihenfolge gespeichert',
            description: 'Die Bilder wurden neu sortiert.',
          });
        }
      })
      .catch(() => {
        toast({
          title: 'Fehler',
          description: 'Sortierung konnte nicht gespeichert werden',
          variant: 'destructive',
        });
      });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <span className="text-2xl">📸</span>
          </div>
          <div>
            <CardTitle>Studio-Bilder</CardTitle>
            <CardDescription>
              Zeige deinen Kunden dein Studio mit Logo und Fotos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-1">Logo</h3>
            <p className="text-sm text-muted-foreground">
              Dein Studio-Logo erscheint in Suchergebnissen und auf deinem Profil
            </p>
          </div>

          <LogoUpload
            currentUrl={logoUrl || null}
            onUpload={handleLogoUpload}
            onDelete={handleLogoDelete}
            isUploading={isUploadingLogo}
          />
        </div>

        {/* Gallery Section */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="text-base font-medium mb-1">Galerie-Bilder</h3>
            <p className="text-sm text-muted-foreground">
              Zeige bis zu 10 Fotos von deinem Studio (erstes Bild wird als Titelbild verwendet)
            </p>
          </div>

          <GalleryUpload
            images={galleryImages}
            onUpload={handleGalleryUpload}
            onDelete={handleGalleryDelete}
            onReorder={handleGalleryReorder}
            isUploading={isUploadingGallery}
            maxImages={10}
          />
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-gray-700">
            <strong>Tipp:</strong> Hochwertige Bilder erhöhen die Buchungsrate um bis zu 40%.
            Zeige deine Räume, Behandlungen und Atmosphäre.
          </AlertDescription>
        </Alert>

        {/* Success Message */}
        {showSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">
              Änderungen erfolgreich gespeichert!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
