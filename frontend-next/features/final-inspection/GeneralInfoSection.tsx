'use client';

import React, { useState } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStyleLookup } from '@/hooks/useStyleLookup';
import { InlineSuggestionDropdown } from '@/components/shared/InlineSuggestionDropdown';

interface GeneralInfoSectionProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: any;
  customers: any[];
  factories: any[];
  aqlCalculations: any;
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  register,
  setValue,
  watch,
  customers,
  factories,
  aqlCalculations,
}) => {
  const { searchByPO, getStyleSuggestions } = useStyleLookup();
  const [showPOSuggestions, setShowPOSuggestions] = useState(false);
  const [showStyleSuggestions, setShowStyleSuggestions] = useState(false);

  const poValue = watch('po_number') || '';
  const styleValue = watch('style') || '';
  const poSuggestions = searchByPO(poValue);
  const styleSuggestions = getStyleSuggestions(styleValue);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <h3 className="text-base font-bold text-gray-900">General Information & AQL Scope</h3>
        <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
          <span className="text-xs text-blue-800 font-medium">
            Code Letter: <strong className="text-blue-900">{aqlCalculations.codeLetter || '-'}</strong>
          </span>
          <span className="text-xs text-blue-800 font-medium">
            Required Sample Size: <strong className="text-blue-900">{aqlCalculations.sampleSize} pcs</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* PO Number */}
        <div className="space-y-1.5 relative">
          <Label className="text-xs font-semibold">PO Number *</Label>
          <Input
            {...register('po_number')}
            placeholder="PO-12345"
            onFocus={() => setShowPOSuggestions(true)}
            required
          />
          <InlineSuggestionDropdown
            isOpen={showPOSuggestions && poSuggestions.length > 0}
            onClose={() => setShowPOSuggestions(false)}
            suggestions={poSuggestions.map((s) => `${s.po_number} (${s.style_name})`)}
            onSelect={(val) => {
              const match = poSuggestions.find((s) => `${s.po_number} (${s.style_name})` === val);
              if (match) {
                setValue('po_number', match.po_number);
                setValue('style', match.style_name);
                if (match.color) setValue('color', match.color);
                if (match.customer) setValue('customer', match.customer);
              }
              setShowPOSuggestions(false);
            }}
          />
        </div>

        {/* Style */}
        <div className="space-y-1.5 relative">
          <Label className="text-xs font-semibold">Style *</Label>
          <Input
            {...register('style')}
            placeholder="Style Name"
            onFocus={() => setShowStyleSuggestions(true)}
            required
          />
          <InlineSuggestionDropdown
            isOpen={showStyleSuggestions && styleSuggestions.length > 0}
            onClose={() => setShowStyleSuggestions(false)}
            suggestions={styleSuggestions}
            onSelect={(val) => {
              setValue('style', val);
              setShowStyleSuggestions(false);
            }}
          />
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Color</Label>
          <Input {...register('color')} placeholder="e.g. Olive Green" />
        </div>

        {/* Customer */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Customer</Label>
          <select
            {...register('customer')}
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

        {/* Factory */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Factory</Label>
          <select
            {...register('factory')}
            className="w-full px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="">Select Factory</option>
            {factories.map((f) => (
              <option key={f.id} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier / Vendor */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Supplier / Vendor</Label>
          <Input {...register('supplier')} placeholder="e.g. Fabric & Trim Vendor / Exporter" />
        </div>

        {/* Inspection Attempt */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Inspection Attempt *</Label>
          <select
            {...register('inspection_attempt')}
            className="w-full px-3 py-2 border rounded-md text-sm bg-white font-medium"
            required
          >
            <option value="1st">1st Inspection</option>
            <option value="2nd">2nd Inspection (Re-inspection)</option>
            <option value="3rd">3rd Inspection</option>
          </select>
        </div>

        {/* Inspection Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Inspection Stage *</Label>
          <select
            {...register('inspection_type')}
            className="w-full px-3 py-2 border rounded-md text-sm bg-white"
            required
          >
            <option value="Inline">Inline Inspection</option>
            <option value="Mid-Line">Mid-Line Inspection</option>
            <option value="Final">Final Inspection (FRI)</option>
          </select>
        </div>

        {/* Order Quantity */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Order Quantity (Pcs) *</Label>
          <Input
            type="number"
            min={1}
            {...register('order_quantity')}
            placeholder="e.g. 5000"
            required
          />
        </div>

        {/* AQL Level */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Major AQL Limit *</Label>
            <select
              {...register('aql_major', {
                onChange: (e) => {
                  const val = e.target.value;
                  if (val === '1.0' || val === '1.5') setValue('aql_minor', '2.5');
                  else if (val === '2.5') setValue('aql_minor', '4.0');
                  else if (val === '4.0' || val === '6.5') setValue('aql_minor', '6.5');
                }
              })}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white font-medium"
              required
            >
              <option value="1.0">1.0 (Strict)</option>
              <option value="1.5">1.5</option>
              <option value="2.5">2.5 (Standard)</option>
              <option value="4.0">4.0</option>
              <option value="6.5">6.5</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Minor AQL Limit *</Label>
            <select
              {...register('aql_minor')}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white font-medium"
              required
            >
              <option value="1.0">1.0</option>
              <option value="1.5">1.5</option>
              <option value="2.5">2.5</option>
              <option value="4.0">4.0 (Standard)</option>
              <option value="6.5">6.5</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
