'use client';

import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FIShipmentRemarksProps {
  register: UseFormRegister<any>;
}

const ISO_CHECKS = [
  { name: 'workmanship', label: 'Workmanship & Construction' },
  { name: 'packing_method', label: 'Packing & Folding Method' },
  { name: 'marking_label', label: 'Markings, Labels & Barcodes' },
  { name: 'data_measurement', label: 'Measurement Data Conformity' },
  { name: 'hand_feel', label: 'Fabric Hand-feel & Odor' },
];

export const FIShipmentRemarks: React.FC<FIShipmentRemarksProps> = ({ register }) => {
  return (
    <div className="space-y-6">
      {/* Carton Dimensions & Packaging Audit */}
      <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
          Carton Specifications & Weight Audit
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Total Cartons</Label>
            <Input
              type="number"
              min={0}
              {...register('total_cartons')}
              placeholder="e.g. 250"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Inspected Cartons</Label>
            <Input
              type="number"
              min={0}
              {...register('selected_cartons')}
              placeholder="e.g. 20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Length (cm)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              {...register('carton_length')}
              placeholder="e.g. 60"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Width (cm)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              {...register('carton_width')}
              placeholder="e.g. 40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Height (cm)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              {...register('carton_height')}
              placeholder="e.g. 30"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Gross Wt (kg)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...register('gross_weight')}
              placeholder="e.g. 15.5"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Net Wt (kg)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...register('net_weight')}
              placeholder="e.g. 14.2"
            />
          </div>
        </div>
      </div>

      {/* ISO 2859-1 Shipment Conformity Checklists */}
      <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
            ISO Shipment Quality Conformity Checklists
          </h4>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
            <input
              type="checkbox"
              {...register('quantity_check')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Quantity & Assortment Verified (100% Match)
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ISO_CHECKS.map(({ name, label }) => (
            <div key={name} className="space-y-1.5 p-2.5 bg-white rounded border">
              <Label className="text-xs font-semibold text-gray-700 block leading-tight">{label}</Label>
              <select
                {...register(name)}
                className="w-full px-2.5 py-1.5 border rounded text-xs bg-white font-medium"
              >
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="NA">N/A</option>
              </select>
            </div>
          ))}
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

