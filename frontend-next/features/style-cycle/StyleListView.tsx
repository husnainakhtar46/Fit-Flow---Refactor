'use client';

import React from 'react';
import { Plus, Search, Layers, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/shared/Pagination';
import { StyleMaster } from './types';
import { useAuth } from '@/lib/auth';

interface StyleListViewProps {
  stylesData: any;
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  customerFilter: string;
  setCustomerFilter: (c: string) => void;
  customers: any[];
  factoryFilter: string;
  setFactoryFilter: (f: string) => void;
  factories: any[];
  page: number;
  setPage: (p: number) => void;
  onSelectStyle: (styleId: string) => void;
  onNewStyle: () => void;
}

export const StyleListView: React.FC<StyleListViewProps> = ({
  stylesData,
  isLoading,
  search,
  setSearch,
  customerFilter,
  setCustomerFilter,
  customers,
  factoryFilter,
  setFactoryFilter,
  factories,
  page,
  setPage,
  onSelectStyle,
  onNewStyle,
}) => {
  const { canEditStyleCycle, isReadOnly } = useAuth();

  const styles: StyleMaster[] = stylesData?.results || (Array.isArray(stylesData) ? stylesData : []);
  const totalCount = stylesData?.count;
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeFactories = Array.isArray(factories) ? factories : [];

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Style Cycle & Comments</h1>
          <p className="text-sm text-gray-500">Track sample approval stages, revisions, and QA feedback</p>
        </div>

        {!isReadOnly && canEditStyleCycle && (
          <Button onClick={onNewStyle} className="bg-primary gap-2">
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
            placeholder="Search by Style Name, PO Number, or Factory..."
            className="pl-10 bg-white border-gray-300 h-10 text-xs sm:text-sm"
          />
        </div>

        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white h-10 sm:w-52"
        >
          <option value="">All Customers</option>
          {safeCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={factoryFilter}
          onChange={(e) => setFactoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white h-10 sm:w-52"
        >
          <option value="">All Factories</option>
          {safeFactories.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
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
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>PO: {style.po_number || '-'}</span>
                  <span>Color: {style.color || '-'}</span>
                </div>

                {style.factory_name && (
                  <div className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {style.factory_name}
                  </div>
                )}
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
    </div>
  );
};

export default StyleListView;
