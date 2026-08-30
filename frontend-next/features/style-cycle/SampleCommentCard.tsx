'use client';

import React from 'react';
import { Pencil, Trash2, Calendar, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentImageTiles } from './CommentImageTiles';
import { SampleComment, COMMENT_CATEGORIES, SampleImage } from './types';
import { formatDate } from '@/utils/dateFormatter';

interface SampleCommentCardProps {
  comment: SampleComment;
  onEdit: (comment: SampleComment) => void;
  onDelete: (commentId: string) => void;
  onDeleteImage: (imageId: string) => void;
  canEdit?: boolean;
}

export const SampleCommentCard: React.FC<SampleCommentCardProps> = ({
  comment,
  onEdit,
  onDelete,
  onDeleteImage,
  canEdit = false,
}) => {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-green-100 text-green-800">APPROVED</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800">REJECTED</span>;
      case 'revised':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-800">REVISED REQUIRED</span>;
      case 'in_review':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-800">IN REVIEW</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-700">LOGGED</span>;
    }
  };

  const stageDisplay = comment.sample_number_display
    ? `${comment.sample_type || comment.sample_stage || 'Sample'} (${comment.sample_number_display})`
    : comment.sample_type || comment.sample_stage || 'Sample Stage';

  const safeImages: SampleImage[] = Array.isArray(comment.images) ? comment.images : [];

  // Group active categories that have either text feedback or attached photos
  const activeCategories = COMMENT_CATEGORIES.map((cat) => {
    const text = comment[cat.commentField] as string | undefined;
    const catImages = safeImages.filter((img) => {
      const imgCat = (img.category || '').toLowerCase();
      if (cat.key === 'general') return !imgCat || imgCat === 'general';
      return imgCat === cat.key;
    });

    return {
      config: cat,
      text: text?.trim() || '',
      images: catImages,
      hasContent: !!text?.trim() || catImages.length > 0,
    };
  }).filter((c) => c.hasContent);

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{stageDisplay}</span>
          {getStatusBadge(comment.status)}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(comment)}
                className="h-7 w-7 text-gray-500 hover:text-blue-600"
                title="Edit Stage Feedback"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(comment.id)}
                className="h-7 w-7 text-gray-500 hover:text-red-600"
                title="Delete Stage Feedback"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta Dates & Tracking */}
      {(comment.sample_submission_date || comment.courier_tracking_number) && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50/70 px-3 py-1.5 rounded-md border border-gray-100">
          {comment.sample_submission_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" /> Submitted: {formatDate(comment.sample_submission_date)}
            </span>
          )}
          {comment.courier_tracking_number && (
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-gray-400" /> Tracking: {comment.courier_tracking_number}
            </span>
          )}
        </div>
      )}

      {/* Category Feedback Blocks with Per-Category Photos */}
      {activeCategories.length > 0 ? (
        <div className="space-y-3 pt-1">
          {activeCategories.map(({ config, text, images }) => (
            <div key={config.key} className="border border-gray-100 rounded-lg p-3 bg-gray-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  {config.label}
                </span>
                {images.length > 0 && (
                  <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">
                    {images.length} {images.length === 1 ? 'photo' : 'photos'}
                  </span>
                )}
              </div>

              {text && (
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {text}
                </p>
              )}

              {images.length > 0 && (
                <CommentImageTiles
                  images={images}
                  onDeleteImage={onDeleteImage}
                  canEdit={canEdit}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic py-2">No category feedback or photos logged for this stage.</p>
      )}
    </div>
  );
};

export default SampleCommentCard;
