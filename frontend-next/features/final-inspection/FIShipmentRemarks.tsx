'use client';

import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FIShipmentRemarksProps {
  register: UseFormRegister<any>;
}

export const FIShipmentRemarks: React.FC<FIShipmentRemarksProps> = ({ register }) => {
  return (
    <div className="space-y-6">
      {/* Packaging & Shipment Checks */}
      <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
          Packaging & Shipment Integrity Checks
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Total Cartons Packed</Label>
            <Input
              type="number"
              min={0}
              {...register('total_cartons')}
              placeholder="e.g. 200"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Cartons Inspected</Label>
            <Input
              type="number"
              min={0}
              {...register('cartons_inspected')}
              placeholder="e.g. 20"
            />
          </div>

          <div className="flex flex-col justify-end space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                {...register('packaging_passed')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Packaging / Polybag OK
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                {...register('carton_drop_test_passed')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Carton Drop Test Passed
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                {...register('barcode_check_passed')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Barcode Scan Test Passed
            </label>
          </div>
        </div>
      </div>

      {/* General Final Remarks */}
      <div className="space-y-2">
        <Label htmlFor="fi-remarks" className="text-xs font-semibold text-gray-700">
          Final Inspection Observations & Notes
        </Label>
        <Textarea
          id="fi-remarks"
          {...register('remarks')}
          placeholder="Summary of findings, carton numbers opened, factory response, re-inspection requirements..."
          rows={3}
          className="text-xs"
        />
      </div>

      {/* Final Decision */}
      <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
        <Label htmlFor="fi-decision" className="text-sm font-bold text-gray-900">
          Final Inspection Overall Decision *
        </Label>
        <select
          id="fi-decision"
          {...register('decision')}
          className="w-full px-3 py-2.5 border rounded-md text-sm bg-white font-bold"
          required
        >
          <option value="">-- Select Final Verdict --</option>
          <option value="Passed" className="text-green-600 font-bold">
            PASSED (Shipment Approved)
          </option>
          <option value="Failed" className="text-red-600 font-bold">
            FAILED (Reject / 100% Re-inspection)
          </option>
          <option value="Pending" className="text-amber-600 font-bold">
            PENDING (Subject to Customer Approval)
          </option>
        </select>
      </div>
    </div>
  );
};
