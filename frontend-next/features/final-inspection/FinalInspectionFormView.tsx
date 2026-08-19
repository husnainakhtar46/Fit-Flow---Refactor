'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GeneralInfoSection } from './GeneralInfoSection';
import { SizeBreakdown } from './SizeBreakdown';
import { FIMeasurementChart } from './FIMeasurementChart';
import { DefectSection } from './DefectSection';
import { FIShipmentRemarks } from './FIShipmentRemarks';
import { FIDefect, FISizeBreakdown } from './types';

interface FinalInspectionFormViewProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  watch: any;
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  replace: (data: any[]) => void;
  sampleCount: number;
  setSampleCount: (count: number) => void;
  defects: FIDefect[];
  setDefects: React.Dispatch<React.SetStateAction<FIDefect[]>>;
  sizeBreakdowns: FISizeBreakdown[];
  setSizeBreakdowns: React.Dispatch<React.SetStateAction<FISizeBreakdown[]>>;
  defectImages: any[];
  setDefectImages: React.Dispatch<React.SetStateAction<any[]>>;
  factories: any[];
  customers: any[];
  templates: any[];
  aqlCalculations: any;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const FinalInspectionFormView: React.FC<FinalInspectionFormViewProps> = ({
  isOpen,
  onClose,
  editingId,
  register,
  setValue,
  getValues,
  watch,
  fields,
  append,
  remove,
  replace,
  sampleCount,
  setSampleCount,
  defects,
  setDefects,
  sizeBreakdowns,
  setSizeBreakdowns,
  defectImages,
  setDefectImages,
  factories,
  customers,
  templates,
  aqlCalculations,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingId ? 'Edit Final Inspection' : 'New Final Inspection Report'}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Conduct ISO 2859-1 / AQL 2.5 final garment inspection
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* General Information & AQL Scope */}
          <GeneralInfoSection
            register={register}
            setValue={setValue}
            watch={watch}
            customers={customers}
            factories={factories}
            aqlCalculations={aqlCalculations}
          />

          <hr />

          {/* Size Breakdown */}
          <SizeBreakdown
            sizeBreakdowns={sizeBreakdowns}
            setSizeBreakdowns={setSizeBreakdowns}
          />

          <hr />

          {/* Measurement Audit */}
          <FIMeasurementChart
            fields={fields}
            append={append}
            remove={remove}
            replace={replace}
            register={register}
            setValue={setValue}
            getValues={getValues}
            sampleCount={sampleCount}
            setSampleCount={setSampleCount}
            templates={templates}
            watch={watch}
          />

          <hr />

          {/* Defects & AQL Verdict */}
          <DefectSection
            defects={defects}
            setDefects={setDefects}
            defectImages={defectImages}
            setDefectImages={setDefectImages}
            aqlCalculations={aqlCalculations}
          />

          <hr />

          {/* Shipment & Remarks */}
          <FIShipmentRemarks register={register} />

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting
                ? 'Submitting...'
                : editingId
                ? 'Update Inspection'
                : 'Submit Final Inspection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
