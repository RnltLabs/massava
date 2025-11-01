'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Info, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { LogoUpload } from '../components/LogoUpload';
import { GalleryUpload } from '../components/GalleryUpload';
import { uploadStudioLogo, uploadGalleryImage } from '@/app/actions/studio/imageActions';
import { useToast } from '@/components/ui/use-toast';
import type { GalleryImage } from '@/app/actions/studio/imageActions';

/**
 * Images Step - Step 3
 * Optional logo and gallery images upload
 */
export function ImagesStep(): React.JSX.Element {
  const { state, updateImages, goToNextStep, setErrors } = useStudioRegistration();
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    state.formData.images?.logoUrl || null
  );
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(
    (state.formData.images?.galleryImages as GalleryImage[]) || []
  );

  /**
   * Handle logo upload
   */
  const handleLogoUpload = async (file: File): Promise<void> => {
    if (!state.studioId) {
      toast({
        title: 'Studio not created yet',
        description: 'Please complete previous steps first',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const result = await uploadStudioLogo(formData, state.studioId);

      if (result.success && result.url) {
        setLogoUrl(result.url);
        updateImages({ logoUrl: result.url, galleryImages });

        toast({
          title: 'Logo uploaded',
          description: 'Your studio logo has been added successfully.',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Failed to upload logo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle logo delete
   */
  const handleLogoDelete = (): void => {
    setLogoUrl(null);
    updateImages({ logoUrl: null, galleryImages });

    toast({
      title: 'Logo removed',
      description: 'Your studio logo has been removed',
    });
  };

  /**
   * Handle gallery image upload
   */
  const handleGalleryUpload = async (files: File[]): Promise<void> => {
    if (!state.studioId) {
      toast({
        title: 'Studio not created yet',
        description: 'Please complete previous steps first',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const result = await uploadGalleryImage(formData, state.studioId);

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          toast({
            title: 'Upload failed',
            description: result.error || 'Failed to upload image',
            variant: 'destructive',
          });
        }
      }

      if (uploadedUrls.length > 0) {
        // Add new images to gallery
        const newImages: GalleryImage[] = uploadedUrls.map((url, index) => ({
          url,
          coverPhoto: galleryImages.length === 0 && index === 0,
          order: galleryImages.length + index,
        }));

        const updatedGallery = [...galleryImages, ...newImages];
        setGalleryImages(updatedGallery);
        updateImages({ logoUrl, galleryImages: updatedGallery });

        toast({
          title: `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} added`,
          description: 'Gallery updated successfully',
        });
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle gallery image delete
   */
  const handleGalleryDelete = (index: number): void => {
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    // Reorder and reset cover photo
    const reorderedGallery = updatedGallery.map((img, i) => ({
      ...img,
      order: i,
      coverPhoto: i === 0,
    }));

    setGalleryImages(reorderedGallery);
    updateImages({ logoUrl, galleryImages: reorderedGallery });

    toast({
      title: 'Image deleted',
      description: 'Image removed from gallery',
    });
  };

  /**
   * Handle gallery reorder
   */
  const handleGalleryReorder = (newOrder: GalleryImage[]): void => {
    setGalleryImages(newOrder);
    updateImages({ logoUrl, galleryImages: newOrder });
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">
          <span>📷</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Add Your Studio Photos</h2>
        <p className="text-sm text-gray-600">
          Help customers see your space (Optional - you can add later)
        </p>
      </div>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-terracotta-600" />
            Studio Logo
            <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </CardTitle>
          <CardDescription>A square logo helps customers recognize your studio</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload
            currentUrl={logoUrl}
            onUpload={handleLogoUpload}
            onDelete={handleLogoDelete}
            isUploading={isUploading}
            studioName={state.formData.basicInfo.name || 'Studio'}
            studioId={state.studioId}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Gallery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-terracotta-600" />
            Gallery Photos
            <span className="text-sm font-normal text-gray-500">(Optional - up to 10)</span>
          </CardTitle>
          <CardDescription>
            Show your massage rooms, waiting area, and atmosphere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryUpload
            images={galleryImages}
            onUpload={handleGalleryUpload}
            onDelete={handleGalleryDelete}
            onReorder={handleGalleryReorder}
            isUploading={isUploading}
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="text-sm space-y-1">
            <p className="font-semibold text-gray-900">Image Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Logo: Square format, minimum 200x200 pixels</li>
              <li>Gallery: Any size, horizontal recommended</li>
              <li>Max 5MB per image</li>
              <li>Formats: JPG, PNG, WebP</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={handleContinue}
          disabled={isUploading}
          size="lg"
          style={{ backgroundColor: '#B56550' }}
          className="w-full text-white hover:opacity-90 transition-all"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button variant="ghost" onClick={handleContinue} className="w-full text-gray-600">
          Skip - Add Images Later
        </Button>
      </div>
    </motion.div>
  );
}
