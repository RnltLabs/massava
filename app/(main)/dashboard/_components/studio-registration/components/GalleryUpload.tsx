'use client';

import React, { useState } from 'react';
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
import type { GalleryImagePreview } from '../validation/imagesSchema';

/**
 * Gallery image type for upload mode
 */
interface GalleryImageUrl {
  url: string;
  coverPhoto: boolean;
  order: number;
}

/**
 * Preview mode props (for registration flow - client-side preview only)
 */
interface GalleryUploadPreviewProps {
  mode: 'preview';
  galleryFiles: GalleryImagePreview[];
  onSelect: (files: File[]) => void;
  onDelete: (index: number) => void;
  onReorder: (newOrder: GalleryImagePreview[]) => void;
  maxImages: number;
  className?: string;
}

/**
 * Upload mode props (for settings page - immediate upload)
 */
interface GalleryUploadUploadProps {
  mode: 'upload';
  images: GalleryImageUrl[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (index: number) => void;
  onReorder: (newOrder: GalleryImageUrl[]) => void;
  isUploading: boolean;
  maxImages: number;
  className?: string;
}

type GalleryUploadProps = GalleryUploadPreviewProps | GalleryUploadUploadProps;

/**
 * Sortable gallery image component - Preview mode
 */
function SortableGalleryImagePreview({
  image,
  index,
  onDelete,
}: {
  image: GalleryImagePreview;
  index: number;
  onDelete: () => void;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.previewUrl,
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
        'relative group aspect-square rounded-lg overflow-hidden border border-gray-200',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <AspectRatio ratio={1}>
        <Image
          src={image.previewUrl}
          alt={`Gallery image ${index + 1}`}
          fill
          className="object-cover"
        />
      </AspectRatio>

      {image.coverPhoto && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-terracotta-600 text-white text-[10px] rounded flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5 fill-white" />
          <span>Cover</span>
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 right-1 p-0.5 bg-white/90 rounded cursor-move hover:bg-white transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 text-gray-600" />
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="absolute bottom-1 right-1 p-0.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Delete image"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * Sortable gallery image component - Upload mode
 */
function SortableGalleryImageUrl({
  image,
  index,
  onDelete,
  disabled,
}: {
  image: GalleryImageUrl;
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
        'relative group aspect-square rounded-lg overflow-hidden border border-gray-200',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <AspectRatio ratio={1}>
        <Image
          src={image.url}
          alt={`Gallery image ${index + 1}`}
          fill
          className="object-cover"
        />
      </AspectRatio>

      {image.coverPhoto && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-terracotta-600 text-white text-[10px] rounded flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5 fill-white" />
          <span>Cover</span>
        </div>
      )}

      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 p-0.5 bg-white/90 rounded cursor-move hover:bg-white transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 text-gray-600" />
        </div>
      )}

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="absolute bottom-1 right-1 p-0.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Delete image"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * Gallery upload component with drag-and-drop reordering and dual mode support:
 * - Preview mode: Client-side preview for registration flow
 * - Upload mode: Immediate upload for settings page
 */
export function GalleryUpload(props: GalleryUploadProps): React.JSX.Element {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { maxImages, className, onDelete } = props;

  // Get images array and metadata based on mode
  const images = props.mode === 'preview' ? props.galleryFiles : props.images;
  const isUploading = props.mode === 'upload' ? props.isUploading : false;

  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null);

    // Validate count
    if (images.length >= maxImages) {
      setError(`Maximal ${maxImages} Bilder erlaubt`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien auswählen');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Jedes Bild muss kleiner als 5MB sein');
      return;
    }

    // Handle based on mode
    if (props.mode === 'preview') {
      props.onSelect([file]);
    } else {
      try {
        await props.onUpload([file]);
      } catch (err) {
        setError('Bild-Upload fehlgeschlagen');
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (props.mode === 'preview') {
        const oldIndex = props.galleryFiles.findIndex((img) => img.previewUrl === active.id);
        const newIndex = props.galleryFiles.findIndex((img) => img.previewUrl === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(props.galleryFiles, oldIndex, newIndex);
          const updatedOrder = newOrder.map((img, index) => ({
            ...img,
            order: index,
            coverPhoto: index === 0,
          }));
          props.onReorder(updatedOrder);
        }
      } else {
        const oldIndex = props.images.findIndex((img) => img.url === active.id);
        const newIndex = props.images.findIndex((img) => img.url === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(props.images, oldIndex, newIndex);
          const updatedOrder = newOrder.map((img, index) => ({
            ...img,
            order: index,
            coverPhoto: index === 0,
          }));
          props.onReorder(updatedOrder);
        }
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

  // Get sortable items based on mode
  const sortableItems =
    props.mode === 'preview'
      ? props.galleryFiles.map((img) => img.previewUrl)
      : props.images.map((img) => img.url);

  return (
    <div className={cn('space-y-2', className)}>
      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-2">
              {props.mode === 'preview'
                ? props.galleryFiles.map((image, index) => (
                    <SortableGalleryImagePreview
                      key={image.previewUrl}
                      image={image}
                      index={index}
                      onDelete={() => handleDeleteClick(index)}
                    />
                  ))
                : props.images.map((image, index) => (
                    <SortableGalleryImageUrl
                      key={image.url}
                      image={image}
                      index={index}
                      onDelete={() => handleDeleteClick(index)}
                      disabled={isUploading}
                    />
                  ))}

              {canAddMore && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center hover:border-terracotta-600 hover:bg-terracotta-50 transition-all">
                  <ImageUploadButton
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    disabled={isUploading}
                    variant="upload"
                    className="border-0 shadow-none h-auto p-0"
                  >
                    <Plus className="h-5 w-5 text-gray-500" />
                  </ImageUploadButton>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
          <ImageUploadButton
            onFileSelect={handleFileSelect}
            multiple={false}
            disabled={isUploading}
            variant="upload"
            className="w-full"
          >
            <div className="flex items-center justify-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="text-xs">Bilder hinzufügen</span>
            </div>
          </ImageUploadButton>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bild löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Bild wird dauerhaft aus deiner Galerie entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
