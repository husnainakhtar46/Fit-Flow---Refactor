'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CommentImageTiles } from './CommentImageTiles';
import { CommentCategoryConfig, SampleImage } from './types';

interface CommentCategorySectionProps {
  category: CommentCategoryConfig;
  value: string;
  onChange: (val: string) => void;
  existingImages: SampleImage[];
  pendingFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  onDeleteExistingImage?: (imageId: string) => void;
  disabled?: boolean;
}

export const CommentCategorySection: React.FC<CommentCategorySectionProps> = ({
  category,
  value,
  onChange,
  existingImages,
  pendingFiles,
  onFilesSelected,
  onRemovePending,
  onDeleteExistingImage,
  disabled = false,
}) => {
  const totalImageCount = existingImages.length + pendingFiles.length;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-2.5 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
          <span>{category.label}</span>
          {totalImageCount > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-semibold">
              {totalImageCount} {totalImageCount === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </Label>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={category.placeholder}
        rows={2}
        className="text-xs bg-white resize-y"
        disabled={disabled}
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>Attach Photos ({category.label})</span>
          <span className="text-[10px] text-gray-400">Click or paste with Ctrl+V</span>
        </div>

        <CommentImageTiles
          editable={!disabled}
          images={existingImages}
          pendingFiles={pendingFiles}
          onFilesSelected={onFilesSelected}
          onRemovePending={onRemovePending}
          onDeleteImage={onDeleteExistingImage}
        />
      </div>
    </div>
  );
};

export default CommentCategorySection;
