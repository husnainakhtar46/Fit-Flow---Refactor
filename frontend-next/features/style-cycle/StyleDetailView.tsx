'use client';

import React from 'react';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SampleCommentCard } from './SampleCommentCard';
import { StyleMaster, SampleComment } from './types';
import { useAuth } from '@/lib/auth';

interface StyleDetailViewProps {
  style: StyleMaster;
  comments: SampleComment[];
  isLoading: boolean;
  onBack: () => void;
  onEditStyle: (style: StyleMaster) => void;
  onDeleteStyle: (styleId: string) => void;
  onAddComment: () => void;
  onEditComment: (comment: SampleComment) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteImage: (imageId: string) => void;
}

export const StyleDetailView: React.FC<StyleDetailViewProps> = ({
  style,
  comments,
  isLoading,
  onBack,
  onEditStyle,
  onDeleteStyle,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onDeleteImage,
}) => {
  const { canEditStyleCycle, isReadOnly } = useAuth();
  const canEdit = !isReadOnly && canEditStyleCycle;

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Styles
        </Button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditStyle(style)}
                className="gap-1 text-xs"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Style
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this style and all its stage history?')) {
                    onDeleteStyle(style.id);
                  }
                }}
                className="gap-1 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Style
              </Button>
            </>
          )}
          {canEdit && (
            <Button size="sm" onClick={onAddComment} className="bg-primary gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Sample Stage
            </Button>
          )}
        </div>
      </div>

      {/* Style Overview Banner */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              {style.customer_name || 'Generic Customer'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{style.style_name}</h1>
            <p className="text-xs text-gray-500 mt-1">PO Number: {style.po_number || '-'}</p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4">
            <div className="bg-gray-50 px-3 py-2 rounded-lg border text-xs">
              <span className="text-gray-500 block">Color</span>
              <span className="font-bold text-gray-800">{style.color || '-'}</span>
            </div>
            <div className="bg-gray-50 px-3 py-2 rounded-lg border text-xs">
              <span className="text-gray-500 block">Season</span>
              <span className="font-bold text-gray-800">{style.season || '-'}</span>
            </div>
            <div className="bg-gray-50 px-3 py-2 rounded-lg border text-xs">
              <span className="text-gray-500 block">Stages Logged</span>
              <span className="font-bold text-blue-600">{comments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Sample Stage History & Feedback</h2>
          <span className="text-xs text-gray-500">Chronological feedback tracking</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading sample stages...</div>
        ) : comments.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center space-y-3">
            <p className="text-gray-500 text-sm">No sample feedback logged for this style yet.</p>
            {canEdit && (
              <Button size="sm" onClick={onAddComment} className="bg-primary gap-1">
                <Plus className="w-4 h-4" /> Add First Sample Stage
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <SampleCommentCard
                key={c.id}
                comment={c}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                onDeleteImage={onDeleteImage}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
