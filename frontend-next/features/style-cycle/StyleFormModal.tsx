'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StyleMaster, INITIAL_STYLE_STATE } from './types';

interface StyleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  style: StyleMaster | null;
  customers: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
}

export const StyleFormModal: React.FC<StyleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  style,
  customers,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState(INITIAL_STYLE_STATE);

  useEffect(() => {
    if (style) {
      setFormData({
        po_number: style.po_number || '',
        style_name: style.style_name || '',
        color: style.color || '',
        customer: style.customer || '',
        season: style.season || '',
      });
    } else {
      setFormData(INITIAL_STYLE_STATE);
    }
  }, [style, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      customer: formData.customer ? formData.customer : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{style ? 'Edit Style' : 'Add New Style'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">PO Number *</Label>
            <Input
              value={formData.po_number}
              onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
              placeholder="PO-12345"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Style Name *</Label>
            <Input
              value={formData.style_name}
              onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
              placeholder="Style Name / No."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Color</Label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g. Navy Blue"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Customer</Label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Season</Label>
            <Input
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              placeholder="e.g. SS25 / AW24"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? 'Saving...' : style ? 'Update Style' : 'Create Style'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
