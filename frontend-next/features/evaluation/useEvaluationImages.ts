'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { compressImage } from '@/lib/imageUtils';
import { ImageSlot } from './types';

export const DEFAULT_MANDATORY_SLOTS: ImageSlot[] = [
  { file: null, caption: 'Front View', isPredefined: true },
  { file: null, caption: 'Back View', isPredefined: true },
];

export function useEvaluationImages() {
  const [imageSlots, setImageSlotsState] = useState<ImageSlot[]>([
    { file: null, caption: 'Front View', isPredefined: true },
    { file: null, caption: 'Back View', isPredefined: true },
  ]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const setImageSlots = useCallback((slots: ImageSlot[]) => {
    // Ensure the first two slots are always tagged as predefined
    const normalized = slots.map((s, idx) => ({
      ...s,
      isPredefined: idx < 2 ? true : s.isPredefined ?? false,
      caption: idx === 0 ? 'Front View' : idx === 1 ? 'Back View' : s.caption,
    }));
    setImageSlotsState(
      normalized.length >= 2 ? normalized : [...normalized, ...DEFAULT_MANDATORY_SLOTS.slice(normalized.length)]
    );
  }, []);

  const addSlot = useCallback(() => {
    setImageSlotsState((prev) => [
      ...prev,
      { file: null, caption: '', isPredefined: false },
    ]);
  }, []);

  const removeSlot = useCallback((index: number) => {
    setImageSlotsState((prev) => {
      if (index < 2 || prev[index]?.isPredefined) {
        return prev; // Cannot delete mandatory Front View or Back View
      }
      const slotToRemove = prev[index];
      if (slotToRemove?.id) {
        setDeletedImageIds((ids) => [...ids, slotToRemove.id!]);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateSlot = useCallback(
    (index: number, updates: Partial<ImageSlot>) => {
      setImageSlotsState((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;

        const isMandatory = index < 2 || next[index].isPredefined;
        next[index] = {
          ...next[index],
          ...updates,
          caption: isMandatory
            ? index === 0
              ? 'Front View'
              : 'Back View'
            : updates.caption !== undefined
            ? updates.caption
            : next[index].caption,
        };
        return next;
      });
    },
    []
  );

  const validateMandatoryPhotos = useCallback((): { valid: boolean; error?: string } => {
    const frontView = imageSlots[0]?.file;
    const backView = imageSlots[1]?.file;

    if (!frontView && !backView) {
      return {
        valid: false,
        error: 'Front View and Back View photos are mandatory. Please upload both.',
      };
    }
    if (!frontView) {
      return {
        valid: false,
        error: 'Front View photo is mandatory. Please upload Front View.',
      };
    }
    if (!backView) {
      return {
        valid: false,
        error: 'Back View photo is mandatory. Please upload Back View.',
      };
    }
    return { valid: true };
  }, [imageSlots]);

  const uploadAllImages = useCallback(
    async (inspectionId: string) => {
      // 1. Delete removed images if any
      for (const imgId of deletedImageIds) {
        try {
          await api.post(`/inspections/${inspectionId}/delete_image/`, { image_id: imgId });
        } catch {
          // Ignore individual delete errors
        }
      }
      setDeletedImageIds([]);

      // 2. Upload newly attached files
      for (const slot of imageSlots) {
        if (slot.file instanceof File) {
          const compressed = await compressImage(slot.file);
          const fd = new FormData();
          fd.append('image', compressed);
          fd.append('caption', (slot.caption || 'Detail View').trim());
          await api.post(`/inspections/${inspectionId}/upload_image/`, fd);
        }
      }
    },
    [deletedImageIds, imageSlots]
  );

  const loadExistingImages = useCallback((serverImages: any[]) => {
    if (!Array.isArray(serverImages) || serverImages.length === 0) {
      setImageSlotsState([
        { file: null, caption: 'Front View', isPredefined: true },
        { file: null, caption: 'Back View', isPredefined: true },
      ]);
      setDeletedImageIds([]);
      return;
    }

    // Match Front View and Back View by caption
    let frontImg = serverImages.find((img) =>
      img.caption?.toLowerCase().includes('front')
    );
    let backImg = serverImages.find((img) =>
      img.caption?.toLowerCase().includes('back')
    );

    // Fallbacks if not matched by caption
    const remaining = serverImages.filter((img) => img !== frontImg && img !== backImg);
    if (!frontImg && remaining.length > 0) {
      frontImg = remaining.shift();
    }
    if (!backImg && remaining.length > 0) {
      backImg = remaining.shift();
    }

    const loaded: ImageSlot[] = [
      {
        id: frontImg?.id,
        file: frontImg?.image || null,
        caption: 'Front View',
        isPredefined: true,
      },
      {
        id: backImg?.id,
        file: backImg?.image || null,
        caption: 'Back View',
        isPredefined: true,
      },
      ...remaining.map((img) => ({
        id: img.id,
        file: img.image,
        caption: img.caption || 'Detail View',
        isPredefined: false,
      })),
    ];

    setImageSlotsState(loaded);
    setDeletedImageIds([]);
  }, []);

  const resetImageSlots = useCallback(() => {
    setImageSlotsState([
      { file: null, caption: 'Front View', isPredefined: true },
      { file: null, caption: 'Back View', isPredefined: true },
    ]);
    setDeletedImageIds([]);
  }, []);

  return {
    imageSlots,
    setImageSlots,
    addSlot,
    removeSlot,
    updateSlot,
    validateMandatoryPhotos,
    uploadAllImages,
    loadExistingImages,
    resetImageSlots,
  };
}
