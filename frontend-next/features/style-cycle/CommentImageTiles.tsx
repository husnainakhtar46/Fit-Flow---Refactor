'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Trash2, Maximize2 } from 'lucide-react';
import { SampleImage } from './types';

interface CommentImageTilesProps {
  images?: SampleImage[];
  onDeleteImage?: (imageId: string) => void;
  canEdit?: boolean;
}

export const CommentImageTiles: React.FC<CommentImageTilesProps> = ({
  images = [],
  onDeleteImage,
  canEdit = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<SampleImage | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        Attached Photos ({images.length})
      </h5>

      <div className="flex flex-wrap gap-2.5">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer shadow-sm hover:shadow transition-all"
            onClick={() => setSelectedImage(img)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.image}
              alt={img.caption || 'Sample Evidence'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>

            {canEdit && onDeleteImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this image?')) {
                    onDeleteImage(img.id);
                  }
                }}
                className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow"
                title="Delete Image"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-0">
            <div className="relative flex flex-col items-center justify-center p-4 min-h-[400px]">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/50"
              >
                <X className="w-6 h-6" />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.image}
                alt={selectedImage.caption || 'Full view'}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded"
              />

              {selectedImage.caption && (
                <p className="text-white/90 text-sm mt-3 font-medium text-center">
                  {selectedImage.caption}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
