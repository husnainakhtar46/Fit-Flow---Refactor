'use client';

import React, { useState } from 'react';
import { Plus, Search, Layers, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/shared/Pagination';
import { StyleMaster, INITIAL_STYLE_STATE } from './types';
import { useAuth } from '@/lib/auth';

interface StyleListViewProps {
  stylesData: any;
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  customerFilter: string;
  setCustomerFilter: (c: string) => void;
  customers: any[];
  page: number;
  setPage: (p: number) => void;
  onSelectStyle: (styleId: string) => void;
  onCreateStyle: (data: any) => void;
  isCreating: boolean;
}

export const StyleListView: React.FC<StyleListViewProps> = ({
  stylesData,
  isLoading,
  search,
  setSearch,
  customerFilter,
  setCustomerFilter,
  customers,
  page,
  setPage,
  onSelectStyle,
  onCreateStyle,
  isCreating,
}) => {
  const { canEditStyleCycle, isReadOnly } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STYLE_STATE);

  const styles: StyleMaster[] = stylesData?.results || (Array.isArray(stylesData) ? stylesData : []);
  const totalCount = stylesData?.count;

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateStyle(formData);
    setIsModalOpen(false);
    setFormData(INITIAL_STYLE_STATE);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Style Cycle & Comments</h1>
          <p className="text-sm text-gray-500">
            Track customer comments, sample submissions, and revisions across development stages
          </p>
        </div>

        {!isReadOnly && canEditStyleCycle && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary gap-2">
            <Plus className="w-4 h-4" /> New Style
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Style Name or PO Number..."
            className="pl-10 bg-white border-gray-300 h-10"
          />
        </div>

        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white h-10 sm:w-60"
        >
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Styles Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading styles...</div>
      ) : styles.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
          No styles found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map((style) => (
            <div
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                    {style.customer_name || 'Generic'}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                    {style.season || 'No Season'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                  {style.style_name}
                </h3>
                <p className="text-xs text-gray-500">PO: {style.po_number || '-'}</p>
                <p className="text-xs text-gray-600">Color: {style.color || '-'}</p>
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  {style.comments_count || 0} stages logged
                </span>
                <span className="flex items-center gap-0.5 text-blue-600 font-semibold">
                  View Timeline <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        hasNext={!!stylesData?.next}
        hasPrevious={!!stylesData?.previous}
        onPageChange={setPage}
        totalCount={totalCount}
      />

      {/* Create Style Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Style</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModalSubmit} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-primary text-white">
                {isCreating ? 'Creating...' : 'Create Style'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
