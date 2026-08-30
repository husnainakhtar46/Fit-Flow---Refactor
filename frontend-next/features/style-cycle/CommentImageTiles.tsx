'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, ZoomIn, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { SampleImage } from './types';
import { ImageLightboxModal, LightboxItem } from './ImageLightboxModal';
import { compressImages, getFullImageUrl } from '@/lib/imageUtils';

export interface CommentImage {
  id: string;
  image: string;
  image_url?: string;
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
const TILE_SIZE = 'w-16 h-16 sm:w-20 sm:h-20';

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
  const [localCompressing, setLocalCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCompressing = isCompressing || localCompressing;

  const processAndForwardFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || !onFilesSelected) return;
      setLocalCompressing(true);
      try {
        const compressed = await compressImages(files);
        onFilesSelected(compressed);
      } finally {
        setLocalCompressing(false);
      }
    },
    [onFilesSelected]
  );

  // Clipboard paste handler (Ctrl+V)
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!isEditable || !onFilesSelected || activeCompressing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const rawFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = item.type.split('/')[1] || 'png';
            rawFiles.push(
              new File([file], `pasted-${Date.now()}-${i}.${ext}`, { type: file.type })
            );
          }
        }
      }
      if (rawFiles.length > 0) {
        e.preventDefault();
        await processAndForwardFiles(rawFiles);
      }
    },
    [isEditable, onFilesSelected, activeCompressing, processAndForwardFiles]
  );

  // Global paste listener when component is mounted and in edit mode
  useEffect(() => {
    if (!isEditable || !onFilesSelected) return;

    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const rawFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = item.type.split('/')[1] || 'png';
            rawFiles.push(
              new File([file], `pasted-${Date.now()}-${i}.${ext}`, { type: file.type })
            );
          }
        }
      }

      if (rawFiles.length > 0) {
        e.preventDefault();
        await processAndForwardFiles(rawFiles);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isEditable, onFilesSelected, processAndForwardFiles]);

  const safeImages = Array.isArray(images) ? images : [];
  const safePending = Array.isArray(pendingFiles) ? pendingFiles : [];

  const allItems: LightboxItem[] = [
    ...safeImages.map((img) => {
      const rawUrl = (img as any).image_url || img.image || (img as any).url || '';
      return {
        type: 'existing' as const,
        src: getFullImageUrl(rawUrl),
        id: img.id,
        caption: img.caption,
        uploadedAt: (img as any).uploaded_at || (img as any).created_at,
      };
    }),
    ...safePending.map((file, i) => ({
      type: 'pending' as const,
      src: typeof window !== 'undefined' ? URL.createObjectURL(file) : '',
      caption: file.name,
      pendingIndex: i,
    })),
  ];

  const totalCount = allItems.length;
  const visibleItems = allItems.slice(0, maxVisible);
  const overflowCount = totalCount - maxVisible;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await processAndForwardFiles(files);
      }
      e.target.value = '';
    },
    [processAndForwardFiles]
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
      if (confirm('Delete this image?')) handleDelete(item.id);
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

  if (totalCount === 0 && (!isEditable || !onFilesSelected)) return null;

  return (
    <div
      className="mt-1 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded-lg"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {visibleItems.map((item, idx) => (
          <div key={item.id || `pending-${item.pendingIndex}`} className="flex flex-col items-center gap-0.5">
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-4 h-4 text-white drop-shadow" />
              </div>

              {isEditable && (
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.type === 'existing' && item.id && handleDelete) {
                      if (confirm('Delete this image?')) handleDelete(item.id);
                    } else if (item.type === 'pending' && item.pendingIndex !== undefined && onRemovePending) {
                      onRemovePending(item.pendingIndex);
                    }
                  }}
                  title="Remove Image"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}

              {item.type === 'pending' && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-[8px] sm:text-[9px] text-center py-0.2 font-bold">
                  New
                </div>
              )}
            </div>

            {item.type === 'existing' && item.uploadedAt && (
              <span className="text-[9px] text-gray-400 leading-none">
                {formatDate(item.uploadedAt)}
              </span>
            )}
          </div>
        ))}

        {overflowCount > 0 && (
          <div
            className={`${TILE_SIZE} relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer flex-shrink-0 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm`}
            onClick={() => openLightbox(maxVisible)}
          >
            <span className="text-xs sm:text-sm font-bold text-gray-600">+{overflowCount}</span>
          </div>
        )}

        {isEditable && onFilesSelected && (
          <button
            className={`${TILE_SIZE} rounded-lg border-2 border-dashed ${
              activeCompressing ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50/50'
            } flex flex-col items-center justify-center gap-0.5 ${
              activeCompressing
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/30'
            } transition-colors flex-shrink-0`}
            onClick={() => !activeCompressing && fileInputRef.current?.click()}
            type="button"
            title="Click to browse or press Ctrl+V to paste"
            disabled={activeCompressing}
          >
            {activeCompressing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="text-[8px] sm:text-[9px] font-semibold">
              {activeCompressing ? 'Compressing...' : 'Add / Paste'}
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

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
