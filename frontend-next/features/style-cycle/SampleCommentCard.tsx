'use client';

import React from 'react';
import { Pencil, Trash2, Calendar, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentImageTiles } from './CommentImageTiles';
import { SampleComment } from './types';
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

  const commentCategories = [
    { label: 'General', text: comment.comments_general },
    { label: 'Fit', text: comment.comments_fit },
    { label: 'Workmanship', text: comment.comments_workmanship },
    { label: 'Wash', text: comment.comments_wash },
    { label: 'Fabric', text: comment.comments_fabric },
    { label: 'Accessories', text: comment.comments_accessories },
  ].filter((c) => !!c.text);

  const stageDisplay = comment.sample_number_display
    ? `${comment.sample_type || comment.sample_stage || 'Sample'} (${comment.sample_number_display})`
    : comment.sample_type || comment.sample_stage || 'Sample Stage';

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
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
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(comment.id)}
                className="h-7 w-7 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta Dates & Tracking */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {comment.sample_submission_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Submitted: {formatDate(comment.sample_submission_date)}
          </span>
        )}
        {comment.courier_tracking_number && (
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Tracking: {comment.courier_tracking_number}
          </span>
        )}
      </div>

      {/* Comment Blocks */}
      {commentCategories.length > 0 ? (
        <div className="space-y-2 pt-1">
          {commentCategories.map((c) => (
            <div key={c.label} className="text-xs">
              <span className="font-bold text-gray-700">{c.label}: </span>
              <span className="text-gray-600 whitespace-pre-wrap">{c.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No category feedback written.</p>
      )}

      {/* Attached Images */}
      <CommentImageTiles
        images={comment.images}
        onDeleteImage={onDeleteImage}
        canEdit={canEdit}
      />
    </div>
  );
};
