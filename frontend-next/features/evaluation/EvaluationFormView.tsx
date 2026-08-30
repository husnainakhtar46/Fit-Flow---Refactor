'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues, Control } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MeasurementTable } from './MeasurementTable';
import { CommentSection } from './CommentSection';
import { FabricAccessories } from './FabricAccessories';
import { ImageGallery } from './ImageGallery';
import { ImageSlot, AccessoryItem } from './types';
import { useStyleLookup } from '@/hooks/useStyleLookup';
import { InlineSuggestionDropdown } from '@/components/shared/InlineSuggestionDropdown';
import { Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface EvaluationFormViewProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  watch: any;
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  replace: (data: any[]) => void;
  sampleCount: number;
  setSampleCount: (count: number) => void;
  accessories: AccessoryItem[];
  setAccessories: React.Dispatch<React.SetStateAction<AccessoryItem[]>>;
  imageSlots: ImageSlot[];
  setImageSlots: React.Dispatch<React.SetStateAction<ImageSlot[]>>;
  factories: any[];
  customers: any[];
  templates: any[];
  draftsManager: any;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const EvaluationFormView: React.FC<EvaluationFormViewProps> = ({
  isOpen,
  onClose,
  editingId,
  register,
  setValue,
  getValues,
  watch,
  fields,
  append,
  remove,
  replace,
  sampleCount,
  setSampleCount,
  accessories,
  setAccessories,
  imageSlots,
  setImageSlots,
  factories,
  customers,
  templates,
  draftsManager,
  isSubmitting,
  onSubmit,
}) => {
  const { searchByPO, getStyleSuggestions, getColorSuggestions } = useStyleLookup();
  const [showPOSuggestions, setShowPOSuggestions] = React.useState(false);
  const [showStyleSuggestions, setShowStyleSuggestions] = React.useState(false);

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeFactories = Array.isArray(factories) ? factories : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];

  const poValue = watch('po_number') || '';
  const styleValue = watch('style') || '';
  const poSuggestions = searchByPO(poValue);
  const styleSuggestions = getStyleSuggestions(styleValue);

  const handleTemplateChange = (templateId: string) => {
    setValue('template', templateId);
    if (!templateId) return;
    const template = safeTemplates.find((t) => String(t.id) === String(templateId));
    if (template && template.poms) {
      replace(
        template.poms.map((pom: any) => ({
          pom_name: pom.name || pom.pom_name || '',
          tol: pom.default_tol ?? pom.tol ?? 0,
          std: pom.default_std ?? pom.std ?? '',
          samples: Array.from({ length: sampleCount }, (_, i) => ({
            index: i + 1,
            value: '',
          })),
        }))
      );
    }
  };

  const getAutosaveBadge = () => {
    switch (draftsManager.draftStatus) {
      case 'saving_local':
      case 'saving_server':
        return (
          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Saving draft...
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Draft saved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingId ? 'Edit Sample Evaluation' : 'New Sample Evaluation'}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill all required measurements and quality checks
            </p>
          </div>
          <div className="flex items-center gap-3">{getAutosaveBadge()}</div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Template Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Style Template</Label>
              <select
                value={watch('template') || ''}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white"
              >
                <option value="">-- Load from Template --</option>
                {safeTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.poms?.length || 0} POMs)
                  </option>
                ))}
              </select>
            </div>

            {/* PO Number */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold">PO Number *</Label>
              <Input
                {...register('po_number')}
                placeholder="PO-12345"
                onFocus={() => setShowPOSuggestions(true)}
                required
              />
              <InlineSuggestionDropdown
                isOpen={showPOSuggestions && poSuggestions.length > 0}
                onClose={() => setShowPOSuggestions(false)}
                suggestions={poSuggestions.map((s) => `${s.po_number} (${s.style_name})`)}
                onSelect={(val) => {
                  const match = poSuggestions.find((s) => `${s.po_number} (${s.style_name})` === val);
                  if (match) {
                    setValue('po_number', match.po_number);
                    setValue('style', match.style_name);
                    if (match.color) setValue('color', match.color);
                    if (match.customer) {
                      const matchedCust = safeCustomers.find(
                        (c) => String(c.id) === String(match.customer) || c.name.toLowerCase() === match.customer?.toLowerCase()
                      );
                      setValue('customer', matchedCust ? matchedCust.id : match.customer);
                    }
                  }
                  setShowPOSuggestions(false);
                }}
              />
            </div>

            {/* Style */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold">Style Name *</Label>
              <Input
                {...register('style')}
                placeholder="Style Name / No."
                onFocus={() => setShowStyleSuggestions(true)}
                required
              />
              <InlineSuggestionDropdown
                isOpen={showStyleSuggestions && styleSuggestions.length > 0}
                onClose={() => setShowStyleSuggestions(false)}
                suggestions={styleSuggestions}
                onSelect={(val) => {
                  setValue('style', val);
                  const colors = getColorSuggestions(val);
                  if (colors.length > 0 && !getValues('color')) {
                    setValue('color', colors[0]);
                  }
                  setShowStyleSuggestions(false);
                }}
              />
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Color</Label>
              <Input {...register('color')} placeholder="e.g. Navy Blue" />
            </div>

            {/* Sample Stage */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sample Stage *</Label>
              <select
                {...register('stage')}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                required
              >
                {['Dev', 'Proto', 'Fit', 'SMS', 'Size Set', 'PPS', 'Shipment Sample'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Customer</Label>
              <select {...register('customer')} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                <option value="">Select Customer</option>
                {safeCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Factory */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Factory</Label>
              <select {...register('factory')} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                <option value="">Select Factory</option>
                {safeFactories.map((f) => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Decision */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Decision *</Label>
              <select
                {...register('decision')}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white font-semibold"
                required
              >
                <option value="">-- Select Decision --</option>
                <option value="Accepted" className="text-green-600 font-bold">
                  Accepted
                </option>
                <option value="Rejected" className="text-red-600 font-bold">
                  Rejected
                </option>
                <option value="Represent" className="text-amber-600 font-bold">
                  Represent
                </option>
              </select>
            </div>
          </div>

          <hr />

          {/* Measurements Table */}
          <MeasurementTable
            fields={fields}
            append={append}
            remove={remove}
            register={register}
            setValue={setValue}
            getValues={getValues}
            sampleCount={sampleCount}
            setSampleCount={setSampleCount}
            watch={watch}
          />

          <hr />

          {/* Comments & Customer Feedback */}
          <CommentSection register={register} setValue={setValue} watch={watch} />

          <hr />

          {/* Fabric & Accessories */}
          <FabricAccessories
            register={register}
            accessories={accessories}
            setAccessories={setAccessories}
          />

          <hr />

          {/* Image Upload Gallery */}
          <ImageGallery imageSlots={imageSlots} setImageSlots={setImageSlots} />

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={draftsManager.handleSaveDraft}
                disabled={draftsManager.isSavingDraft}
                className="gap-1 text-xs"
              >
                <Save className="w-3.5 h-3.5" /> Save Draft
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
                {isSubmitting ? 'Submitting...' : editingId ? 'Update Report' : 'Submit Evaluation'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
