'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Edit2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomerForm } from './CustomerForm';
import { useAuth } from '@/lib/auth';

export const CustomersPage = () => {
  const queryClient = useQueryClient();
  const { canEditCustomers, isReadOnly } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      emails: [{ contact_name: '', email: '', email_type: 'to' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      const res = await api.get(`/customers/?${params.toString()}`);
      return res.data;
    },
  });

  const customers =
    customersData?.results || (Array.isArray(customersData) ? customersData : []);
  const totalCount = customersData?.count;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const hasToEmail = data.emails.some(
        (e: any) => e.email_type === 'to' && e.email.trim() !== ''
      );
      if (!hasToEmail) {
        throw new Error('At least one "To" email is required');
      }

      const res = await api.post('/customers/', { name: data.name });
      const customerId = res.data.id;

      for (const emailData of data.emails) {
        if (emailData.email.trim()) {
          await api.post(`/customers/${customerId}/add_email/`, {
            contact_name: emailData.contact_name,
            email: emailData.email,
            email_type: emailData.email_type,
          });
        }
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsOpen(false);
      reset({ name: '', emails: [{ contact_name: '', email: '', email_type: 'to' }] });
      toast.success('Customer created');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updateData } = data;
      const hasToEmail = updateData.emails.some(
        (e: any) => e.email_type === 'to' && e.email.trim() !== ''
      );
      if (!hasToEmail) {
        throw new Error('At least one "To" email is required');
      }
      return api.patch(`/customers/${id}/`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsOpen(false);
      setEditingCustomer(null);
      reset({ name: '', emails: [{ contact_name: '', email: '', email_type: 'to' }] });
      toast.success('Customer updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/customers/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
  });

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      emails:
        customer.emails && customer.emails.length > 0
          ? customer.emails
          : [{ contact_name: '', email: '', email_type: 'to' }],
    });
    setIsOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers Directory</h1>
          <p className="text-sm text-gray-500">
            Manage buyer accounts and automatic report dispatch email lists
          </p>
        </div>

        {!isReadOnly && canEditCustomers && (
          <Button
            onClick={() => {
              setEditingCustomer(null);
              reset({ name: '', emails: [{ contact_name: '', email: '', email_type: 'to' }] });
              setIsOpen(true);
            }}
            className="bg-primary gap-2"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Customer Name</TableHead>
              <TableHead>Notification Emails</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-bold text-gray-900">{c.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {c.emails && c.emails.length > 0 ? (
                        c.emails.map((e: any, idx: number) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                              e.email_type === 'to'
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Mail className="w-3 h-3" />
                            {e.contact_name ? `${e.contact_name} (${e.email})` : e.email}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No emails configured</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isReadOnly && canEditCustomers && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(c)}
                          className="h-8 w-8 text-gray-600 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!isReadOnly && canEditCustomers && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this customer?')) {
                              deleteMutation.mutate(c.id);
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
          hasNext={!!customersData?.next}
          hasPrevious={!!customersData?.previous}
          onPageChange={setPage}
          totalCount={totalCount}
        />
      </div>

      {/* Customer Modal */}
      <CustomerForm
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingCustomer(null);
        }}
        editingCustomer={editingCustomer}
        register={register}
        fields={fields}
        append={append}
        remove={remove}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit(handleFormSubmit)}
      />
    </div>
  );
};
