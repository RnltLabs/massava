'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, X, GripVertical, Star, AlertCircle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from './ImageUploadButton';
import Image from 'next/image';

interface GalleryImage {
  url: string;
  coverPhoto: boolean;
  order: number;
}

interface GalleryUploadProps {
  images: GalleryImage[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (index: number) => void;
  onReorder: (newOrder: GalleryImage[]) => void;
  isUploading: boolean;
  maxImages: number;
  className?: string;
}

/**
 * Sortable gallery image component
 */
function SortableGalleryImage({
  image,
  index,
  onDelete,
  disabled,
}: {
  image: GalleryImage;
  index: number;
  onDelete: () => void;
  disabled: boolean;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.url,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Image */}
      <AspectRatio ratio={1}>
        <Image
          src={image.url}
          alt={`Gallery image ${index + 1}`}
          fill
          className="object-cover"
        />
      </AspectRatio>

      {/* Cover Photo Badge */}
      {image.coverPhoto && (
        <Badge className="absolute top-2 left-2 bg-terracotta-600 text-white gap-1">
          <Star className="h-3 w-3 fill-white" />
          Cover
        </Badge>
      )}

      {/* Drag Handle */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1 bg-white/90 rounded cursor-move hover:bg-white transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
      )}

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="absolute bottom-2 right-2 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Delete image"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Gallery upload component with drag-and-drop reordering
 */
export function GalleryUpload({
  images,
  onUpload,
  onDelete,
  onReorder,
  isUploading,
  maxImages,
  className,
}: GalleryUploadProps): React.JSX.Element {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null);

    // Validate count
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select image files only');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Each image must be smaller than 5MB');
      return;
    }

    try {
      await onUpload([file]);
    } catch (err) {
      setError('Failed to upload image');
    }
  };

  const handleMultipleFiles = async (files: File[]): Promise<void> => {
    setError(null);

    // Validate count
    if (images.length + files.length > maxImages) {
      setError(`You can only upload ${maxImages} images total`);
      return;
    }

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length !== files.length) {
      setError('Some files skipped: Only images under 5MB are allowed');
    }

    if (validFiles.length > 0) {
      try {
        await onUpload(validFiles);
      } catch (err) {
        setError('Failed to upload images');
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.url === active.id);
      const newIndex = images.findIndex((img) => img.url === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(images, oldIndex, newIndex);
        // Update order and cover photo
        const updatedOrder = newOrder.map((img, index) => ({
          ...img,
          order: index,
          coverPhoto: index === 0,
        }));
        onReorder(updatedOrder);
      }
    }
  };

  const handleDeleteClick = (index: number): void => {
    setDeleteIndex(index);
  };

  const handleDeleteConfirm = (): void => {
    if (deleteIndex !== null) {
      onDelete(deleteIndex);
      setDeleteIndex(null);
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Gallery Grid */}
      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((img) => img.url)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3">
              {images.map((image, index) => (
                <SortableGalleryImage
                  key={image.url}
                  image={image}
                  index={index}
                  onDelete={() => handleDeleteClick(index)}
                  disabled={isUploading}
                />
              ))}

              {/* Add More Button */}
              {canAddMore && (
                <Card className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-terracotta-600 hover:bg-terracotta-50 transition-all">
                  <AspectRatio ratio={1}>
                    <div className="flex flex-col items-center justify-center h-full gap-2 p-2">
                      <ImageUploadButton
                        onFileSelect={handleFileSelect}
                        multiple={false}
                        disabled={isUploading}
                        variant="upload"
                        className="border-0 shadow-none"
                      >
                        <Plus className="h-5 w-5" />
                      </ImageUploadButton>
                      <span className="text-xs text-gray-600 text-center">
                        {images.length}/{maxImages}
                      </span>
                    </div>
                  </AspectRatio>
                </Card>
              )}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        // Empty State
        <Card className="border-2 border-dashed border-gray-300">
          <div className="p-8 flex flex-col items-center justify-center gap-4">
            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
              <Plus className="h-10 w-10 text-gray-400" />
            </div>

            <div className="text-center space-y-2">
              <p className="font-medium text-gray-900">Add gallery photos</p>
              <p className="text-sm text-gray-600">
                Tap to add up to {maxImages} photos
              </p>
            </div>

            <ImageUploadButton
              onFileSelect={handleFileSelect}
              multiple={false}
              disabled={isUploading}
              variant="upload"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Photos
            </ImageUploadButton>
          </div>
        </Card>
      )}

      {/* Tips */}
      {images.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Star className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Tip:</strong> The first photo will appear in search results. Drag to reorder.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image from your
              gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
