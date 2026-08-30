'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CommentSectionProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: any;
}

const CATEGORIES = [
  { key: 'fit', label: 'Fit Feedback' },
  { key: 'workmanship', label: 'Workmanship Feedback' },
  { key: 'wash', label: 'Wash Feedback' },
  { key: 'fabric', label: 'Fabric Feedback' },
  { key: 'accessories', label: 'Accessories Feedback' },
];

export const CommentSection: React.FC<CommentSectionProps> = ({
  register,
  setValue,
  watch,
}) => {
  const poNumber = watch('po_number');
  const customerCommentsAddressed = watch('customer_comments_addressed');

  const handleFetchStyleComments = async () => {
    if (!poNumber) {
      toast.error('Please enter a PO Number first');
      return;
    }
    try {
      const styleRes = await api.get(`/styles/by_po/?po_number=${encodeURIComponent(poNumber)}`);
      const style = styleRes.data;
      if (style && style.id) {
        const commentRes = await api.get(`/styles/${style.id}/latest_comments/`);
        const comment = commentRes.data;
        if (comment) {
          setValue('customer_fit_comments', comment.comments_fit || '');
          setValue('customer_workmanship_comments', comment.comments_workmanship || '');
          setValue('customer_wash_comments', comment.comments_wash || '');
          setValue('customer_fabric_comments', comment.comments_fabric || '');
          setValue('customer_accessories_comments', comment.comments_accessories || '');
          toast.success('Loaded comments from Style Cycle');
        } else {
          toast.info('No comments found for this style in Style Cycle');
        }
      }
    } catch {
      toast.error('Style not found in Style Cycle for this PO');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchStyleComments}
            className="bg-white gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <RefreshCw className="w-4 h-4" /> Load Previous Comments (Style Cycle)
          </Button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('customer_comments_addressed')}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
            <CheckCircle2
              className={`w-4 h-4 ${customerCommentsAddressed ? 'text-green-600' : 'text-gray-400'}`}
            />
            All Customer Points Addressed in this Submission
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Customer Previous Comments */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-amber-800 uppercase tracking-wide border-b pb-2 border-amber-200">
            Previous Customer Feedback
          </h4>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-amber-900">Customer Overall Feedback Summary</Label>
            <Textarea
              {...register('customer_remarks')}
              placeholder="Overall summary of customer instructions, major revisions, or approval conditions..."
              rows={3}
              className="text-xs bg-amber-50/70 border-amber-300 focus:border-amber-500 font-medium"
            />
          </div>
          {CATEGORIES.map(({ key, label }) => (
            <div key={`cust-${key}`} className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">{label}</Label>
              <Textarea
                {...register(`customer_${key}_comments`)}
                placeholder={`Previous customer comments on ${key}...`}
                rows={2}
                className="text-xs bg-amber-50/40 border-amber-200 focus:border-amber-400"
              />
            </div>
          ))}
        </div>

        {/* Right Column: QA Evaluation Comments */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-blue-800 uppercase tracking-wide border-b pb-2 border-blue-200">
            QA Current Evaluation
          </h4>
          {CATEGORIES.map(({ key, label }) => (
            <div key={`qa-${key}`} className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">{label}</Label>
              <Textarea
                {...register(`qa_${key}_comments`)}
                placeholder={`QA observations on ${key}...`}
                rows={2}
                className="text-xs bg-blue-50/40 border-blue-200 focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
