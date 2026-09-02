'use client';

import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageSlot } from './types';

interface ImageGalleryProps {
  imageSlots: ImageSlot[];
  setImageSlots?: (slots: ImageSlot[]) => void;
  onAddSlot?: () => void;
  onRemoveSlot?: (index: number) => void;
  onUpdateSlot?: (index: number, updates: Partial<ImageSlot>) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  imageSlots,
  setImageSlots,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileSelect = (index: number, file: File | null) => {
    if (onUpdateSlot) {
      onUpdateSlot(index, { file });
    } else if (setImageSlots) {
      const updated = [...imageSlots];
      updated[index].file = file;
      setImageSlots(updated);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (onUpdateSlot) {
      onUpdateSlot(index, { file: null });
    } else if (setImageSlots) {
      const updated = [...imageSlots];
      updated[index].file = null;
      setImageSlots(updated);
    }
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    if (onUpdateSlot) {
      onUpdateSlot(index, { caption });
    } else if (setImageSlots) {
      const updated = [...imageSlots];
      updated[index].caption = caption;
      setImageSlots(updated);
    }
  };

  const handleAddSlot = () => {
    if (onAddSlot) {
      onAddSlot();
    } else if (setImageSlots) {
      setImageSlots([...imageSlots, { file: null, caption: '', isPredefined: false }]);
    }
  };

  const handleRemoveSlot = (index: number) => {
    if (onRemoveSlot) {
      onRemoveSlot(index);
    } else if (setImageSlots) {
      setImageSlots(imageSlots.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
              Photo Evidence
            </h4>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Front &amp; Back View required
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload Front and Back views, plus any additional detail shots as needed.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSlot}
          className="gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Photo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageSlots.map((slot, index) => {
          const isMandatory = index < 2 || slot.isPredefined;
          const previewUrl =
            typeof slot.file === 'string'
              ? slot.file
              : slot.file instanceof File
              ? URL.createObjectURL(slot.file)
              : null;

          return (
            <div
              key={index}
              className={`border rounded-lg p-3 bg-white space-y-2 flex flex-col justify-between shadow-sm transition-all ${
                isMandatory ? 'border-gray-200 bg-gradient-to-b from-gray-50/50 to-white' : 'border-gray-200'
              }`}
            >
              {/* Header: Title / Caption Input */}
              <div>
                {isMandatory ? (
                  <div className="flex justify-between items-center h-8">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      {slot.caption}
                      <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      Mandatory
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 h-8">
                    <Input
                      value={slot.caption}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      placeholder="e.g. Wash Label, Neck..."
                      className="h-7 text-xs font-medium px-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      title="Remove photo slot"
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Preview or Upload Dropzone */}
              <div
                onClick={() => fileInputRefs.current[index]?.click()}
                className="h-32 border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 bg-gray-50 overflow-hidden relative group"
              >
                {previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={slot.caption || 'Evidence photo'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
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

              {/* Action Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRefs.current[index]?.click()}
                className="w-full h-7 text-xs gap-1"
              >
                <Upload className="w-3 h-3" />
                {previewUrl ? 'Change Photo' : 'Upload'}
              </Button>
            </div>
          );
        })}

        {/* Add Photo Card */}
        <button
          type="button"
          onClick={handleAddSlot}
          className="border-2 border-dashed border-gray-200 hover:border-primary/60 hover:bg-primary/5 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-primary transition-all min-h-[200px]"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">Add Photo Evidence</span>
          <span className="text-[10px] text-gray-400 text-center">
            Upload extra detail, labels, or defects
          </span>
        </button>
      </div>
    </div>
  );
};
