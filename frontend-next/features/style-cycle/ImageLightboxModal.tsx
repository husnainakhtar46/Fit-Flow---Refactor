'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LightboxItem {
  type: 'existing' | 'pending';
  src: string;
  id?: string;
  caption?: string;
  pendingIndex?: number;
  uploadedAt?: string;
}

interface ImageLightboxModalProps {
  isOpen: boolean;
  activeIndex: number | null;
  items: LightboxItem[];
  totalCount: number;
  isEditable: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: (item: LightboxItem) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  activeIndex,
  items,
  totalCount,
  isEditable,
  onClose,
  onPrev,
  onNext,
  onDelete,
}) => {
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    },
    [onClose, onPrev, onNext]
  );

  if (!isOpen || activeIndex === null || !items[activeIndex]) {
    return null;
  }

  const currentItem = items[activeIndex];

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center outline-none"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10 h-10 w-10 p-0"
        onClick={onClose}
        title="Close Lightbox (Esc)"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/80 text-sm font-medium z-10 bg-black/40 px-3 py-1 rounded-full">
        {activeIndex + 1} / {totalCount}
      </div>

      {/* Previous Button */}
      {activeIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10 h-12 w-12 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          title="Previous Image (Left Arrow)"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* Image Container */}
      <div
        className="relative flex flex-col items-center justify-center p-4 max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentItem.src}
          alt={currentItem.caption || `Image ${activeIndex + 1}`}
          className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />

        {currentItem.caption && (
          <p className="text-white/90 text-sm mt-3 font-medium text-center bg-black/60 px-4 py-1.5 rounded-full">
            {currentItem.caption}
          </p>
        )}
      </div>

      {/* Next Button */}
      {activeIndex < totalCount - 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10 h-12 w-12 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          title="Next Image (Right Arrow)"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Delete from Lightbox */}
      {isEditable && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-4 right-4 text-red-400 hover:bg-red-500/20 hover:text-red-300 z-10 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(currentItem);
          }}
          title="Delete this image"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete Image
        </Button>
      )}
    </div>
  );
};

export default ImageLightboxModal;
