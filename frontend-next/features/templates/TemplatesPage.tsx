'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TemplateForm } from './TemplateForm';
import { TemplateFormValues, StyleTemplate } from './types';
import { useAuth } from '@/lib/auth';

export const TemplatesPage = () => {
  const queryClient = useQueryClient();
  const { canEditTemplates, isReadOnly } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { register, control, handleSubmit, reset, getValues, setValue } =
    useForm<TemplateFormValues>({
      defaultValues: {
        poms: [{ name: '', default_tol: 0 }],
        customer: '',
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'poms',
  });

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', selectedCustomer, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (selectedCustomer && selectedCustomer !== 'all') {
        params.append('customer', selectedCustomer);
      }
      const res = await api.get(`/templates/?${params.toString()}`);
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

  const templates: StyleTemplate[] =
    templatesData?.results || (Array.isArray(templatesData) ? templatesData : []);
  const customers = customersData || [];
  const totalCount = templatesData?.count;

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const payload = {
        ...data,
        customer: data.customer || null,
      };
      return api.post('/templates/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsOpen(false);
      setEditingTemplate(null);
      reset({ name: '', description: '', customer: '', poms: [{ name: '', default_tol: 0 }] });
      toast.success('Template created');
    },
    onError: () => {
      toast.error('Failed to create template. Name might already exist.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormValues }) => {
      const payload = {
        ...data,
        customer: data.customer || null,
      };
      return api.patch(`/templates/${id}/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsOpen(false);
      setEditingTemplate(null);
      reset({ name: '', description: '', customer: '', poms: [{ name: '', default_tol: 0 }] });
      toast.success('Template updated');
    },
    onError: () => {
      toast.error('Failed to update template.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/templates/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted');
    },
  });

  const handleEdit = (template: StyleTemplate) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      description: template.description || '',
      customer: template.customer || '',
      poms:
        template.poms && template.poms.length > 0
          ? template.poms.map((p: any) => ({
              name: p.name || p.pom_name || '',
              default_tol: p.default_tol ?? p.tol ?? 0,
            }))
          : [{ name: '', default_tol: 0 }],
    });
    setIsOpen(true);
  };

  const handleFormSubmit = (data: TemplateFormValues) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Style Templates</h1>
          <p className="text-sm text-gray-500">
            Define standard Point of Measure (POM) templates and tolerances
          </p>
        </div>

        {!isReadOnly && canEditTemplates && (
          <Button
            onClick={() => {
              setEditingTemplate(null);
              reset({
                name: '',
                description: '',
                customer: '',
                poms: [{ name: '', default_tol: 0 }],
              });
              setIsOpen(true);
            }}
            className="bg-primary gap-2"
          >
            <Plus className="w-4 h-4" /> New Template
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white sm:w-64"
        >
          <option value="all">All Templates (Generic & Customers)</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Template Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>POMs Count</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-bold text-gray-900">{item.name}</TableCell>
                  <TableCell>{item.customer_name || 'Generic / Global'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 font-semibold rounded">
                      {item.poms?.length || 0} POMs
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {item.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isReadOnly && canEditTemplates && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 text-gray-600 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {!isReadOnly && canEditTemplates && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this template?')) {
                              deleteMutation.mutate(item.id);
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
          hasNext={!!templatesData?.next}
          hasPrevious={!!templatesData?.previous}
          onPageChange={setPage}
          totalCount={totalCount}
        />
      </div>

      {/* Form Dialog */}
      <TemplateForm
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
        register={register}
        setValue={setValue}
        getValues={getValues}
        fields={fields}
        append={append}
        remove={remove}
        customers={customers}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit(handleFormSubmit)}
      />
    </div>
  );
};
