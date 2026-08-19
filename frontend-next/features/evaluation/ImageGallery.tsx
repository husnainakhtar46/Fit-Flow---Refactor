'use client';

import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageSlot } from './types';

interface ImageGalleryProps {
  imageSlots: ImageSlot[];
  setImageSlots: React.Dispatch<React.SetStateAction<ImageSlot[]>>;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  imageSlots,
  setImageSlots,
}) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileSelect = (index: number, file: File | null) => {
    const updated = [...imageSlots];
    updated[index].file = file;
    setImageSlots(updated);
  };

  const handleRemove = (index: number) => {
    const updated = [...imageSlots];
    updated[index].file = null;
    setImageSlots(updated);
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
        Photo Evidence
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {imageSlots.map((slot, index) => {
          const isMandatory = index < 2;
          const previewUrl =
            typeof slot.file === 'string'
              ? slot.file
              : slot.file instanceof File
              ? URL.createObjectURL(slot.file)
              : null;

          return (
            <div
              key={index}
              className="border rounded-lg p-3 bg-white space-y-2 flex flex-col justify-between shadow-sm"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">
                  {slot.caption}
                  {isMandatory && <span className="text-red-500 ml-1">*</span>}
                </span>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Preview or Upload Dropzone */}
              <div
                onClick={() => fileInputRefs.current[index]?.click()}
                className="h-32 border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 bg-gray-50 overflow-hidden relative"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={slot.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-[11px] text-gray-500">Click to upload</span>
                  </div>
                )}

                <input
                  ref={(el) => {
                    fileInputRefs.current[index] = el;
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRefs.current[index]?.click()}
                className="w-full h-8 text-xs gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                {previewUrl ? 'Change' : 'Upload'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
