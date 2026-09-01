'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FISizeBreakdown } from './types';
import { SizeMatrixTable } from './SizeMatrixTable';
import { cn } from '@/lib/utils';

interface SizeBreakdownProps {
  sizeBreakdowns: FISizeBreakdown[];
  setSizeBreakdowns: React.Dispatch<React.SetStateAction<FISizeBreakdown[]>>;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const COLOR_PRESETS = ['Navy', 'Black', 'White', 'Grey', 'Olive', 'Beige'];

export const SizeBreakdown: React.FC<SizeBreakdownProps> = ({
  sizeBreakdowns,
  setSizeBreakdowns,
}) => {
  const [colorInput, setColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');

  // 1. Derive active unique colors from existing breakdowns
  const activeColors = useMemo(() => {
    const raw = sizeBreakdowns.map((r) => (r.color || '').trim()).filter(Boolean);
    return Array.from(new Set(raw));
  }, [sizeBreakdowns]);

  // 2. Derive active unique sizes from existing breakdowns
  const activeSizes = useMemo(() => {
    const raw = sizeBreakdowns.map((r) => (r.size || '').trim()).filter(Boolean);
    return Array.from(new Set(raw));
  }, [sizeBreakdowns]);

  // Lookup map for preserving entered order_qty and inspected_qty
  const qtyMap = useMemo(() => {
    const map = new Map<string, { order_qty: number; inspected_qty: number; id?: string }>();
    sizeBreakdowns.forEach((r) => {
      const k = `${(r.color || '').trim().toLowerCase()}|${(r.size || '').trim().toLowerCase()}`;
      map.set(k, { order_qty: r.order_qty || 0, inspected_qty: r.inspected_qty || 0, id: r.id });
    });
    return map;
  }, [sizeBreakdowns]);

  // Helper to re-generate sizeBreakdowns matrix
  const regenerateMatrix = useCallback(
    (colors: string[], sizes: string[]) => {
      const newRows: FISizeBreakdown[] = [];
      colors.forEach((c) => {
        sizes.forEach((s) => {
          const k = `${c.trim().toLowerCase()}|${s.trim().toLowerCase()}`;
          const existing = qtyMap.get(k);
          newRows.push({
            id: existing?.id,
            color: c.trim(),
            size: s.trim(),
            order_qty: existing?.order_qty ?? 0,
            inspected_qty: existing?.inspected_qty ?? 0,
          });
        });
      });
      setSizeBreakdowns(newRows);
    },
    [qtyMap, setSizeBreakdowns]
  );

  // Add a new color chip
  const handleAddColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    if (activeColors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setColorInput('');
      return;
    }
    const newColors = [...activeColors, trimmed];
    const sizesToUse = activeSizes.length > 0 ? activeSizes : ['S', 'M', 'L', 'XL'];
    regenerateMatrix(newColors, sizesToUse);
    setColorInput('');
  };

  // Remove a color chip and all its rows
  const handleRemoveColor = (colorToRemove: string) => {
    const updated = sizeBreakdowns.filter(
      (r) => (r.color || '').trim().toLowerCase() !== colorToRemove.toLowerCase()
    );
    setSizeBreakdowns(updated);
  };

  // Toggle a size pill
  const handleToggleSize = (sizeToToggle: string) => {
    const isCurrentlyActive = activeSizes.some(
      (s) => s.toLowerCase() === sizeToToggle.toLowerCase()
    );

    if (isCurrentlyActive) {
      const updated = sizeBreakdowns.filter(
        (r) => (r.size || '').trim().toLowerCase() !== sizeToToggle.toLowerCase()
      );
      setSizeBreakdowns(updated);
    } else {
      const colorsToUse = activeColors.length > 0 ? activeColors : ['Default'];
      const newSizes = [...activeSizes, sizeToToggle];
      regenerateMatrix(colorsToUse, newSizes);
    }
  };

  // Add custom size
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    handleToggleSize(trimmed);
    setCustomSizeInput('');
  };

  // Quick preset sizes: S-XL
  const handleApplyStandardSizes = () => {
    const colorsToUse = activeColors.length > 0 ? activeColors : ['Default'];
    regenerateMatrix(colorsToUse, ['S', 'M', 'L', 'XL']);
  };

