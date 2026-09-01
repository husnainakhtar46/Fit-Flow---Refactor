'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { downloadReportPdf, saveOfflinePdf } from '@/lib/pdfDownloader';
import { db } from '@/lib/db';
import { useMasterData } from '@/hooks/useMasterData';
import { compressImage } from '@/lib/imageUtils';
import { calculateSampleSize, calculateDefectLimits, calculateVerdict } from '@/lib/aqlCalculations';
import { PDFReport } from '@/components/pdf/PDFReport';
import { FIDefect, FISizeBreakdown, INITIAL_FI_FORM_STATE } from './types';
import { useFIDrafts } from './useFIDrafts';

export function useFinalInspection() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [page, setPage] = useState(1);
  const [sampleCount, setSampleCount] = useState(5);

  const [defects, setDefects] = useState<FIDefect[]>([]);
  const [sizeBreakdowns, setSizeBreakdowns] = useState<FISizeBreakdown[]>([]);
  const [generalImages, setGeneralImages] = useState<any[]>([]);
  const [defectImages, setDefectImages] = useState<any[]>([]);

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
    defaultValues: { ...INITIAL_FI_FORM_STATE, measurements: [] },
  });

  const { fields, replace, append, remove } = useFieldArray({
    control,
    name: 'measurements',
  });

  const { clearDraft } = useFIDrafts({
    getValues,
    reset,
    editingId,
    defects,
    setDefects,
    sizeBreakdowns,
    setSizeBreakdowns,
    setIsOpen,
  });

  const orderQty = Number(watch('order_quantity')) || 0;
  const aqlLevel = watch('aql_level') || '2.5';

  const aqlCalculations = useMemo(() => {
    const { sampleSize, codeLetter } = calculateSampleSize(orderQty);
    const limits = calculateDefectLimits(sampleSize, aqlLevel);

    const totalCritical = defects.filter((d) => d.type === 'critical').reduce((s, d) => s + d.count, 0);
    const totalMajor = defects.filter((d) => d.type === 'major').reduce((s, d) => s + d.count, 0);
    const totalMinor = defects.filter((d) => d.type === 'minor').reduce((s, d) => s + d.count, 0);

    const verdict = calculateVerdict(
      totalCritical,
      totalMajor,
      totalMinor,
      limits.critical.maxAllowed,
      limits.major.maxAllowed,
      limits.minor.maxAllowed
    );

    return { sampleSize, codeLetter, limits, totalCritical, totalMajor, totalMinor, verdict };
  }, [orderQty, aqlLevel, defects]);

  useEffect(() => {
    setValue('sample_size', aqlCalculations.sampleSize);
    setValue('max_critical_allowed', aqlCalculations.limits.critical.maxAllowed);
    setValue('max_major_allowed', aqlCalculations.limits.major.maxAllowed);
    setValue('max_minor_allowed', aqlCalculations.limits.minor.maxAllowed);
  }, [aqlCalculations, setValue]);

  const { factories, customers, templates } = useMasterData();

  const { data: inspectionsData, isLoading: isInspectionsLoading } = useQuery({
    queryKey: ['final-inspections', page, filters],
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
      const res = await api.get(`/final-inspections/?${params.toString()}`);
      return res.data;
    },
  });

  const uploadImages = async (inspectionId: string) => {
    for (const img of generalImages) {
      if (img.file instanceof File) {
        const compressed = await compressImage(img.file);
        const fd = new FormData();
        fd.append('image', compressed);
        fd.append('caption', img.caption || 'General View');
        fd.append('category', 'general');
        await api.post(`/final-inspections/${inspectionId}/upload_image/`, fd);
      }
    }
    for (const img of defectImages) {
      if (img.file instanceof File) {
        const compressed = await compressImage(img.file);
        const fd = new FormData();
        fd.append('image', compressed);
        fd.append('caption', img.caption || 'Defect Detail');
        fd.append('category', 'defect');
        await api.post(`/final-inspections/${inspectionId}/upload_image/`, fd);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/final-inspections/', data);
      await uploadImages(res.data.id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-inspections'] });
      clearDraft();
      setIsOpen(false);
      reset(INITIAL_FI_FORM_STATE);
      toast.success('Final inspection report created');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create final inspection');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/final-inspections/${id}/`, data);
      await uploadImages(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-inspections'] });
      clearDraft();
      setIsOpen(false);
      setEditingId(null);
      reset(INITIAL_FI_FORM_STATE);
      toast.success('Final inspection report updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update final inspection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/final-inspections/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-inspections'] });
      toast.success('Inspection deleted');
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/final-inspections/${id}/send_email/`),
    onSuccess: (res: any) => {
      const to = res?.data?.to?.join(', ') || 'recipients';
      toast.success(`Final inspection emailed to ${to}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to send email');
    },
  });

  const handleFormSubmit = async (data: any) => {
    const sanitizedMeasurements = (data.measurements || []).map((m: any) => ({
      ...m,
      color: (m.color || data.color || '').trim(),
      size_name: (m.size_name || 'M').trim(),
      std: m.std === '' || m.std === undefined ? 0 : Number(m.std),
      tol: m.tol === '' || m.tol === undefined ? 0 : Number(m.tol),
      samples: (m.samples || []).map((s: any, idx: number) => ({
        index: s.index ?? idx + 1,
        value: s.value === '' || s.value === undefined ? null : Number(s.value),
      })),
    }));

    const payload = {
      ...data,
      is_draft: false,
      defects_data: defects,
      size_breakdowns: sizeBreakdowns,
      measurements: sanitizedMeasurements,
    };

    if (!navigator.onLine) {
      try {
        const allImgPayload = [
          ...generalImages.filter((g) => g.file instanceof File).map((g) => ({ file: g.file as Blob, caption: g.caption, category: 'general' })),
          ...defectImages.filter((d) => d.file instanceof File).map((d) => ({ file: d.file as Blob, caption: d.caption, category: 'defect' })),
        ];
        await db.inspections.add({
          formData: payload,
          images: allImgPayload,
          createdAt: Date.now(),
          status: 'pending_sync',
          type: 'final_inspection',
        });

        // Client-side offline PDF generation
        const fiDoc = React.createElement(PDFReport, {
          data: payload,
          defects: defects,
          images: allImgPayload,
        }) as any;
        const fiFilename = `Offline_FIR_${data.style || data.style_no || 'Report'}_${data.po_number || data.order_no || 'Draft'}.pdf`;
        await saveOfflinePdf(fiDoc, fiFilename);

        clearDraft();
        setIsOpen(false);
        reset(INITIAL_FI_FORM_STATE);
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

  const handleEditInspection = async (item: any) => {
    try {
      const res = await api.get(`/final-inspections/${item.id}/`);
      const full = res.data;
      setEditingId(full.id);
      reset(full);
      const rawDefects = full.defects || full.defects_data || [];
      setDefects(
        rawDefects.map((d: any) => ({
          ...d,
          photo: d.photo_url || d.photo || null,
        }))
      );
      if (full.size_checks || full.size_breakdowns) {
        setSizeBreakdowns(full.size_checks || full.size_breakdowns);
      }
      if (Array.isArray(full.measurements)) {
        replace(full.measurements);
        if (full.measurements[0]?.samples?.length) {
          setSampleCount(full.measurements[0].samples.length);
        }
      }
      setIsOpen(true);
    } catch {
      toast.error('Failed to load inspection details');
    }
  };

  const handleDownloadPdf = async (id: string, style: string) => {
    await downloadReportPdf({
      endpoint: '/final-inspections/',
      id,
      filename: `${style || 'Final_Inspection'}_Report.pdf`,
      fallbackDocument: React.createElement(PDFReport, { data: {}, defects: [], images: [] }),
      fallbackDataGetter: async () => {
        let fullData: any = null;
        try {
          const res = await api.get(`/final-inspections/${id}/`);
          fullData = res.data;
        } catch {
          const list = Array.isArray(inspectionsData) ? inspectionsData : (inspectionsData as any)?.results || [];
          fullData = list.find((item: any) => item.id === id);
        }
        if (!fullData) throw new Error('No final inspection data found for PDF');
        return React.createElement(PDFReport, {
          data: fullData,
          defects: fullData.defects_data || fullData.defects || [],
          images: fullData.images || [],
        });
      },
    });
  };

  return {
    isOpen,
    setIsOpen,
    editingId,
    setEditingId,
    showCloseConfirmation,
    setShowCloseConfirmation,
    page,
    setPage,
    sampleCount,
    setSampleCount,
    defects,
    setDefects,
    sizeBreakdowns,
    setSizeBreakdowns,
    generalImages,
    setGeneralImages,
    defectImages,
    setDefectImages,
    filters,
    setFilters,
    factories,
    customers,
    templates,
    inspectionsData,
    isInspectionsLoading,
    aqlCalculations,
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
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleFormSubmit,
    handleEditInspection,
    handleDownloadPdf,
    deleteMutation,
    emailMutation,
  };
}
