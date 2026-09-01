'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FISizeBreakdown } from './types';
import { SizeColorRow } from './SizeColorRow';
import { SizeMatrixTable } from './SizeMatrixTable';

interface SizeBreakdownProps {
  sizeBreakdowns: FISizeBreakdown[];
  setSizeBreakdowns: React.Dispatch<React.SetStateAction<FISizeBreakdown[]>>;
}

export const SizeBreakdown: React.FC<SizeBreakdownProps> = ({
  sizeBreakdowns,
  setSizeBreakdowns,
}) => {
  const [colorInput, setColorInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');

  // Master pool of sizes defined for this garment style
  const [masterSizes, setMasterSizes] = useState<string[]>(() => {
    const raw = sizeBreakdowns.map((r) => (r.size || '').trim()).filter(Boolean);
    return Array.from(new Set(raw));
  });

  // Map of colorway -> active sizes for that colorway
  const [colorSizeMap, setColorSizeMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    sizeBreakdowns.forEach((r) => {
      const c = (r.color || '').trim() || 'Default';
      const s = (r.size || '').trim();
      if (!s) return;
      if (!map[c]) map[c] = [];
      if (!map[c].includes(s)) map[c].push(s);
    });
    return map;
  });

  // Cache entered quantities to preserve them during size/color toggling
  const qtyMap = useRef<Map<string, { order_qty: number; inspected_qty: number; id?: string }>>(
    new Map()
  );

  // Sync qtyMap from incoming sizeBreakdowns (initial load / edits)
  useEffect(() => {
    sizeBreakdowns.forEach((r) => {
      const k = `${(r.color || '').trim().toLowerCase()}|${(r.size || '').trim().toLowerCase()}`;
      qtyMap.current.set(k, {
        order_qty: r.order_qty || 0,
        inspected_qty: r.inspected_qty || 0,
        id: r.id,
      });
    });
  }, [sizeBreakdowns]);

  // Handle asynchronous hydration (e.g. when editing a saved inspection)
  useEffect(() => {
    if (Object.keys(colorSizeMap).length === 0 && sizeBreakdowns.length > 0) {
      const map: Record<string, string[]> = {};
      const sizes: string[] = [];
      sizeBreakdowns.forEach((r) => {
        const c = (r.color || '').trim() || 'Default';
        const s = (r.size || '').trim();
        if (!s) return;
        if (!map[c]) map[c] = [];
        if (!map[c].includes(s)) map[c].push(s);
        if (!sizes.includes(s)) sizes.push(s);
      });
      setColorSizeMap(map);
      setMasterSizes(sizes);
    }
  }, [sizeBreakdowns, colorSizeMap]);

  // Derives sizeBreakdowns flat rows from colorSizeMap + cached quantities
  const applyMapUpdate = useCallback(
    (newMap: Record<string, string[]>) => {
      setColorSizeMap(newMap);
      const newRows: FISizeBreakdown[] = [];
      Object.entries(newMap).forEach(([color, sizes]) => {
        sizes.forEach((size) => {
          const k = `${color.trim().toLowerCase()}|${size.trim().toLowerCase()}`;
          const existing = qtyMap.current.get(k);
          newRows.push({
            id: existing?.id,
            color: color.trim(),
            size: size.trim(),
            order_qty: existing?.order_qty ?? 0,
            inspected_qty: existing?.inspected_qty ?? 0,
          });
        });
      });
      setSizeBreakdowns(newRows);
    },
    [setSizeBreakdowns]
  );

  // Add a new color chip
  const handleAddColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    if (Object.keys(colorSizeMap).some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setColorInput('');
      return;
    }
    // If we have a dummy 'Default' color and user adds first real color, replace it
    const updatedMap = { ...colorSizeMap };
    if (Object.keys(updatedMap).length === 1 && updatedMap['Default']) {
      delete updatedMap['Default'];
    }
    updatedMap[trimmed] = masterSizes.length > 0 ? [...masterSizes] : [];
    applyMapUpdate(updatedMap);
    setColorInput('');
  };

  // Remove a color chip and its associated rows
  const handleRemoveColor = (colorToRemove: string) => {
    const updatedMap = { ...colorSizeMap };
    delete updatedMap[colorToRemove];
    applyMapUpdate(updatedMap);
  };

  // Add comma-separated sizes to master pool and all active colors
  const handleAddMasterSizes = () => {
    if (!sizesInput.trim()) return;
    const parsed = sizesInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (parsed.length === 0) return;

    // Append new sizes to master pool
    const newMaster = [...masterSizes];
    parsed.forEach((s) => {
      if (!newMaster.includes(s)) newMaster.push(s);
    });
    setMasterSizes(newMaster);

    // Apply to colors
    const colors = Object.keys(colorSizeMap);
    if (colors.length === 0) {
      applyMapUpdate({ Default: parsed });
    } else {
      const updatedMap: Record<string, string[]> = {};
      colors.forEach((c) => {
        const currentSizes = colorSizeMap[c] || [];
        const combined = [...currentSizes];
        parsed.forEach((s) => {
          if (!combined.includes(s)) combined.push(s);
        });
        updatedMap[c] = combined;
      });
      applyMapUpdate(updatedMap);
    }
    setSizesInput('');
  };

  // Toggle a size on/off for a specific color
  const handleToggleColorSize = (color: string, size: string) => {
    const currentSizes = colorSizeMap[color] || [];
    const isCurrentlyActive = currentSizes.includes(size);
    const updatedSizes = isCurrentlyActive
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];

    applyMapUpdate({
      ...colorSizeMap,
      [color]: updatedSizes,
    });
  };

  // Add a unique size specifically to one color
  const handleAddColorSize = (color: string, size: string) => {
    if (!masterSizes.includes(size)) {
      setMasterSizes((prev) => [...prev, size]);
    }
    const currentSizes = colorSizeMap[color] || [];
    if (!currentSizes.includes(size)) {
      applyMapUpdate({
        ...colorSizeMap,
        [color]: [...currentSizes, size],
      });
    }
  };

  // Handle cell edits in table
  const handleRowChange = (index: number, field: keyof FISizeBreakdown, value: any) => {
    const updated = [...sizeBreakdowns];
    const val = field === 'order_qty' || field === 'inspected_qty' ? Number(value) || 0 : value;
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    const row = updated[index];
    const k = `${(row.color || '').trim().toLowerCase()}|${(row.size || '').trim().toLowerCase()}`;
    qtyMap.current.set(k, {
      order_qty: row.order_qty || 0,
      inspected_qty: row.inspected_qty || 0,
      id: row.id,
    });
    setSizeBreakdowns(updated);
  };

  // Removing a row in table deselects that size for that color
  const handleRemoveRow = (index: number) => {
    const row = sizeBreakdowns[index];
    if (!row) return;
    const color = row.color || 'Default';
    handleToggleColorSize(color, row.size);
  };

  const activeColors = Object.keys(colorSizeMap);
  const totalOrderQty = sizeBreakdowns.reduce((sum, r) => sum + (r.order_qty || 0), 0);
  const totalInspectedQty = sizeBreakdowns.reduce((sum, r) => sum + (r.inspected_qty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="border-b pb-2">
        <h3 className="text-base font-bold text-gray-900">Size & Quantity Breakdown</h3>
        <p className="text-xs text-gray-500">
          Add colorways and enter sizes to automatically generate the breakdown matrix
        </p>
      </div>

      {/* Step 1: Colorways Input */}
      <div className="bg-gray-50/80 p-3 rounded-md border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 w-24 shrink-0">1. Colors:</span>
          {activeColors
            .filter((c) => c !== 'Default')
            .map((color) => (
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
      </div>

      {/* Step 2: Comma-Separated Sizes Entry & Per-Color Toggles */}
      <div className="bg-gray-50/80 p-3 rounded-md border border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 w-24 shrink-0">2. Add Sizes:</span>
          <div className="flex-1 flex items-center gap-1.5 max-w-xl">
            <Input
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMasterSizes();
                }
              }}
              placeholder="Enter sizes comma-separated (e.g. S, M, L, XL or 28, 30, 32)"
              className="h-7 text-xs bg-white flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddMasterSizes}
              disabled={!sizesInput.trim()}
              className="h-7 px-2.5 text-xs bg-primary text-white shrink-0"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Sizes
            </Button>
          </div>
        </div>

        {/* Per-Color Size Toggles */}
        {activeColors.length > 0 && masterSizes.length > 0 && (
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="text-[11px] font-semibold text-gray-500 mb-1">
              Sizes per color (click any pill to toggle on/off for that color):
            </div>
            {activeColors.map((color) => (
              <SizeColorRow
                key={color}
                color={color}
                masterSizes={masterSizes}
                activeSizes={colorSizeMap[color] || []}
                onToggleSize={handleToggleColorSize}
                onAddColorSize={handleAddColorSize}
              />
            ))}
          </div>
        )}
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
