'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SampleCommentCard } from './SampleCommentCard';
import { StyleLinksCard } from './StyleLinksCard';
import { StyleMaster, SampleComment, INITIAL_STYLE_STATE } from './types';
import { useAuth } from '@/lib/auth';

interface StyleDetailViewProps {
  style: StyleMaster;
  comments: SampleComment[];
  isLoading: boolean;
  onBack: () => void;
  onEditStyle: (data: any) => void;
  onDeleteStyle: (styleId: string) => void;
  onAddComment: () => void;
  onEditComment: (comment: SampleComment) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onAddLink: (data: { label: string; url: string }) => void;
  onDeleteLink: (linkId: string) => void;
  isAddingLink?: boolean;
  customers: Array<{ id: string; name: string }>;
  factories?: Array<{ id: string; name: string }>;
  isSubmittingStyle?: boolean;
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
  onAddLink,
  onDeleteLink,
  isAddingLink = false,
  customers,
  factories = [],
  isSubmittingStyle = false,
}) => {
  const { canEditStyleCycle, isReadOnly } = useAuth();
  const canEdit = !isReadOnly && canEditStyleCycle;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STYLE_STATE);
  const safeComments: SampleComment[] = Array.isArray(comments)
    ? comments
    : Array.isArray(style?.comments) ? style.comments : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeFactories = Array.isArray(factories) ? factories : [];

  useEffect(() => {
    if (isEditing) {
      setFormData({
        po_number: style.po_number || '',
        style_name: style.style_name || '',
        color: style.color || '',
        customer: style.customer || '',
        factory: style.factory || '',
        season: style.season || '',
      });
    }
  }, [isEditing, style]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onEditStyle({
      ...formData,
      customer: formData.customer || null,
      factory: formData.factory || null,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Styles
        </Button>

        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
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
          {canEdit && !isEditing && (
            <Button size="sm" onClick={onAddComment} className="bg-primary gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Sample Stage
            </Button>
          )}
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="gap-1 text-xs text-gray-500"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Style Overview Banner */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Edit Style Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">PO Number *</Label>
                <Input
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  placeholder="PO-12345"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Style Name *</Label>
                <Input
                  value={formData.style_name}
                  onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
                  placeholder="Style Name / No."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g. Navy Blue"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Season</Label>
                <Input
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  placeholder="e.g. SS25 / AW24"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Customer</Label>
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                >
                  <option value="">Select Customer</option>
                  {safeCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Manufacturing Factory</Label>
                <select
                  value={formData.factory}
                  onChange={(e) => setFormData({ ...formData, factory: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                >
                  <option value="">Select Factory (Optional)</option>
                  {safeFactories.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSubmittingStyle}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingStyle}
                className="bg-primary text-white gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmittingStyle ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                  {style.customer_name || 'Generic Customer'}
                </span>
                {style.factory_name && (
                  <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-200 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {style.factory_name}
                  </span>
                )}
              </div>
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
                <span className="text-gray-500 block">Factory</span>
                <span className="font-bold text-gray-800">{style.factory_name || '-'}</span>
              </div>
              <div className="bg-gray-50 px-3 py-2 rounded-lg border text-xs">
                <span className="text-gray-500 block">Stages Logged</span>
                <span className="font-bold text-blue-600">{safeComments.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {/* Left Column: Sample Stage History & Feedback (Reduced Width) */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Sample Stage History & Feedback</h2>
            <span className="text-xs text-gray-500">Chronological feedback tracking</span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading sample stages...</div>
          ) : safeComments.length === 0 ? (
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
              {safeComments.map((c) => (
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

        {/* Right Column: Style Links & Resources */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-4 sticky top-6">
          <StyleLinksCard
            links={style.links || []}
            onAddLink={onAddLink}
            onDeleteLink={onDeleteLink}
            isAdding={isAddingLink}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default StyleDetailView;
