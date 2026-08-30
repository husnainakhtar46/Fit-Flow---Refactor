'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/utils/dateFormatter';

type FactoryForm = {
  name: string;
  address: string;
  contact_person: string;
};

export const FactoriesPage = () => {
  const queryClient = useQueryClient();
  const { canEditFactories, isReadOnly } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FactoryForm>({
    defaultValues: { name: '', address: '', contact_person: '' },
  });

  const { data: factoriesData, isLoading } = useQuery({
    queryKey: ['factories', page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      const res = await api.get(`/factories/?${params.toString()}`);
      return res.data;
    },
  });

  const factories = factoriesData?.results || (Array.isArray(factoriesData) ? factoriesData : []);
  const totalCount = factoriesData?.count;

  const createMutation = useMutation({
    mutationFn: async (data: FactoryForm) => api.post('/factories/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factories'] });
      setIsOpen(false);
      reset();
      toast.success('Factory created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create factory');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FactoryForm & { id: string }) => {
      const { id, ...updateData } = data;
      return api.patch(`/factories/${id}/`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factories'] });
      setIsOpen(false);
      setEditingFactory(null);
      reset({ name: '', address: '', contact_person: '' });
      toast.success('Factory updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update factory');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/factories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factories'] });
      toast.success('Factory deleted');
    },
  });

  const handleEdit = (factory: any) => {
    setEditingFactory(factory);
    reset({
      name: factory.name,
      address: factory.address || '',
      contact_person: factory.contact_person || '',
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Garment Factories</h1>
          <p className="text-sm text-gray-500">
            Manage manufacturing facilities and inspection vendor locations
          </p>
        </div>

        {!isReadOnly && canEditFactories && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingFactory(null); reset({ name: '', address: '', contact_person: '' }); }} className="bg-primary gap-2">
                <Plus className="w-4 h-4" /> Add Factory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingFactory ? 'Edit Factory' : 'Add New Factory'}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((data) => {
                  if (editingFactory) {
                    updateMutation.mutate({ ...data, id: editingFactory.id });
                  } else {
                    createMutation.mutate(data);
                  }
                })}
                className="space-y-4 py-2"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Factory Name *</Label>
                  <Input {...register('name', { required: true })} placeholder="e.g. Apex Apparels Unit 1" />
                  {errors.name && <p className="text-xs text-red-600">Factory name is required</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Contact Person</Label>
                  <Input {...register('contact_person')} placeholder="e.g. John Doe (Production Mgr)" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Address / Location (Optional)</Label>
                  <Textarea {...register('address')} placeholder="Factory address..." rows={3} className="text-xs" />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-white"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingFactory
                    ? 'Update Factory'
                    : 'Create Factory'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Factory Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Loading factories...
                </TableCell>
              </TableRow>
            ) : factories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No factories found.
                </TableCell>
              </TableRow>
            ) : (
              factories.map((factory: any) => (
                <TableRow key={factory.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-bold text-gray-900">{factory.name}</TableCell>
                  <TableCell className="text-xs text-gray-700">{factory.contact_person || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-xs truncate">{factory.address || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(factory.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isReadOnly && canEditFactories && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(factory)}
                          className="h-8 w-8 text-gray-600 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!isReadOnly && canEditFactories && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this factory?')) {
                              deleteMutation.mutate(factory.id);
                            }
                          }}
                          className="h-8 w-8 text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          hasNext={!!factoriesData?.next}
          hasPrevious={!!factoriesData?.previous}
          onPageChange={setPage}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};
