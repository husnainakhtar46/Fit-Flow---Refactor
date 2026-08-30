'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommentCategorySection } from './CommentCategorySection';
import {
  SampleComment,
  SAMPLE_STAGES,
  COMMENT_CATEGORIES,
  CommentCategoryKey,
  SampleImage,
  getOrdinalSample,
} from './types';

interface CommentEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  styleId: string;
  comment: SampleComment | null;
  onSubmit: (data: any, pendingImagesByCategory: Record<CommentCategoryKey, File[]>) => void;
  onDeleteExistingImage?: (imageId: string) => void;
  isSubmitting: boolean;
}

const INITIAL_COMMENTS: Record<CommentCategoryKey, string> = {
  general: '',
  fit: '',
  workmanship: '',
  wash: '',
  fabric: '',
  accessories: '',
};

const INITIAL_PENDING_IMAGES: Record<CommentCategoryKey, File[]> = {
  general: [],
  fit: [],
  workmanship: [],
  wash: [],
  fabric: [],
  accessories: [],
};

export const CommentEditForm: React.FC<CommentEditFormProps> = ({
  isOpen,
  onClose,
  comment,
  onSubmit,
  onDeleteExistingImage,
  isSubmitting,
}) => {
  const [stage, setStage] = useState(SAMPLE_STAGES[0]);
  const [status, setStatus] = useState<'pending' | 'in_review' | 'approved' | 'rejected' | 'revised'>('pending');
  const [submissionDate, setSubmissionDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [commentsState, setCommentsState] = useState<Record<CommentCategoryKey, string>>(INITIAL_COMMENTS);
  const [pendingImages, setPendingImages] = useState<Record<CommentCategoryKey, File[]>>(INITIAL_PENDING_IMAGES);

  useEffect(() => {
    if (comment) {
      setStage(comment.sample_stage || comment.sample_type || SAMPLE_STAGES[0]);
      setStatus(comment.status || 'pending');
      setSubmissionDate(comment.sample_submission_date || '');
      setTrackingNumber(comment.courier_tracking_number || '');
      setCommentsState({
        general: comment.comments_general || '',
        fit: comment.comments_fit || '',
        workmanship: comment.comments_workmanship || '',
        wash: comment.comments_wash || '',
        fabric: comment.comments_fabric || '',
        accessories: comment.comments_accessories || '',
      });
    } else {
      setStage(SAMPLE_STAGES[0]);
      setStatus('pending');
      setSubmissionDate(new Date().toISOString().split('T')[0]);
      setTrackingNumber('');
      setCommentsState(INITIAL_COMMENTS);
    }
    setPendingImages(INITIAL_PENDING_IMAGES);
  }, [comment, isOpen]);

  const handleCommentChange = (key: CommentCategoryKey, val: string) => {
    setCommentsState((prev) => ({ ...prev, [key]: val }));
  };

  const handleFilesSelected = (key: CommentCategoryKey, files: File[]) => {
    setPendingImages((prev) => ({
      ...prev,
      [key]: [...prev[key], ...files],
    }));
  };

  const handleRemovePending = (key: CommentCategoryKey, index: number) => {
    setPendingImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        sample_stage: stage,
        status,
        sample_submission_date: submissionDate || null,
        courier_tracking_number: trackingNumber,
        comments_general: commentsState.general,
        comments_fit: commentsState.fit,
        comments_workmanship: commentsState.workmanship,
        comments_wash: commentsState.wash,
        comments_fabric: commentsState.fabric,
        comments_accessories: commentsState.accessories,
      },
      pendingImages
    );
  };

  const existingImages = Array.isArray(comment?.images) ? comment.images : [];

  const getExistingImagesForCategory = (key: CommentCategoryKey): SampleImage[] => {
    return existingImages.filter((img) => {
      const cat = (img.category || '').toLowerCase();
      if (key === 'general') return !cat || cat === 'general';
      return cat === key;
    });
  };

  const totalPendingCount = Object.values(pendingImages).reduce((acc, files) => acc + files.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-gray-50/50">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {comment
              ? `Edit ${comment.sample_stage || comment.sample_type || 'Sample'} (${comment.sample_number_display || getOrdinalSample(comment.sample_number)}) Feedback`
              : 'Add Sample Stage Feedback'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border p-3.5 rounded-lg shadow-sm">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Sample Stage *</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white font-medium"
                required
              >
                {SAMPLE_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Stage Status *</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white font-bold"
                required
              >
                <option value="pending">Pending Review</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revised">Revised Required</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Submission Date</Label>
              <Input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Tracking #</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Courier Tracking #"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category Feedback & Evidence Photos
              </span>
              {totalPendingCount > 0 && (
                <span className="text-xs text-green-600 font-semibold">
                  {totalPendingCount} new photo(s) ready to upload
                </span>
              )}
            </div>

            {COMMENT_CATEGORIES.map((category) => (
              <CommentCategorySection
                key={category.key}
                category={category}
                value={commentsState[category.key]}
                onChange={(val) => handleCommentChange(category.key, val)}
                existingImages={getExistingImagesForCategory(category.key)}
                pendingFiles={pendingImages[category.key]}
                onFilesSelected={(files) => handleFilesSelected(category.key, files)}
                onRemovePending={(idx) => handleRemovePending(category.key, idx)}
                onDeleteExistingImage={onDeleteExistingImage}
                disabled={isSubmitting}
              />
            ))}
          </div>

          <div className="sticky bottom-0 bg-white pt-3 pb-2 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? 'Saving Feedback...' : comment ? 'Update Feedback' : 'Save Stage Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentEditForm;
