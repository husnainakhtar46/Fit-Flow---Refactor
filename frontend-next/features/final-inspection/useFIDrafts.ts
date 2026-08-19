'use client';

import { useAutosave } from '@/hooks/useAutosave';
import { toast } from 'sonner';
import { FIDefect, FISizeBreakdown } from './types';

interface UseFIDraftsProps {
  getValues: () => any;
  reset: (values: any) => void;
  editingId: string | null;
  defects: FIDefect[];
  setDefects: (defects: FIDefect[]) => void;
  sizeBreakdowns: FISizeBreakdown[];
  setSizeBreakdowns: (data: FISizeBreakdown[]) => void;
  setIsOpen: (open: boolean) => void;
}

export function useFIDrafts({
  getValues,
  reset,
  editingId,
  defects,
  setDefects,
  sizeBreakdowns,
  setSizeBreakdowns,
  setIsOpen,
}: UseFIDraftsProps) {
  const { clearDraft, existingDraft, resumeDraft } = useAutosave({
    formType: 'final_inspection',
    draftKey: 'fi_draft_form',
    serverId: editingId,
    getFormData: () => ({
      formData: getValues(),
      defects,
      sizeBreakdowns,
    }),
  });

  const handleRestore = () => {
    const draft = resumeDraft();
    if (draft?.formData?.formData) {
      reset(draft.formData.formData);
      if (draft.formData.defects) setDefects(draft.formData.defects);
      if (draft.formData.sizeBreakdowns) setSizeBreakdowns(draft.formData.sizeBreakdowns);
      setIsOpen(true);
      toast.info('Restored unsaved inspection draft');
    }
  };

  return { clearDraft, existingDraft, handleRestore };
}