  // Copy all Order Qty -> Inspected Qty
  const handleCopyOrderToInspected = () => {
    const updated = sizeBreakdowns.map((r) => ({
      ...r,
      inspected_qty: r.order_qty || 0,
    }));
    setSizeBreakdowns(updated);
  };

  const handleRowChange = (index: number, field: keyof FISizeBreakdown, value: any) => {
    const updated = [...sizeBreakdowns];
    updated[index] = {
      ...updated[index],
      [field]: field === 'order_qty' || field === 'inspected_qty' ? Number(value) || 0 : value,
    };
    setSizeBreakdowns(updated);
  };

  const handleRemoveRow = (index: number) => {
    setSizeBreakdowns(sizeBreakdowns.filter((_, i) => i !== index));
  };

  const totalOrderQty = sizeBreakdowns.reduce((sum, r) => sum + (r.order_qty || 0), 0);
  const totalInspectedQty = sizeBreakdowns.reduce((sum, r) => sum + (r.inspected_qty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">Size & Quantity Breakdown</h3>
          <p className="text-xs text-gray-500">
            Define colorways and sizes to automatically generate the inspection breakdown table
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sizeBreakdowns.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyOrderToInspected}
              className="text-xs h-8 gap-1 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
              title="Set all inspected quantities equal to order quantities"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" /> Copy Order Qty &rarr; Inspected
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyStandardSizes}
            className="text-xs h-8"
          >
            Standard (S-XL)
          </Button>
        </div>
      </div>

      {/* Builder Step 1: Colorways Tag Bar */}
      <div className="bg-gray-50/80 p-3 rounded-md border border-gray-200 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 w-20 shrink-0">1. Colors:</span>
          {activeColors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-gray-800 border border-gray-300 shadow-sm"
            >
              <span>{color}</span>
              <button
                type="button"
                onClick={() => handleRemoveColor(color)}
                className="text-gray-400 hover:text-red-500 rounded-full p-0.5"
                title={`Remove ${color}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="inline-flex items-center gap-1">
            <Input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddColor(colorInput);
                }
              }}
              placeholder="Type color & Enter (e.g. Olive)"
              className="h-7 w-48 text-xs bg-white"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddColor(colorInput)}
              disabled={!colorInput.trim()}
              className="h-7 px-2 text-xs bg-primary text-white"
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>

        {/* Preset colors suggestion pills */}
        <div className="flex flex-wrap items-center gap-1.5 pl-20">
          <span className="text-[11px] text-gray-400 font-medium">Quick presets:</span>
          {COLOR_PRESETS.map((p) => {
            const isAdded = activeColors.some((c) => c.toLowerCase() === p.toLowerCase());
            return (
              <button
                key={p}
                type="button"
                disabled={isAdded}
                onClick={() => handleAddColor(p)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded border transition-colors',
                  isAdded
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                )}
              >
                + {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Builder Step 2: Size Toggles */}
      <div className="bg-gray-50/80 p-3 rounded-md border border-gray-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-700 w-20 shrink-0">2. Sizes:</span>
        {COMMON_SIZES.map((size) => {
          const isActive = activeSizes.some((s) => s.toLowerCase() === size.toLowerCase());
          return (
            <button
              key={size}
              type="button"
              onClick={() => handleToggleSize(size)}
              className={cn(
                'px-3 py-1 text-xs rounded-full font-bold transition-all border shadow-sm',
                isActive
                  ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              {size} {isActive && '✓'}
            </button>
          );
        })}

        <div className="inline-flex items-center gap-1 ml-2">
          <Input
            value={customSizeInput}
            onChange={(e) => setCustomSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSize();
              }
            }}
            placeholder="Custom (e.g. 28)"
            className="h-7 w-28 text-xs bg-white"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddCustomSize}
            disabled={!customSizeInput.trim()}
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Step 3: Generated Matrix Table */}
      <SizeMatrixTable
        sizeBreakdowns={sizeBreakdowns}
        onRowChange={handleRowChange}
        onRemoveRow={handleRemoveRow}
        totalOrderQty={totalOrderQty}
        totalInspectedQty={totalInspectedQty}
      />
    </div>
  );
};
