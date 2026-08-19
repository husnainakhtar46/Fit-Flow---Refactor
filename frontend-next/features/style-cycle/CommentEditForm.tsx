'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CommentImageTiles } from './CommentImageTiles';
import { SampleComment, SAMPLE_STAGES } from './types';

interface CommentEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  styleId: string;
  comment: SampleComment | null;
  onSubmit: (data: any, newImages: File[]) => void;
  isSubmitting: boolean;
}

export const CommentEditForm: React.FC<CommentEditFormProps> = ({
  isOpen,
  onClose,
  comment,
  onSubmit,
  isSubmitting,
}) => {
  const [stage, setStage] = useState('Proto');
  const [status, setStatus] = useState<'pending' | 'in_review' | 'approved' | 'rejected' | 'revised'>('pending');
  const [submissionDate, setSubmissionDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [commentsFit, setCommentsFit] = useState('');
  const [commentsWorkmanship, setCommentsWorkmanship] = useState('');
  const [commentsWash, setCommentsWash] = useState('');
  const [commentsFabric, setCommentsFabric] = useState('');
  const [commentsAccessories, setCommentsAccessories] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    if (comment) {
      setStage(comment.sample_stage || 'Proto');
      setStatus(comment.status || 'pending');
      setSubmissionDate(comment.sample_submission_date || '');
      setTrackingNumber(comment.courier_tracking_number || '');
      setCommentsFit(comment.comments_fit || '');
      setCommentsWorkmanship(comment.comments_workmanship || '');
      setCommentsWash(comment.comments_wash || '');
      setCommentsFabric(comment.comments_fabric || '');
      setCommentsAccessories(comment.comments_accessories || '');
    } else {
      setStage('Proto');
      setStatus('pending');
      setSubmissionDate(new Date().toISOString().split('T')[0]);
      setTrackingNumber('');
      setCommentsFit('');
      setCommentsWorkmanship('');
      setCommentsWash('');
      setCommentsFabric('');
      setCommentsAccessories('');
    }
    setNewImages([]);
  }, [comment, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        sample_stage: stage,
        status,
        sample_submission_date: submissionDate || null,
        courier_tracking_number: trackingNumber,
        comments_fit: commentsFit,
        comments_workmanship: commentsWorkmanship,
        comments_wash: commentsWash,
        comments_fabric: commentsFabric,
        comments_accessories: commentsAccessories,
      },
      newImages
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {comment ? `Edit ${comment.sample_stage} Feedback` : 'Add Sample Stage Feedback'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sample Stage *</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white font-medium"
                required
              >
                {SAMPLE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Stage Status *</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white font-bold"
                required
              >
                <option value="pending">Pending Review</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revised">Revised Required</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Submission Date</Label>
              <Input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Courier / Tracking #</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="DHL / FedEx #12345"
              />
            </div>
          </div>

          <hr />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Fit Comments</Label>
              <Textarea
                value={commentsFit}
                onChange={(e) => setCommentsFit(e.target.value)}
                placeholder="Fit remarks..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Workmanship Comments</Label>
              <Textarea
                value={commentsWorkmanship}
                onChange={(e) => setCommentsWorkmanship(e.target.value)}
                placeholder="Stitching, construction, seam quality..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Wash Comments</Label>
              <Textarea
                value={commentsWash}
                onChange={(e) => setCommentsWash(e.target.value)}
                placeholder="Wash shade, effect, handfeel..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Fabric Comments</Label>
              <Textarea
                value={commentsFabric}
                onChange={(e) => setCommentsFabric(e.target.value)}
                placeholder="Fabric weight, color matching, texture..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Accessories Comments</Label>
              <Textarea
                value={commentsAccessories}
                onChange={(e) => setCommentsAccessories(e.target.value)}
                placeholder="Labels, tags, buttons, zippers..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <hr />

          {/* Photo Attachments */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700">Attach Photos (Click to browse or press Ctrl+V to paste)</Label>
            <CommentImageTiles
              editable={true}
              pendingFiles={newImages}
              onFilesSelected={(files) => setNewImages((prev) => [...prev, ...files])}
              onRemovePending={(idx) => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
            />
            {newImages.length > 0 && (
              <p className="text-xs text-green-600 font-medium">
                {newImages.length} new image(s) attached and ready to upload
              </p>
            )}
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? 'Saving...' : comment ? 'Update Feedback' : 'Add Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
