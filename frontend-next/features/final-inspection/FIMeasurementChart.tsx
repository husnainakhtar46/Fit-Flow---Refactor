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
  append: (data: any) => void;
  remove: (index: number) => void;
  replace: (data: any[]) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  sampleCount: number;
  setSampleCount: (count: number) => void;
  templates: any[];
  watch: any;
}

export const FIMeasurementChart: React.FC<FIMeasurementChartProps> = ({
  fields,
  append,
  remove,
  replace,
  register,
  setValue,
  getValues,
  sampleCount,
  setSampleCount,
  templates,
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
  });

  const handleTemplateLoad = (templateId: string) => {
    if (!templateId) return;
    const template = templates.find((t) => String(t.id) === String(templateId));
    if (template && template.poms) {
      replace(
        template.poms.map((pom: any) => ({
          pom_name: pom.name || pom.pom_name || '',
          tol: pom.default_tol ?? pom.tol ?? 0,
          std: pom.default_std ?? pom.std ?? '',
          samples: Array.from({ length: sampleCount }, (_, i) => ({
            index: i + 1,
            value: '',
          })),
        }))
      );
    }
  };

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">Measurement Audit</h3>
          <p className="text-xs text-gray-500">
            Verify sample measurements against approved techpack specs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => handleTemplateLoad(e.target.value)}
            defaultValue=""
            className="h-8 px-2 border border-gray-300 rounded text-xs bg-white"
          >
            <option value="">-- Load Template POMs --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveSample}
            disabled={sampleCount <= 1}
            className="h-8 text-xs"
          >
            -
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
            className="h-8 text-xs"
          >
            +
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddPOM}
            className="h-8 text-xs gap-1 bg-primary text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Add POM
          </Button>
        </div>
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
                <TableHead key={i} className="w-24 text-center">
                  S{i + 1}
                </TableHead>
              ))}
              <TableHead className="w-10 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const std = watch(`measurements.${index}.std`);
              const tol = watch(`measurements.${index}.tol`);

              return (
                <TableRow key={field.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-center text-xs text-gray-500 font-medium">
                    {index + 1}
                  </TableCell>

                  <TableCell className="p-1">
                    <Input
                      {...register(`measurements.${index}.pom_name`)}
                      placeholder="POM Name"
                      data-grid-cell={getCellId(index, 'pom_name')}
                      className={cn(
                        'h-8 text-xs',
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
                        'h-8 text-xs',
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
                        'h-8 text-xs',
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
                            'h-8 text-xs text-center font-medium',
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
                      className="h-7 w-7 text-gray-400 hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
