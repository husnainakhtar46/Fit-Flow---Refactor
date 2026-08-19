'use client';

import { useState, useMemo, useCallback } from 'react';
import { UseFormGetValues, UseFormReset } from 'react-hook-form';
import { toast } from 'sonner';
import { useAutosave } from '@/hooks/useAutosave';
import { saveDraftLocally, deleteDraft } from '@/lib/db';
import api from '@/lib/api';
import { ImageSlot } from './types';

interface UseEvaluationDraftsProps {
  getValues: UseFormGetValues<any>;
  reset: UseFormReset<any>;
  editingId: string | null;
  imageSlots: ImageSlot[];
  setImageSlots: (slots: ImageSlot[]) => void;
  setAccessories: (items: any[]) => void;
  setSampleCount: (count: number) => void;
  setIsOpen: (open: boolean) => void;
  setEditingId: (id: string | null) => void;
}

export function useEvaluationDrafts({
  getValues,
  reset,
  editingId,
  imageSlots,
  setImageSlots,
  setAccessories,
  setSampleCount,
  setIsOpen,
  setEditingId,
}: UseEvaluationDraftsProps) {
  const [showResumeDraftDialog, setShowResumeDraftDialog] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const styleValue = getValues('style');
  const colorValue = getValues('color');
  const stageValue = getValues('stage');

  const draftKey = useMemo(() => {
    if (editingId) return `eval_edit_${editingId}`;
    const s = (styleValue || '').trim().toLowerCase();
    const c = (colorValue || '').trim().toLowerCase();
    const st = (stageValue || '').trim().toLowerCase();
    if (!s && !c) return 'eval_new_empty';
    return `eval_new_${s}_${c}_${st}`;
  }, [editingId, styleValue, colorValue, stageValue]);

  const getFormDataForDraft = useCallback(() => {
    return getValues();
  }, [getValues]);

  const getImageSlotsForDraft = useCallback(() => {
    return imageSlots.map((slot) => ({
      caption: slot.caption,
      hasFile: !!slot.file,
      filePreview: typeof slot.file === 'string' ? slot.file : null,
    }));
  }, [imageSlots]);

  const {
    draftStatus,
    lastSavedAt,
    existingDraft,
    resumeDraft,
    clearDraft,
    saveDraftNow,
    dismissDraft,
  } = useAutosave({
    formType: 'evaluation',
    draftKey,
    getFormData: getFormDataForDraft,
    getImageSlots: getImageSlotsForDraft,
    serverId: editingId,
    enabled: true,
  });

  const handleResumeDraft = useCallback(() => {
    const draft = resumeDraft();
    if (!draft) return;

    if (draft.formData) {
      reset(draft.formData);
      if (draft.formData.accessories_data) {
        setAccessories(draft.formData.accessories_data);
      }
      if (draft.formData.measurements?.[0]?.samples?.length) {
        setSampleCount(draft.formData.measurements[0].samples.length);
      }
    }

    if (draft.imageSlots && Array.isArray(draft.imageSlots)) {
      setImageSlots(
        draft.imageSlots.map((slot: any) => ({
          file: slot.filePreview || null,
          caption: slot.caption || '',
        }))
      );
    }

    setShowResumeDraftDialog(false);
    toast.success('Draft restored successfully');
  }, [resumeDraft, reset, setAccessories, setSampleCount, setImageSlots]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const formData = getValues();
      await saveDraftLocally({
        draftKey,
        formData,
        imageSlots: getImageSlotsForDraft(),
        serverId: editingId || undefined,
        updatedAt: Date.now(),
        formType: 'evaluation',
      });

      const sanitizedMeasurements = Array.isArray(formData.measurements)
        ? formData.measurements.map((m: any) => ({
            ...m,
            std: m.std === '' || m.std === undefined ? null : Number(m.std),
            tol: m.tol === '' || m.tol === undefined ? 0 : Number(m.tol),
            samples: Array.isArray(m.samples)
              ? m.samples.map((s: any) => ({
                  ...s,
                  value: s.value === '' || s.value === undefined ? null : Number(s.value),
                }))
              : [],
          }))
        : [];

      const payload = {
        ...formData,
        template: formData.template || null,
        customer: formData.customer || null,
        style: formData.style || '',
        decision: formData.decision || 'Pending',
        measurements: sanitizedMeasurements,
        is_draft: true,
      };

      if (editingId) {
        await api.patch(`/inspections/${editingId}/`, payload);
      } else {
        const res = await api.post('/inspections/', payload);
        if (res.data?.id) {
          setEditingId(res.data.id);
        }
      }

      toast.success('Draft saved successfully');
    } catch (err) {
      console.error('Draft save failed:', err);
      toast.error('Draft saved locally, but server sync failed.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleOpenDraft = async (draft: any) => {
    setEditingId(draft.id);
    reset({
      style: draft.style || '',
      color: draft.color || '',
      po_number: draft.po_number || '',
      factory: draft.factory || '',
      stage: draft.stage || 'Proto',
      template: draft.template || '',
      customer: draft.customer || '',
      customer_remarks: draft.customer_remarks || '',
      customer_fit_comments: draft.customer_fit_comments || '',
      customer_workmanship_comments: draft.customer_workmanship_comments || '',
      customer_wash_comments: draft.customer_wash_comments || '',
      customer_fabric_comments: draft.customer_fabric_comments || '',
      customer_accessories_comments: draft.customer_accessories_comments || '',
      customer_comments_addressed: draft.customer_comments_addressed || false,
      qa_fit_comments: draft.qa_fit_comments || '',
      qa_workmanship_comments: draft.qa_workmanship_comments || '',
      qa_wash_comments: draft.qa_wash_comments || '',
      qa_fabric_comments: draft.qa_fabric_comments || '',
      qa_accessories_comments: draft.qa_accessories_comments || '',
      fabric_handfeel: draft.fabric_handfeel || 'OK',
      fabric_pilling: draft.fabric_pilling || 'None',
      remarks: draft.remarks || '',
      decision: draft.decision || '',
      measurements: draft.measurements || [],
    });

    if (draft.accessories_data) {
      setAccessories(draft.accessories_data);
    }
    if (draft.measurements?.[0]?.samples?.length) {
      setSampleCount(draft.measurements[0].samples.length);
    }
    setIsOpen(true);
  };

  return {
    draftKey,
    draftStatus,
    lastSavedAt,
    existingDraft,
    showResumeDraftDialog,
    setShowResumeDraftDialog,
    isSavingDraft,
    handleResumeDraft,
    handleSaveDraft,
    handleOpenDraft,
    clearDraft,
    dismissDraft,
    saveDraftNow,
  };
}
