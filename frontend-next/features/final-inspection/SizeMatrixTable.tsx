'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FISizeBreakdown } from './types';
import { cn } from '@/lib/utils';

interface SizeMatrixTableProps {
  sizeBreakdowns: FISizeBreakdown[];
  onRowChange: (index: number, field: keyof FISizeBreakdown, value: any) => void;
  onRemoveRow: (index: number) => void;
  totalOrderQty: number;
  totalInspectedQty: number;
}

export const SizeMatrixTable: React.FC<SizeMatrixTableProps> = ({
  sizeBreakdowns,
  onRowChange,
  onRemoveRow,
  totalOrderQty,
  totalInspectedQty,
}) => {
  if (sizeBreakdowns.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          Add at least one color above and toggle sizes to generate the breakdown table.
        </p>
      </div>
    );
  }

  const diffTotal = totalInspectedQty - totalOrderQty;

  return (
    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="p-2 text-left font-semibold text-gray-600">Color</th>
            <th className="p-2 text-left font-semibold text-gray-600 w-24">Size</th>
            <th className="p-2 text-right font-semibold text-gray-600 w-36">Order Qty</th>
            <th className="p-2 text-right font-semibold text-gray-600 w-36">Inspected Qty</th>
            <th className="p-2 text-center font-semibold text-gray-600 w-24">Diff</th>
            <th className="p-2 text-center font-semibold text-gray-600 w-12">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sizeBreakdowns.map((row, index) => {
            const diff = (row.inspected_qty || 0) - (row.order_qty || 0);
            return (
              <tr key={index} className="hover:bg-gray-50/50">
                <td className="p-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-md font-semibold text-xs bg-blue-50 text-blue-800 border border-blue-200">
                    {row.color || 'Default'}
                  </span>
                </td>
                <td className="p-2">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                    {row.size}
                  </span>
                </td>
                <td className="p-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={row.order_qty || ''}
                    onChange={(e) => onRowChange(index, 'order_qty', e.target.value)}
                    placeholder="0"
                    className="h-8 text-xs text-right"
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={row.inspected_qty || ''}
                    onChange={(e) => onRowChange(index, 'inspected_qty', e.target.value)}
                    placeholder="0"
                    className="h-8 text-xs text-right font-semibold text-primary"
                  />
                </td>
                <td className="p-2 text-center font-medium">
                  <span
                    className={cn(
                      'text-xs',
                      diff === 0 ? 'text-gray-400' : diff > 0 ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                </td>
                <td className="p-1.5 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveRow(index)}
                    className="h-7 w-7 text-gray-400 hover:text-red-600"
                    title="Remove this size/color combination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t font-semibold">
          <tr>
            <td colSpan={2} className="p-2.5 text-right text-gray-700">
              Total Quantities:
            </td>
            <td className="p-2.5 text-right text-gray-900 font-bold">
              {totalOrderQty.toLocaleString()}
            </td>
            <td className="p-2.5 text-right text-primary font-bold">
              {totalInspectedQty.toLocaleString()}
            </td>
            <td className="p-2.5 text-center text-xs text-gray-500">
              {diffTotal !== 0 ? (
                <span className={diffTotal > 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {diffTotal > 0 ? `+${diffTotal}` : diffTotal}
                </span>
              ) : (
                <span className="text-emerald-600 font-bold">Exact</span>
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
