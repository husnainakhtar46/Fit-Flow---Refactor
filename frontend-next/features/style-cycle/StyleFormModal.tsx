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
  factories?: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
}

export const StyleFormModal: React.FC<StyleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  style,
  customers = [],
  factories = [],
  isSubmitting,
}) => {
  const [formData, setFormData] = useState(INITIAL_STYLE_STATE);
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeFactories = Array.isArray(factories) ? factories : [];

  useEffect(() => {
    if (isOpen) {
      if (style) {
        setFormData({
          po_number: style.po_number || '',
          style_name: style.style_name || '',
          color: style.color || '',
          customer: style.customer || '',
          factory: style.factory || '',
          season: style.season || '',
        });
      } else {
        setFormData(INITIAL_STYLE_STATE);
      }
    }
  }, [style, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      customer: formData.customer ? formData.customer : null,
      factory: formData.factory ? formData.factory : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{style ? 'Edit Style' : 'Add New Style'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">PO Number *</Label>
            <Input
              value={formData.po_number}
              onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
              placeholder="PO-12345"
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Style Name *</Label>
            <Input
              value={formData.style_name}
              onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
              placeholder="Style Name / No."
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Color</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g. Navy Blue"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Season</Label>
              <Input
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g. SS25 / AW24"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Customer</Label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-xs bg-white h-9"
            >
              <option value="">Select Customer</option>
              {safeCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Manufacturing Factory</Label>
            <select
              value={formData.factory}
              onChange={(e) => setFormData({ ...formData, factory: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-xs bg-white h-9"
            >
              <option value="">Select Factory (Optional)</option>
              {safeFactories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? 'Saving...' : style ? 'Update Style' : 'Create Style'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StyleFormModal;
