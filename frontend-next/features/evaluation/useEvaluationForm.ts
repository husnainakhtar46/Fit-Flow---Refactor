'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import api from '@/lib/api';
import { db, cacheCustomers, cacheTemplates, cacheFactories, getCachedCustomers, getCachedTemplates, getCachedFactories } from '@/lib/db';
import { compressImage } from '@/lib/imageUtils';
import { EvaluationPDFReport } from '@/components/pdf/EvaluationPDFReport';
import { ImageSlot, AccessoryItem, INITIAL_FORM_STATE } from './types';
import { useEvaluationDrafts } from './useEvaluationDrafts';

export function useEvaluationForm() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState<number>(3);
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [page, setPage] = useState(1);

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    { file: null, caption: 'Front View' },
    { file: null, caption: 'Back View' },
    { file: null, caption: 'Wash Label' },
    { file: null, caption: 'Detail View' },
  ]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    decisions: [] as string[],
    stages: [] as string[],
    customer: '',
    factory: '',
    search: '',
    ordering: '-created_at',
  });

  const { register, control, handleSubmit, reset, setValue, getValues, watch } = useForm<any>({
    defaultValues: { ...INITIAL_FORM_STATE, measurements: [] },
  });

  const { fields, replace, append, remove } = useFieldArray({
    control,
    name: 'measurements',
  });

  const draftsManager = useEvaluationDrafts({
    getValues,
    reset,
    editingId,
    imageSlots,
    setImageSlots,
    setAccessories,
    setSampleCount,
    setIsOpen,
    setEditingId,
  });

  const { data: factoriesData } = useQuery({
    queryKey: ['factories'],
    queryFn: async () => {
      try {
        const res = await api.get('/factories/');
        const data = res.data.results || res.data || [];
        await cacheFactories(data);
        return data;
      } catch {
        return (await getCachedFactories()) || [];
      }
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers/');
        const data = res.data.results || res.data || [];
        await cacheCustomers(data);
        return data;
      } catch {
        return (await getCachedCustomers()) || [];
      }
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const res = await api.get('/templates/');
        const data = res.data.results || res.data || [];
        await cacheTemplates(data);
        return data;
      } catch {
        return (await getCachedTemplates()) || [];
      }
    },
  });

  const { data: inspectionData, isLoading: isInspectionsLoading } = useQuery({
    queryKey: ['inspections', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.factory) params.append('factory', filters.factory);
      if (filters.ordering) params.append('ordering', filters.ordering);
      filters.decisions.forEach((d) => params.append('decision', d));
      filters.stages.forEach((s) => params.append('stage', s));
      const res = await api.get(`/inspections/?${params.toString()}`);
      return res.data;
    },
  });

  const { data: serverDrafts } = useQuery({
    queryKey: ['inspection-drafts'],
    queryFn: async () => {
      const res = await api.get('/inspections/drafts/');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/inspections/', data);
      for (const slot of imageSlots) {
        if (slot.file instanceof File) {
          const compressed = await compressImage(slot.file);
          const fd = new FormData();
          fd.append('image', compressed);
          fd.append('caption', slot.caption);
          await api.post(`/inspections/${res.data.id}/upload_image/`, fd);
        }
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['inspection-drafts'] });
      draftsManager.clearDraft();
      setIsOpen(false);
      reset(INITIAL_FORM_STATE);
      toast.success('Inspection created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create inspection');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/inspections/${id}/`, data);
      for (const slot of imageSlots) {
        if (slot.file instanceof File) {
          const compressed = await compressImage(slot.file);
          const fd = new FormData();
          fd.append('image', compressed);
          fd.append('caption', slot.caption);
          await api.post(`/inspections/${id}/upload_image/`, fd);
        }
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['inspection-drafts'] });
      draftsManager.clearDraft();
      setIsOpen(false);
      setEditingId(null);
      reset(INITIAL_FORM_STATE);
      toast.success('Inspection updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update inspection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/inspections/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['inspection-drafts'] });
      toast.success('Inspection deleted');
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/inspections/${id}/send_email/`),
    onSuccess: (res: any) => {
      const to = res?.data?.to?.join(', ') || 'recipients';
      toast.success(`Report emailed to ${to}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to send email');
    },
  });

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFormSubmit = async (data: any) => {
    const payload = { ...data, is_draft: false, accessories_data: accessories };
    if (!navigator.onLine) {
      try {
        const imagePayload = imageSlots.filter((s) => s.file instanceof File).map((s) => ({
          file: s.file as Blob,
          caption: s.caption,
          category: 'general',
        }));
        await db.inspections.add({
          formData: payload,
          images: imagePayload,
          createdAt: Date.now(),
          status: 'pending_sync',
          type: 'evaluation',
        });

        // Client-side offline PDF generation
        try {
          const imagesForPdf = await Promise.all(
            imageSlots.map(async (slot) => {
              if (slot.file && typeof slot.file !== 'string') {
                try {
                  const base64 = await fileToBase64(slot.file as Blob);
                  return { file: base64, caption: slot.caption };
                } catch {
                  return { file: null, caption: slot.caption };
                }
              }
              return { file: typeof slot.file === 'string' ? slot.file : null, caption: slot.caption };
            })
          );

          const blob = await pdf(
            React.createElement(EvaluationPDFReport, {
              data: payload,
              images: imagesForPdf.filter((img) => img.file),
            }) as any
          ).toBlob();
          saveAs(blob, `Offline_Evaluation_${data.style || 'Report'}_${data.po_number || 'Draft'}.pdf`);
          toast.success('Saved Offline! PDF report generated.');
        } catch (pdfErr) {
          console.warn('Offline PDF generation skipped:', pdfErr);
          toast.success('Saved locally! Will sync when online.');
        }

        draftsManager.clearDraft();
        setIsOpen(false);
        reset(INITIAL_FORM_STATE);
        return;
      } catch {
        toast.error('Failed to save offline.');
        return;
      }
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEditInspection = async (inspection: any) => {
    try {
      const res = await api.get(`/inspections/${inspection.id}/`);
      const full = res.data;
      setEditingId(full.id);
      reset(full);
      if (full.accessories_data) setAccessories(full.accessories_data);
      if (full.measurements?.[0]?.samples?.length) setSampleCount(full.measurements[0].samples.length);
      if (full.images && Array.isArray(full.images)) {
        const loaded: ImageSlot[] = [
          { file: null, caption: 'Front View' },
          { file: null, caption: 'Back View' },
          { file: null, caption: 'Wash Label' },
          { file: null, caption: 'Detail View' },
        ];
        full.images.forEach((img: any, i: number) => {
          if (i < 4) loaded[i] = { file: img.image, caption: img.caption || loaded[i].caption };
        });
        setImageSlots(loaded);
      }
      setIsOpen(true);
    } catch {
      toast.error('Failed to load inspection details');
    }
  };

  const handleDownloadPdf = async (id: string, style: string) => {
    const toastId = toast.loading('Generating PDF...');
    try {
      const response = await api.get(`/inspections/${id}/pdf/`, {
        responseType: 'blob',
        timeout: 30000,
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${style}_Evaluation.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success('PDF Downloaded');
    } catch (serverError: any) {
      console.warn('Backend PDF failed, generating locally:', serverError);
      toast.message('Backend unavailable. Generating locally...', { id: toastId });

      try {
        let fullData: any = null;
        try {
          const res = await api.get(`/inspections/${id}/`);
          fullData = res.data;
        } catch {
          const list = Array.isArray(inspectionData) ? inspectionData : (inspectionData as any)?.results || [];
          fullData = list.find((item: any) => item.id === id);
        }

        if (!fullData) throw new Error('No inspection data found for PDF');

        const images = fullData.images || [];
        const blob = await pdf(
          React.createElement(EvaluationPDFReport, {
            data: fullData,
            images,
          }) as any
        ).toBlob();

        saveAs(blob, `${style}_Evaluation.pdf`);
        toast.dismiss(toastId);
        toast.success('PDF Downloaded (Client-Side Mode)');
      } catch (clientError) {
        console.error('Client PDF generation failed:', clientError);
        toast.dismiss(toastId);
        toast.error('PDF generation failed.');
      }
    }
  };

  return {
    isOpen,
    setIsOpen,
    editingId,
    setEditingId,
    sampleCount,
    setSampleCount,
    accessories,
    setAccessories,
    page,
    setPage,
    imageSlots,
    setImageSlots,
    filters,
    setFilters,
    factories: Array.isArray(factoriesData) ? factoriesData : factoriesData?.results || [],
    customers: Array.isArray(customersData) ? customersData : customersData?.results || [],
    templates: Array.isArray(templatesData) ? templatesData : templatesData?.results || [],
    inspectionData,
    isInspectionsLoading,
    serverDrafts: Array.isArray(serverDrafts) ? serverDrafts : serverDrafts?.results || [],
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    fields,
    replace,
    append,
    remove,
    draftsManager,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleFormSubmit,
    handleEditInspection,
    handleDownloadPdf,
    deleteMutation,
    emailMutation,
  };
}
