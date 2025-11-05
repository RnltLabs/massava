'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from './ImageUploadButton';
import { StudioAvatar } from '@/components/ui/studio-avatar';
import type { ImageFilePreview } from '../validation/imagesSchema';

/**
 * Preview mode props (for registration flow - client-side preview only)
 */
interface LogoUploadPreviewProps {
  mode: 'preview';
  logoFile: ImageFilePreview | null;
  onSelect: (file: File) => void;
  onDelete: () => void;
  studioName: string;
  studioId?: string;
  className?: string;
}

/**
 * Upload mode props (for settings page - immediate upload)
 */
interface LogoUploadUploadProps {
  mode: 'upload';
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => void;
  isUploading: boolean;
  studioName: string;
  studioId?: string;
  className?: string;
}

type LogoUploadProps = LogoUploadPreviewProps | LogoUploadUploadProps;

/**
 * Logo upload component with dual mode support:
 * - Preview mode: Client-side preview for registration flow
 * - Upload mode: Immediate upload for settings page
 */
export function LogoUpload(props: LogoUploadProps): React.JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { studioName, studioId, className, onDelete } = props;

  // Get current logo URL based on mode
  const logoUrl =
    props.mode === 'preview'
      ? props.logoFile?.previewUrl || null
      : props.currentUrl;

  // Get isUploading state
  const isUploading = props.mode === 'upload' ? props.isUploading : false;

  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine Bilddatei (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Bild muss kleiner als 5MB sein');
      return;
    }

    // Handle based on mode
    if (props.mode === 'preview') {
      // Preview mode: Just call onSelect
      props.onSelect(file);
    } else {
      // Upload mode: Call async onUpload
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      try {
        await props.onUpload(file);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (err) {
        setError('Logo-Upload fehlgeschlagen');
        setUploadProgress(0);
      } finally {
        clearInterval(interval);
      }
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
    <div className={cn('space-y-2', className)}>
      {/* Compact Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg transition-all',
          isDragging && 'border-terracotta-600 bg-terracotta-50',
          logoUrl && 'border-solid border-gray-200',
          !logoUrl && !isDragging && 'border-gray-200'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          // Uploading State - Compact
          <div className="p-4">
            <Progress value={uploadProgress} className="h-1.5" />
            <p className="text-xs text-center text-gray-600 mt-2">
              {uploadProgress}%
            </p>
          </div>
        ) : (
          <div className="p-4 flex items-center gap-3">
            {/* Avatar Preview - Smaller */}
            <StudioAvatar
              logoUrl={logoUrl}
              studioName={studioName}
              studioId={studioId}
              size={64}
              variant="bauhaus"
            />

            {/* Action Button - Compact */}
            <div className="flex-1">
              {logoUrl ? (
                <div className="flex gap-2">
                  <ImageUploadButton
                    onFileSelect={handleFileSelect}
                    disabled={isUploading}
                    variant="upload"
                    className="flex-1"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      <span className="text-xs">Ersetzen</span>
                    </div>
                  </ImageUploadButton>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    disabled={isUploading}
                    className="px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <ImageUploadButton
                  onFileSelect={handleFileSelect}
                  disabled={isUploading}
                  variant="upload"
                  className="w-full"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="text-xs">
                      {props.mode === 'preview' ? 'Logo auswählen' : 'Logo hochladen'}
                    </span>
                  </div>
                </ImageUploadButton>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message - Compact */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}
