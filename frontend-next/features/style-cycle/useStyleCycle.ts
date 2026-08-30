'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { StyleMaster, SampleComment, INITIAL_STYLE_STATE } from './types';

export function useStyleCycle() {
  const queryClient = useQueryClient();
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isStyleFormOpen, setIsStyleFormOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleMaster | null>(null);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<SampleComment | null>(null);

  // Queries
  const { data: stylesData, isLoading: isStylesLoading } = useQuery({
    queryKey: ['styles', page, search, customerFilter, factoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (customerFilter) params.append('customer', customerFilter);
      if (factoryFilter) params.append('factory', factoryFilter);
      const res = await api.get(`/styles/?${params.toString()}`);
      return res.data;
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: factoriesData } = useQuery({
    queryKey: ['factories'],
    queryFn: async () => {
      const res = await api.get('/factories/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: styleDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['style-detail', selectedStyleId],
    queryFn: async () => {
      if (!selectedStyleId) return null;
      const res = await api.get(`/styles/${selectedStyleId}/`);
      return res.data;
    },
    enabled: !!selectedStyleId,
  });

  const { data: sampleComments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['sample-comments', selectedStyleId],
    queryFn: async () => {
      if (!selectedStyleId) return [];
      const res = await api.get(`/styles/${selectedStyleId}/comments/`);
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
    enabled: !!selectedStyleId,
  });

  const formatApiError = (err: any, fallback: string): string => {
    if (err?.response?.data) {
      const data = err.response.data;
      if (typeof data === 'string') return data;
      if (data.detail) return data.detail;
      if (data.error) return data.error;
      if (typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (messages) return messages;
      }
    }
    return err?.message || fallback;
  };

  // Mutations
  const createStyleMutation = useMutation({
    mutationFn: async (data: any) => api.post('/styles/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      setIsStyleFormOpen(false);
      setEditingStyle(null);
      toast.success('Style created successfully');
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to create style'));
    },
  });

  const updateStyleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/styles/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      queryClient.invalidateQueries({ queryKey: ['style-detail', selectedStyleId] });
      setIsStyleFormOpen(false);
      setEditingStyle(null);
      toast.success('Style updated successfully');
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to update style'));
    },
  });

  const deleteStyleMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/styles/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      if (selectedStyleId) setSelectedStyleId(null);
      toast.success('Style deleted');
    },
  });

  const addStyleLinkMutation = useMutation({
    mutationFn: async ({ styleId, label, url }: { styleId: string; label: string; url: string }) =>
      api.post(`/styles/${styleId}/add_link/`, { label, url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-detail', selectedStyleId] });
      toast.success('Resource link added');
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to add link'));
    },
  });

  const deleteStyleLinkMutation = useMutation({
    mutationFn: async (linkId: string) => api.delete(`/style-links/${linkId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-detail', selectedStyleId] });
      toast.success('Link removed');
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to remove link'));
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ styleId, data }: { styleId: string; data: any }) =>
      api.post(`/styles/${styleId}/comments/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-comments', selectedStyleId] });
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      setIsCommentFormOpen(false);
      toast.success('Sample stage comment saved');
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to add comment'));
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, data }: { commentId: string; data: any }) =>
      api.patch(`/sample-comments/${commentId}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-comments', selectedStyleId] });
      setIsCommentFormOpen(false);
      setEditingComment(null);
      toast.success('Comment updated successfully');
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to update comment'));
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => api.delete(`/sample-comments/${commentId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-comments', selectedStyleId] });
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      toast.success('Comment deleted');
    },
  });

  const uploadCommentImageMutation = useMutation({
    mutationFn: async ({ commentId, formData }: { commentId: string; formData: FormData }) =>
      api.post(`/sample-comments/${commentId}/upload_image/`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-comments', selectedStyleId] });
    },
    onError: (err: any) => {
      toast.error(formatApiError(err, 'Failed to upload photo'));
    },
  });

  const deleteCommentImageMutation = useMutation({
    mutationFn: async (imageId: string) => api.delete(`/sample-images/${imageId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-comments', selectedStyleId] });
      toast.success('Image deleted');
    },
  });

  return {
    queryClient,
    selectedStyleId,
    setSelectedStyleId,
    search,
    setSearch,
    customerFilter,
    setCustomerFilter,
    factoryFilter,
    setFactoryFilter,
    page,
    setPage,
    isStyleFormOpen,
    setIsStyleFormOpen,
    editingStyle,
    setEditingStyle,
    isCommentFormOpen,
    setIsCommentFormOpen,
    editingComment,
    setEditingComment,
    stylesData,
    isStylesLoading,
    customers: Array.isArray(customersData)
      ? customersData
      : Array.isArray(customersData?.results)
      ? customersData.results
      : [],
    factories: Array.isArray(factoriesData)
      ? factoriesData
      : Array.isArray(factoriesData?.results)
      ? factoriesData.results
      : [],
    styleDetail,
    isDetailLoading,
    sampleComments: sampleComments || [],
    isCommentsLoading,
    createStyleMutation,
    updateStyleMutation,
    deleteStyleMutation,
    addStyleLinkMutation,
    deleteStyleLinkMutation,
    createCommentMutation,
    updateCommentMutation,
    deleteCommentMutation,
    uploadCommentImageMutation,
    deleteCommentImageMutation,
  };
}
