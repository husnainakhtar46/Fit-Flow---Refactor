'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { POMTable } from './POMTable';
import { TemplateFormValues } from './types';

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate: any;
  register: UseFormRegister<TemplateFormValues>;
  setValue: UseFormSetValue<TemplateFormValues>;
  getValues: UseFormGetValues<TemplateFormValues>;
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  customers: any[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  isOpen,
  onClose,
  editingTemplate,
  register,
  setValue,
  getValues,
  fields,
  append,
  remove,
  customers,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>
            {editingTemplate ? 'Edit Style Template' : 'Create New Style Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Template / Style Name *</Label>
            <Input
              {...register('name')}
              placeholder="e.g. Mens T-Shirt Basic"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Customer</Label>
            <select
              {...register('customer')}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="">-- Generic Template (All Customers) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              {...register('description')}
              placeholder="Brief notes on this measurement template..."
              rows={2}
              className="text-xs"
            />
          </div>

          <hr />

          <POMTable
            fields={fields}
            append={append}
            remove={remove}
            register={register}
            setValue={setValue}
            getValues={getValues}
          />

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting
                ? 'Saving...'
                : editingTemplate
                ? 'Update Template'
                : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
