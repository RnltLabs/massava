'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadButtonProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  variant?: 'camera' | 'upload';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable image upload button component
 * Handles file input and native camera/gallery picker
 */
export function ImageUploadButton({
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp',
  multiple = false,
  disabled = false,
  variant = 'upload',
  className,
  children,
}: ImageUploadButtonProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach((file) => onFileSelect(file));
      } else {
        onFileSelect(files[0]);
      }
    }
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const Icon = variant === 'camera' ? Camera : Upload;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Upload ${multiple ? 'images' : 'image'}`}
      />
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
      >
        <Icon className="h-4 w-4" />
        {children || (variant === 'camera' ? 'Take Photo' : 'Choose Image')}
      </Button>
    </>
  );
}
