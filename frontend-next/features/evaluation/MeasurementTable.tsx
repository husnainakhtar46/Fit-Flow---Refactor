'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMeasurementGrid } from './useMeasurementGrid';
import { cn } from '@/lib/utils';

interface MeasurementTableProps {
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  sampleCount: number;
  setSampleCount: (count: number) => void;
  watch: any;
}

export const MeasurementTable: React.FC<MeasurementTableProps> = ({
  fields,
  append,
  remove,
  register,
  setValue,
  getValues,
  sampleCount,
  setSampleCount,
  watch,
}) => {
  const {
    isSelected,
    getCellId,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellKeyDown,
    handleMeasurementPaste,
    handleCopy,
    checkTol,
  } = useMeasurementGrid({
    sampleCount,
    setValue,
    getValues,
    fields,
  });

  const handleAddSample = () => {
    if (sampleCount < 10) {
      const nextIdx = sampleCount;
      setSampleCount(sampleCount + 1);
      fields.forEach((_, rIdx) => {
        setValue(`measurements.${rIdx}.samples.${nextIdx}.index`, nextIdx + 1);
        setValue(`measurements.${rIdx}.samples.${nextIdx}.value`, '');
      });
    }
  };

  const handleRemoveSample = () => {
    if (sampleCount > 1) {
      setSampleCount(sampleCount - 1);
    }
  };

  const handleAddPOM = () => {
    append({
      pom_name: '',
      tol: 0,
      std: '',
      samples: Array.from({ length: sampleCount }, (_, i) => ({
        index: i + 1,
        value: '',
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">Measurements</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveSample}
            disabled={sampleCount <= 1}
          >
            - Sample
          </Button>
          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded">
            {sampleCount} Samples
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSample}
            disabled={sampleCount >= 10}
          >
            + Sample
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddPOM}
            className="bg-primary text-white gap-1"
          >
            <Plus className="w-4 h-4" /> Add POM
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md mobile-table-scroll">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="min-w-[180px]">Point of Measure (POM)</TableHead>
              <TableHead className="w-20">Tol (+/-)</TableHead>
              <TableHead className="w-20">Standard</TableHead>
              {Array.from({ length: sampleCount }, (_, i) => (
                <TableHead key={i} className="w-24 text-center">
                  Sample {i + 1}
                </TableHead>
              ))}
              <TableHead className="w-12 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const std = watch(`measurements.${index}.std`);
              const tol = watch(`measurements.${index}.tol`);

              return (
                <TableRow key={field.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-center font-medium text-gray-500 text-xs">
                    {index + 1}
                  </TableCell>

                  <TableCell className="p-1">
                    <Input
                      {...register(`measurements.${index}.pom_name`)}
                      placeholder="POM Name"
                      data-grid-cell={getCellId(index, 'pom_name')}
                      className={cn(
                        'h-9 text-xs',
                        isSelected(index, 'pom_name') && 'ring-2 ring-blue-500 bg-blue-50/30'
                      )}
                      onMouseDown={() => handleCellMouseDown(index, 'pom_name')}
                      onMouseEnter={() => handleCellMouseEnter(index, 'pom_name')}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'pom_name')}
                      onPaste={handleMeasurementPaste(index, 'pom_name')}
                      onCopy={handleCopy}
                    />
                  </TableCell>

                  <TableCell className="p-1">
                    <Input
                      type="number"
                      step="any"
                      {...register(`measurements.${index}.tol`)}
                      placeholder="0.5"
                      data-grid-cell={getCellId(index, 'tol')}
                      className={cn(
                        'h-9 text-xs',
                        isSelected(index, 'tol') && 'ring-2 ring-blue-500 bg-blue-50/30'
                      )}
                      onMouseDown={() => handleCellMouseDown(index, 'tol')}
                      onMouseEnter={() => handleCellMouseEnter(index, 'tol')}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'tol')}
                      onPaste={handleMeasurementPaste(index, 'tol')}
                      onCopy={handleCopy}
                    />
                  </TableCell>

                  <TableCell className="p-1">
                    <Input
                      type="number"
                      step="any"
                      {...register(`measurements.${index}.std`)}
                      placeholder="Std"
                      data-grid-cell={getCellId(index, 'std')}
                      className={cn(
                        'h-9 text-xs',
                        isSelected(index, 'std') && 'ring-2 ring-blue-500 bg-blue-50/30'
                      )}
                      onMouseDown={() => handleCellMouseDown(index, 'std')}
                      onMouseEnter={() => handleCellMouseEnter(index, 'std')}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'std')}
                      onPaste={handleMeasurementPaste(index, 'std')}
                      onCopy={handleCopy}
                    />
                  </TableCell>

                  {Array.from({ length: sampleCount }, (_, sIdx) => {
                    const sampleKey = `sample_${sIdx + 1}`;
                    const sampleVal = watch(`measurements.${index}.samples.${sIdx}.value`);
                    const isFail = checkTol(sampleVal, std, tol);

                    return (
                      <TableCell key={sIdx} className="p-1">
                        <Input
                          type="number"
                          step="any"
                          {...register(`measurements.${index}.samples.${sIdx}.value`)}
                          placeholder="-"
                          data-grid-cell={getCellId(index, sampleKey)}
                          className={cn(
                            'h-9 text-xs text-center font-medium',
                            isFail && 'border-red-500 bg-red-50 text-red-700 font-bold',
                            isSelected(index, sampleKey) && 'ring-2 ring-blue-500 bg-blue-50/30'
                          )}
                          onMouseDown={() => handleCellMouseDown(index, sampleKey)}
                          onMouseEnter={() => handleCellMouseEnter(index, sampleKey)}
                          onKeyDown={(e) => handleCellKeyDown(e, index, sampleKey)}
                          onPaste={handleMeasurementPaste(index, sampleKey)}
                          onCopy={handleCopy}
                        />
                      </TableCell>
                    );
                  })}

                  <TableCell className="text-center p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
