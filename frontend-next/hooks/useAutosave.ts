'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveDraftLocally, getDraft, deleteDraft, DraftEntry } from '@/lib/db';
import api from '@/lib/api';

export type DraftStatus = 'idle' | 'saving_local' | 'saving_server' | 'saved' | 'error';

interface UseAutosaveOptions {
  formType: 'evaluation' | 'final_inspection';
  draftKey: string;
  getFormData: () => any;
  getImageSlots?: () => any;
  serverId?: string | null;
  enabled?: boolean;
  localDebounceMs?: number;
}

interface UseAutosaveReturn {
  draftStatus: DraftStatus;
  lastSavedAt: Date | null;
  existingDraft: DraftEntry | null;
  resumeDraft: () => DraftEntry | null;
  clearDraft: () => Promise<void>;
  saveDraftNow: () => Promise<void>;
  dismissDraft: () => Promise<void>;
  triggerLocalSave: () => void;
}

export function useAutosave({
  formType,
  draftKey,
  getFormData,
  getImageSlots,
  serverId = null,
  enabled = true,
  localDebounceMs = 2000,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [existingDraft, setExistingDraft] = useState<DraftEntry | null>(null);

  const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMountRef = useRef(true);
  const currentServerIdRef = useRef<string | null>(serverId);

  useEffect(() => {
    currentServerIdRef.current = serverId;
  }, [serverId]);

  useEffect(() => {
    if (!enabled || !draftKey) return;

    let isMounted = true;
    (async () => {
      try {
        const found = await getDraft(draftKey);
        if (found && isMounted) {
          setExistingDraft(found);
        }
      } catch (err) {
        console.warn('[useAutosave] Failed to check for existing draft:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [draftKey, enabled]);

  const saveLocal = useCallback(async () => {
    if (!enabled || !draftKey) return;

    try {
      setDraftStatus('saving_local');
      const formData = getFormData();
      const imageSlots = getImageSlots ? getImageSlots() : null;

      const entry: DraftEntry = {
        draftKey,
        formData,
        imageSlots,
        serverId: currentServerIdRef.current || undefined,
        updatedAt: Date.now(),
        formType,
      };

      await saveDraftLocally(entry);
      setDraftStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('[useAutosave] Local save error:', err);
      setDraftStatus('error');
    }
  }, [draftKey, enabled, formType, getFormData, getImageSlots]);

  const triggerLocalSave = useCallback(() => {
    if (!enabled) return;
    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    localTimerRef.current = setTimeout(() => {
      saveLocal();
    }, localDebounceMs);
  }, [enabled, localDebounceMs, saveLocal]);

  const saveServer = useCallback(async () => {
    if (!enabled) return;

    try {
      setDraftStatus('saving_server');
      const formData = getFormData();
      const endpoint = formType === 'evaluation' ? '/inspections/' : '/final-inspections/';

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
        : formData.measurements;

      const payload = {
        ...formData,
        template: formData.template || null,
        customer: formData.customer || null,
        measurements: sanitizedMeasurements,
        is_draft: true,
      };

      if (currentServerIdRef.current) {
        await api.patch(`${endpoint}${currentServerIdRef.current}/`, payload);
      } else {
        const res = await api.post(endpoint, payload);
        if (res.data?.id) {
          currentServerIdRef.current = res.data.id;
        }
      }

      setDraftStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('[useAutosave] Server draft save error (non-fatal, local copy safe):', err);
      setDraftStatus('saved');
    }
  }, [enabled, formType, getFormData]);

  const saveDraftNow = useCallback(async () => {
    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    await saveLocal();
    await saveServer();
  }, [saveLocal, saveServer]);

  const clearDraft = useCallback(async () => {
    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    try {
      if (draftKey) {
        await deleteDraft(draftKey);
      }
      setExistingDraft(null);
      setDraftStatus('idle');
    } catch (err) {
      console.warn('[useAutosave] Failed to clear draft:', err);
    }
  }, [draftKey]);

  const dismissDraft = useCallback(async () => {
    await clearDraft();
  }, [clearDraft]);

  const resumeDraft = useCallback((): DraftEntry | null => {
    return existingDraft;
  }, [existingDraft]);

  useEffect(() => {
    if (!enabled) return;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    triggerLocalSave();
  }, [enabled, triggerLocalSave]);

  useEffect(() => {
    return () => {
      if (localTimerRef.current) clearTimeout(localTimerRef.current);
    };
  }, []);

  return {
    draftStatus,
    lastSavedAt,
    existingDraft,
    resumeDraft,
    clearDraft,
    saveDraftNow,
    dismissDraft,
    triggerLocalSave,
  };
}
