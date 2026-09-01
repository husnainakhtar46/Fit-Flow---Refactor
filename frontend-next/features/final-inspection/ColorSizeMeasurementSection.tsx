'use client';

import React, { useState, useEffect } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Copy, Sparkles, CheckCircle2, AlertCircle, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FISizeBreakdown } from './types';
import { FIMeasurementChart } from './FIMeasurementChart';
import { useMeasurementGroups, GroupStatus } from './useMeasurementGroups';
import { cn } from '@/lib/utils';

interface ColorSizeMeasurementSectionProps {
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  replace: (data: any[]) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  sampleCount: number;
  templates: any[];
  watch: any;
  sizeBreakdowns: FISizeBreakdown[];
  defaultColor?: string;
}

export const ColorSizeMeasurementSection: React.FC<ColorSizeMeasurementSectionProps> = ({
  fields,
  append,
  remove,
  replace,
  register,
  setValue,
  getValues,
  sampleCount,
  templates,
  watch,
  sizeBreakdowns,
  defaultColor,
}) => {
  const [activeColor, setActiveColor] = useState<string>('');
  const [activeSize, setActiveSize] = useState<string>('');

  const {
    colorList,
    sizesByColor,
    activeRowIndices,
    getGroupStatus,
    autoInheritPOMs,
    mirrorSpecsToAllColors,
    applyTemplateToAll,
  } = useMeasurementGroups({
    fields,
    sizeBreakdowns,
    defaultColor,
    activeColor,
    activeSize,
    setValue,
    getValues,
    append,
    replace,
    sampleCount,
  });

  // Ensure activeColor and activeSize default to available options
  useEffect(() => {
    if (colorList.length > 0 && (!activeColor || !colorList.includes(activeColor))) {
      setActiveColor(colorList[0]);
    }
  }, [colorList, activeColor]);

  useEffect(() => {
    const currentSizes = sizesByColor[activeColor] || [];
    if (currentSizes.length > 0 && (!activeSize || !currentSizes.includes(activeSize))) {
      setActiveSize(currentSizes[0]);
    }
  }, [sizesByColor, activeColor, activeSize]);

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) return;
    const template = templates.find((t) => String(t.id) === String(templateId));
    if (template && template.poms) {
      applyTemplateToAll(template.poms);
    }
  };

  const renderStatusIcon = (status: GroupStatus) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />;
      case 'fail':
        return <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />;
      default:
        return <CircleDashed className="w-3 h-3 text-gray-300 shrink-0" />;
    }
  };

  const currentSizes = sizesByColor[activeColor] || ['M'];

  return (
    <div className="space-y-4">
      {/* Header & Global Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Measurement Audit</h3>
          <p className="text-xs text-gray-500">
            Verify sample measurements per colorway and size against approved specs (5 samples each)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template loader */}
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            defaultValue=""
            className="h-8 px-2.5 border border-gray-300 rounded text-xs bg-white text-gray-700 font-medium hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Apply Template to All Sizes --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Mirror Specs */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={mirrorSpecsToAllColors}
            className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/70"
            title={`Mirror specs from ${activeColor} (${activeSize}) to other colors`}
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" /> Mirror Specs
          </Button>

          {/* Auto-inherit POM structure */}
          {activeRowIndices.length === 0 && fields.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={autoInheritPOMs}
              className="h-8 text-xs gap-1.5 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100/70"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Inherit POMs
            </Button>
          )}
        </div>
      </div>

      {/* Level 1: Color Tabs */}
      <div className="flex items-center gap-1 border-b pb-1 overflow-x-auto">
        <span className="text-xs font-semibold text-gray-500 mr-2 shrink-0">Colorway:</span>
        {colorList.map((color) => {
          const isActive = color.toLowerCase() === activeColor.toLowerCase();
          const count = sizesByColor[color]?.length || 0;
          return (
            <button
              key={color}
              type="button"
              onClick={() => setActiveColor(color)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1.5 border-b-2',
                isActive
                  ? 'border-primary text-primary bg-blue-50/40 font-bold'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              )}
            >
              <span>{color}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-medium',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
                )}
              >
                {count} {count === 1 ? 'size' : 'sizes'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Level 2: Size Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-50/70 p-2 rounded-md border border-gray-100">
        <span className="text-xs font-semibold text-gray-500 mr-1">Select Size:</span>
        {currentSizes.map((size) => {
          const isActive = size.toLowerCase() === activeSize.toLowerCase();
          const status = getGroupStatus(activeColor, size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => setActiveSize(size)}
              className={cn(
                'px-3 py-1 text-xs rounded-full font-semibold transition-all flex items-center gap-1.5 border shadow-sm',
                isActive
                  ? 'bg-primary text-white border-primary ring-2 ring-primary/20 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {renderStatusIcon(status)}
              <span>Size {size}</span>
            </button>
          );
        })}
      </div>

      {/* Level 3: Active Chart Grid */}
      {activeColor && activeSize && (
        <FIMeasurementChart
          fields={fields}
          activeRowIndices={activeRowIndices}
          activeColor={activeColor}
          activeSize={activeSize}
          append={append}
          remove={remove}
          register={register}
          setValue={setValue}
          getValues={getValues}
          sampleCount={sampleCount}
          watch={watch}
        />
      )}
    </div>
  );
};
