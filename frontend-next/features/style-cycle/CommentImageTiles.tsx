'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, ZoomIn, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { SampleImage } from './types';
import { ImageLightboxModal, LightboxItem } from './ImageLightboxModal';

export interface CommentImage {
  id: string;
  image: string;
  caption?: string;
  category?: string;
  uploaded_at?: string;
}

interface CommentImageTilesProps {
  images?: SampleImage[] | CommentImage[];
  pendingFiles?: File[];
  onFilesSelected?: (files: File[]) => void;
  onRemovePending?: (index: number) => void;
  onDeleteImage?: (imageId: string) => void;
  onRemoveExisting?: (imageId: string) => void;
  canEdit?: boolean;
  editable?: boolean;
  maxVisible?: number;
  isCompressing?: boolean;
}

const MAX_VISIBLE_DEFAULT = 4;
const TILE_SIZE = 'w-20 h-20';

export const CommentImageTiles: React.FC<CommentImageTilesProps> = ({
  images = [],
  pendingFiles = [],
  onFilesSelected,
  onRemovePending,
  onDeleteImage,
  onRemoveExisting,
  canEdit,
  editable,
  maxVisible = MAX_VISIBLE_DEFAULT,
  isCompressing = false,
}) => {
  const isEditable = canEdit ?? editable ?? false;
  const handleDelete = onRemoveExisting || onDeleteImage;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste handler (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!isEditable || !onFilesSelected) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = item.type.split('/')[1] || 'png';
            const named = new File([file], `pasted-image-${Date.now()}-${i}.${ext}`, {
              type: file.type,
            });
            imageFiles.push(named);
          }
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        onFilesSelected(imageFiles);
      }
    },
    [isEditable, onFilesSelected]
  );

  // Global paste listener when component is mounted and in edit mode
  useEffect(() => {
    if (!isEditable || !onFilesSelected) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = item.type.split('/')[1] || 'png';
            const named = new File([file], `pasted-image-${Date.now()}-${i}.${ext}`, {
              type: file.type,
            });
            imageFiles.push(named);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        onFilesSelected(imageFiles);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isEditable, onFilesSelected]);

  // Merge existing images + pending previews into one display list
  const allItems: LightboxItem[] = [
    ...images.map((img) => ({
      type: 'existing' as const,
      src: img.image,
      id: img.id,
      caption: img.caption,
      uploadedAt: (img as any).uploaded_at || (img as any).created_at,
    })),
    ...pendingFiles.map((file, i) => ({
      type: 'pending' as const,
      src: URL.createObjectURL(file),
      caption: file.name,
      pendingIndex: i,
    })),
  ];

  const totalCount = allItems.length;
  const visibleItems = allItems.slice(0, maxVisible);
  const overflowCount = totalCount - maxVisible;

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0 && onFilesSelected) {
        onFilesSelected(files);
      }
      e.target.value = '';
    },
    [onFilesSelected]
  );

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const lightboxPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const lightboxNext = () => {
    if (lightboxIndex !== null && lightboxIndex < totalCount - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handleLightboxDelete = (item: LightboxItem) => {
    if (item.type === 'existing' && item.id && handleDelete) {
      if (confirm('Delete this image?')) {
        handleDelete(item.id);
      }
    } else if (item.type === 'pending' && item.pendingIndex !== undefined && onRemovePending) {
      onRemovePending(item.pendingIndex);
    }

    if (lightboxIndex !== null) {
      if (lightboxIndex >= totalCount - 1 && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      } else if (totalCount <= 1) {
        closeLightbox();
      }
    }
  };

  if (totalCount === 0 && !isEditable) return null;

  return (
    <div
      className="mt-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 rounded-lg"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Thumbnail tiles */}
        {visibleItems.map((item, idx) => (
          <div
            key={item.id || `pending-${item.pendingIndex}`}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className={`${TILE_SIZE} relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer group flex-shrink-0 transition-shadow hover:shadow-md bg-gray-100`}
              onClick={() => openLightbox(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.caption || `Attachment ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />

              {/* Hover overlay with zoom icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-5 h-5 text-white drop-shadow" />
              </div>

              {/* Remove button (edit mode only) */}
              {isEditable && (
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.type === 'existing' && item.id && handleDelete) {
                      if (confirm('Delete this image?')) {
                        handleDelete(item.id);
                      }
                    } else if (item.type === 'pending' && item.pendingIndex !== undefined && onRemovePending) {
                      onRemovePending(item.pendingIndex);
                    }
                  }}
                  title="Remove Image"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}

              {/* Pending indicator */}
              {item.type === 'pending' && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-[9px] text-center py-0.5 font-bold">
                  New
                </div>
              )}
            </div>

            {/* Upload date for existing images */}
            {item.type === 'existing' && item.uploadedAt && (
              <span className="text-[9px] text-gray-400 leading-none">
                {formatDate(item.uploadedAt)}
              </span>
            )}
          </div>
        ))}

        {/* "+N more" tile */}
        {overflowCount > 0 && (
          <div
            className={`${TILE_SIZE} relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer flex-shrink-0 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm`}
            onClick={() => openLightbox(maxVisible)}
          >
            <span className="text-sm font-bold text-gray-600">+{overflowCount}</span>
          </div>
        )}

        {/* Upload / Paste button (edit mode only) */}
        {isEditable && onFilesSelected && (
          <button
            className={`${TILE_SIZE} rounded-lg border-2 border-dashed ${
              isCompressing ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50/50'
            } flex flex-col items-center justify-center gap-0.5 ${
              isCompressing
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/30'
            } transition-colors flex-shrink-0`}
            onClick={() => !isCompressing && fileInputRef.current?.click()}
            type="button"
            title={
              isCompressing
                ? 'Compressing images...'
                : 'Click to browse files, or press Ctrl+V to paste from clipboard'
            }
            disabled={isCompressing}
          >
            {isCompressing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            <span className="text-[9px] font-semibold">
              {isCompressing ? 'Compressing...' : 'Add / Paste'}
            </span>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Fullscreen Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxIndex !== null}
        activeIndex={lightboxIndex}
        items={allItems}
        totalCount={totalCount}
        isEditable={isEditable}
        onClose={closeLightbox}
        onPrev={lightboxPrev}
        onNext={lightboxNext}
        onDelete={handleLightboxDelete}
      />
    </div>
  );
};

export default CommentImageTiles;
