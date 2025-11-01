'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from './ImageUploadButton';
import { StudioAvatar } from '@/components/ui/studio-avatar';

interface LogoUploadProps {
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => void;
  isUploading: boolean;
  studioName: string;
  studioId?: string;
  className?: string;
}

/**
 * Logo upload component with preview and actions
 */
export function LogoUpload({
  currentUrl,
  onUpload,
  onDelete,
  isUploading,
  studioName,
  studioId,
  className,
}: LogoUploadProps): React.JSX.Element {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      await onUpload(file);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError('Failed to upload logo');
      setUploadProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const handleDrop = (event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-all',
          isDragging && 'border-terracotta-600 bg-terracotta-50',
          currentUrl && 'border-solid border-gray-200',
          !currentUrl && !isDragging && 'border-gray-300'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          {isUploading ? (
            // Uploading State
            <>
              <div className="w-full max-w-xs space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-gray-600">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Avatar Preview (uploaded logo or generative avatar) */}
              <StudioAvatar
                logoUrl={currentUrl}
                studioName={studioName}
                studioId={studioId}
                size={128}
                variant="bauhaus"
              />

              {/* Help Text */}
              <div className="text-center space-y-2">
                {currentUrl ? (
                  <>
                    <p className="font-medium text-gray-900">Logo uploaded</p>
                    <p className="text-sm text-gray-600">Replace or remove your logo</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">Add your logo</p>
                    <p className="text-sm text-gray-600">Take a photo or choose from gallery</p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {currentUrl ? (
                  <>
                    <ImageUploadButton
                      onFileSelect={handleFileSelect}
                      disabled={isUploading}
                      variant="upload"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                    </ImageUploadButton>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDelete}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <ImageUploadButton
                      onFileSelect={handleFileSelect}
                      disabled={isUploading}
                      variant="camera"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </ImageUploadButton>
                    <ImageUploadButton
                      onFileSelect={handleFileSelect}
                      disabled={isUploading}
                      variant="upload"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </ImageUploadButton>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Status Messages */}
      {currentUrl && !isUploading && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Logo uploaded successfully
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
