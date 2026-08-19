'use client';

import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AccessoryItem, ACCESSORY_PRESETS } from './types';

interface FabricAccessoriesProps {
  register: UseFormRegister<any>;
  accessories: AccessoryItem[];
  setAccessories: React.Dispatch<React.SetStateAction<AccessoryItem[]>>;
}

export const FabricAccessories: React.FC<FabricAccessoriesProps> = ({
  register,
  accessories,
  setAccessories,
}) => {
  const [customName, setCustomName] = useState('');

  const handleAddPreset = (presetName: string) => {
    if (!accessories.some((a) => a.name.toLowerCase() === presetName.toLowerCase())) {
      setAccessories([...accessories, { name: presetName, comment: 'Ok' }]);
    }
  };

  const handleAddCustom = () => {
    if (customName.trim()) {
      setAccessories([...accessories, { name: customName.trim(), comment: 'Ok' }]);
      setCustomName('');
    }
  };

  const handleRemove = (index: number) => {
    setAccessories(accessories.filter((_, i) => i !== index));
  };

  const handleCommentChange = (index: number, comment: string) => {
    const updated = [...accessories];
    updated[index].comment = comment;
    setAccessories(updated);
  };

  return (
    <div className="space-y-6">
      {/* Fabric Checks */}
      <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
          Fabric Quality Check
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fabric_handfeel" className="text-xs font-semibold">
              Fabric Handfeel
            </Label>
            <select
              id="fabric_handfeel"
              {...register('fabric_handfeel')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="OK">OK</option>
              <option value="Not OK">Not OK</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabric_pilling" className="text-xs font-semibold">
              Fabric Pilling
            </Label>
            <select
              id="fabric_pilling"
              {...register('fabric_pilling')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="None">None</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accessories Checklist */}
      <div className="space-y-4">
        <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
          Accessories & Trims Checklist
        </h4>

        {/* Preset Badges */}
        <div className="flex flex-wrap gap-1.5">
          {ACCESSORY_PRESETS.map((preset) => {
            const isAdded = accessories.some(
              (a) => a.name.toLowerCase() === preset.toLowerCase()
            );
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddPreset(preset)}
                disabled={isAdded}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  isAdded
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                + {preset}
              </button>
            );
          })}
        </div>

        {/* Add Custom Accessory */}
        <div className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Custom accessory name (e.g. Drawstring, Eyelet)..."
            className="h-9 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustom}
            className="h-9 gap-1 text-xs"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {/* Accessories Table */}
        {accessories.length > 0 ? (
          <div className="border rounded-md divide-y bg-white">
            {accessories.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-2.5 hover:bg-gray-50">
                <span className="font-medium text-xs text-gray-800 min-w-[140px]">
                  {item.name}
                </span>
                <select
                  value={item.comment}
                  onChange={(e) => handleCommentChange(index, e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Ok">Ok</option>
                  <option value="Not Ok">Not Ok</option>
                  <option value="Available">Available</option>
                  <option value="Improved">Improved</option>
                </select>
                <Input
                  value={item.comment}
                  onChange={(e) => handleCommentChange(index, e.target.value)}
                  placeholder="Additional remarks..."
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  className="h-7 w-7 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No accessories added yet.</p>
        )}
      </div>

      {/* General Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-xs font-semibold text-gray-700">
          General Final Remarks / Comments
        </Label>
        <Textarea
          id="remarks"
          {...register('remarks')}
          placeholder="Any other observations, packaging notes, fit summaries..."
          rows={3}
          className="text-xs"
        />
      </div>
    </div>
  );
};
