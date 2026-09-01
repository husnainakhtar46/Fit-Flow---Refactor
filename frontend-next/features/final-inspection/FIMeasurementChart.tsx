'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFIGrid } from './useFIGrid';
import { cn } from '@/lib/utils';

interface FIMeasurementChartProps {
  fields: any[];
  activeRowIndices: number[];
  activeColor: string;
  activeSize: string;
  append: (data: any) => void;
  remove: (index: number) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  sampleCount: number;
  watch: any;
}

export const FIMeasurementChart: React.FC<FIMeasurementChartProps> = ({
  fields,
  activeRowIndices,
  activeColor,
  activeSize,
  append,
  remove,
  register,
  setValue,
  getValues,
  sampleCount,
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
  } = useFIGrid({
    sampleCount,
    setValue,
    getValues,
    fields,
    rowIndices: activeRowIndices,
  });

  const handleAddPOM = () => {
    append({
      color: activeColor,
      size_name: activeSize,
      pom_name: '',
      tol: 0.5,
      std: '',
      samples: Array.from({ length: sampleCount }, (_, i) => ({
        index: i + 1,
        value: '',
      })),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-800">{activeRowIndices.length}</span> POM(s) for{' '}
          <span className="font-semibold text-primary">{activeColor}</span> &mdash; Size{' '}
          <span className="font-semibold text-primary">{activeSize}</span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleAddPOM}
          className="h-7 text-xs gap-1 bg-primary text-white"
        >
          <Plus className="w-3 h-3" /> Add POM
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-md mobile-table-scroll bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="min-w-[180px]">Point of Measure (POM)</TableHead>
              <TableHead className="w-20">Tol (+/-)</TableHead>
              <TableHead className="w-20">Standard</TableHead>
              {Array.from({ length: sampleCount }, (_, i) => (
                <TableHead key={i} className="w-20 text-center">
                  S{i + 1}
                </TableHead>
              ))}
              <TableHead className="w-10 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeRowIndices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4 + sampleCount + 1}
                  className="text-center py-6 text-gray-400 text-xs italic"
                >
                  No POM measurements for {activeColor} ({activeSize}) yet. Click &quot;Add POM&quot; or auto-inherit structure.
                </TableCell>
              </TableRow>
            ) : (
              activeRowIndices.map((globalIndex, displayIndex) => {
                const field = fields[globalIndex];
                const std = watch(`measurements.${globalIndex}.std`);
                const tol = watch(`measurements.${globalIndex}.tol`);

                return (
                  <TableRow key={field?.id || globalIndex} className="hover:bg-gray-50/50">
                    <TableCell className="text-center text-xs text-gray-500 font-medium">
                      {displayIndex + 1}
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        {...register(`measurements.${globalIndex}.pom_name`)}
                        placeholder="POM Name"
                        data-grid-cell={getCellId(displayIndex, 'pom_name')}
                        className={cn(
                          'h-8 text-xs',
                          isSelected(displayIndex, 'pom_name') && 'ring-2 ring-blue-500 bg-blue-50/30'
                        )}
                        onMouseDown={() => handleCellMouseDown(displayIndex, 'pom_name')}
                        onMouseEnter={() => handleCellMouseEnter(displayIndex, 'pom_name')}
                        onKeyDown={(e) => handleCellKeyDown(e, displayIndex, 'pom_name')}
                        onPaste={handleMeasurementPaste(displayIndex, 'pom_name')}
                        onCopy={handleCopy}
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="any"
                        {...register(`measurements.${globalIndex}.tol`)}
                        placeholder="0.5"
                        data-grid-cell={getCellId(displayIndex, 'tol')}
                        className={cn(
                          'h-8 text-xs',
                          isSelected(displayIndex, 'tol') && 'ring-2 ring-blue-500 bg-blue-50/30'
                        )}
                        onMouseDown={() => handleCellMouseDown(displayIndex, 'tol')}
                        onMouseEnter={() => handleCellMouseEnter(displayIndex, 'tol')}
                        onKeyDown={(e) => handleCellKeyDown(e, displayIndex, 'tol')}
                        onPaste={handleMeasurementPaste(displayIndex, 'tol')}
                        onCopy={handleCopy}
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="number"
                        step="any"
                        {...register(`measurements.${globalIndex}.std`)}
                        placeholder="Std"
                        data-grid-cell={getCellId(displayIndex, 'std')}
                        className={cn(
                          'h-8 text-xs',
                          isSelected(displayIndex, 'std') && 'ring-2 ring-blue-500 bg-blue-50/30'
                        )}
                        onMouseDown={() => handleCellMouseDown(displayIndex, 'std')}
                        onMouseEnter={() => handleCellMouseEnter(displayIndex, 'std')}
                        onKeyDown={(e) => handleCellKeyDown(e, displayIndex, 'std')}
                        onPaste={handleMeasurementPaste(displayIndex, 'std')}
                        onCopy={handleCopy}
                      />
                    </TableCell>

                    {Array.from({ length: sampleCount }, (_, sIdx) => {
                      const sampleKey = `sample_${sIdx + 1}`;
                      const sampleVal = watch(`measurements.${globalIndex}.samples.${sIdx}.value`);
                      const isFail = checkTol(sampleVal, std, tol);

                      return (
                        <TableCell key={sIdx} className="p-1">
                          <Input
                            type="number"
                            step="any"
                            {...register(`measurements.${globalIndex}.samples.${sIdx}.value`)}
                            placeholder="-"
                            data-grid-cell={getCellId(displayIndex, sampleKey)}
                            className={cn(
                              'h-8 text-xs text-center font-medium',
                              isFail && 'border-red-500 bg-red-50 text-red-700 font-bold',
                              isSelected(displayIndex, sampleKey) && 'ring-2 ring-blue-500 bg-blue-50/30'
                            )}
                            onMouseDown={() => handleCellMouseDown(displayIndex, sampleKey)}
                            onMouseEnter={() => handleCellMouseEnter(displayIndex, sampleKey)}
                            onKeyDown={(e) => handleCellKeyDown(e, displayIndex, sampleKey)}
                            onPaste={handleMeasurementPaste(displayIndex, sampleKey)}
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
                        className="h-7 w-7 text-gray-400 hover:text-red-600"
                        onClick={() => remove(globalIndex)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
