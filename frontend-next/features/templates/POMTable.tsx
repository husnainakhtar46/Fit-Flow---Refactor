'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { POM } from './types';

interface POMTableProps {
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export const POMTable: React.FC<POMTableProps> = ({
  fields,
  append,
  remove,
  register,
  setValue,
  getValues,
}) => {
  const handlePaste =
    (rowIndex: number, startColumn: 'name' | 'default_tol') =>
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedData = event.clipboardData.getData('text');
      const lines = pastedData.split('\n').filter((l) => l.trim());

      if (lines.length > 0) {
        event.preventDefault();
        const currentPoms = getValues('poms');
        const columnOrder = ['name', 'default_tol'];
        const startColIndex = columnOrder.indexOf(startColumn);

        const hasHeader = /pom|name|tolerance|tol/i.test(lines[0]);
        const dataRows = hasHeader ? lines.slice(1) : lines;
        const newItems: POM[] = [];

        dataRows.forEach((line, rowOffset) => {
          const targetRow = rowIndex + rowOffset;
          const columns = line.split('\t');

          if (targetRow < currentPoms.length) {
            columns.forEach((value, colOffset) => {
              const targetColIndex = startColIndex + colOffset;
              if (targetColIndex === 0) setValue(`poms.${targetRow}.name`, value.trim());
              if (targetColIndex === 1)
                setValue(`poms.${targetRow}.default_tol`, parseFloat(value.trim()) || 0);
            });
          } else {
            const newIndex = targetRow - currentPoms.length;
            if (!newItems[newIndex]) newItems[newIndex] = { name: '', default_tol: 0 };

            columns.forEach((value, colOffset) => {
              const targetColIndex = startColIndex + colOffset;
              if (targetColIndex === 0) newItems[newIndex].name = value.trim();
              if (targetColIndex === 1)
                newItems[newIndex].default_tol = parseFloat(value.trim()) || 0;
            });
          }
        });

        if (newItems.length > 0) {
          append(newItems);
        }

        toast.success(`Pasted ${dataRows.length} rows!`);
      }
    };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-gray-700">
          Points of Measure (POMs)
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ name: '', default_tol: 0 })}
          className="h-7 text-xs gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Row
        </Button>
      </div>

      <div className="border rounded-md max-h-60 overflow-y-auto bg-white">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-600">POM Name</th>
              <th className="p-2 text-left font-semibold text-gray-600 w-24">Default Tol</th>
              <th className="p-2 text-center font-semibold text-gray-600 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.map((field, index) => (
              <tr key={field.id} className="hover:bg-gray-50/50">
                <td className="p-1">
                  <Input
                    {...register(`poms.${index}.name` as const)}
                    placeholder="e.g. Chest Width"
                    className="h-7 text-xs"
                    onPaste={handlePaste(index, 'name')}
                  />
                </td>
                <td className="p-1">
                  <Input
                    type="number"
                    step="any"
                    {...register(`poms.${index}.default_tol` as const)}
                    placeholder="0.5"
                    className="h-7 text-xs"
                    onPaste={handlePaste(index, 'default_tol')}
                  />
                </td>
                <td className="p-1 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="h-7 w-7 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
