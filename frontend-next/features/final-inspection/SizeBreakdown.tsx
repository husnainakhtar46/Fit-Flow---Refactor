'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FISizeBreakdown } from './types';

interface SizeBreakdownProps {
  sizeBreakdowns: FISizeBreakdown[];
  setSizeBreakdowns: React.Dispatch<React.SetStateAction<FISizeBreakdown[]>>;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export const SizeBreakdown: React.FC<SizeBreakdownProps> = ({
  sizeBreakdowns,
  setSizeBreakdowns,
}) => {
  const handleAddRow = () => {
    setSizeBreakdowns([
      ...sizeBreakdowns,
      { color: '', size: 'M', order_qty: 0, inspected_qty: 0 },
    ]);
  };

  const handleAddDefaultSizes = () => {
    const defaultRows: FISizeBreakdown[] = ['S', 'M', 'L', 'XL'].map((s) => ({
      color: '',
      size: s,
      order_qty: 0,
      inspected_qty: 0,
    }));
    setSizeBreakdowns([...sizeBreakdowns, ...defaultRows]);
  };

  const handleRemove = (index: number) => {
    setSizeBreakdowns(sizeBreakdowns.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof FISizeBreakdown, value: any) => {
    const updated = [...sizeBreakdowns];
    updated[index] = {
      ...updated[index],
      [field]: field === 'order_qty' || field === 'inspected_qty' ? Number(value) || 0 : value,
    };
    setSizeBreakdowns(updated);
  };

  const totalOrderQty = sizeBreakdowns.reduce((sum, r) => sum + (r.order_qty || 0), 0);
  const totalInspectedQty = sizeBreakdowns.reduce((sum, r) => sum + (r.inspected_qty || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">Size & Quantity Breakdown</h3>
          <p className="text-xs text-gray-500">Breakdown of inspected units per color/size</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDefaultSizes}
            className="text-xs h-8"
          >
            + Add Standard Sizes (S-XL)
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddRow}
            className="text-xs h-8 gap-1 bg-primary text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Add Size
          </Button>
        </div>
      </div>

      {sizeBreakdowns.length > 0 ? (
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-2 text-left font-semibold text-gray-600">Color</th>
                <th className="p-2 text-left font-semibold text-gray-600 w-28">Size</th>
                <th className="p-2 text-right font-semibold text-gray-600 w-32">Order Qty</th>
                <th className="p-2 text-right font-semibold text-gray-600 w-32">Inspected Qty</th>
                <th className="p-2 text-center font-semibold text-gray-600 w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sizeBreakdowns.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50/50">
                  <td className="p-1.5">
                    <Input
                      value={row.color}
                      onChange={(e) => handleChange(index, 'color', e.target.value)}
                      placeholder="Color"
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      value={row.size}
                      onChange={(e) => handleChange(index, 'size', e.target.value)}
                      placeholder="Size (e.g. L)"
                      className="h-8 text-xs font-semibold"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number"
                      value={row.order_qty || ''}
                      onChange={(e) => handleChange(index, 'order_qty', e.target.value)}
                      placeholder="0"
                      className="h-8 text-xs text-right"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number"
                      value={row.inspected_qty || ''}
                      onChange={(e) => handleChange(index, 'inspected_qty', e.target.value)}
                      placeholder="0"
                      className="h-8 text-xs text-right font-semibold"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(index)}
                      className="h-7 w-7 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={2} className="p-2 text-right text-gray-700">
                  Total Quantities:
                </td>
                <td className="p-2 text-right text-gray-900">{totalOrderQty.toLocaleString()}</td>
                <td className="p-2 text-right text-blue-700 font-bold">
                  {totalInspectedQty.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic py-2">No size breakdown added yet.</p>
      )}
    </div>
  );
};
