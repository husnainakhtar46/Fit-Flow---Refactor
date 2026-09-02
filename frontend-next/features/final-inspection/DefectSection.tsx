'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FIDefect } from './types';
import AQLResultCard from '@/components/inspection/AQLResultCard';
import { compressImage } from '@/lib/imageUtils';
import BlobImagePreview from '@/components/shared/BlobImagePreview';

interface DefectSectionProps {
  defects: FIDefect[];
  setDefects: React.Dispatch<React.SetStateAction<FIDefect[]>>;
  defectImages: any[];
  setDefectImages: React.Dispatch<React.SetStateAction<any[]>>;
  aqlCalculations: any;
}

const COMMON_DEFECTS = [
  'Broken Stitch',
  'Skip Stitch',
  'Oil Stain',
  'Color Shading',
  'Open Seam',
  'Puckering',
  'Missing Button',
  'Uneven Hem',
  'Loose Thread',
  'Incorrect Label',
  'Fabric Flaw',
  'Measurements Out of Spec',
];

export const DefectSection: React.FC<DefectSectionProps> = ({
  defects,
  setDefects,
  defectImages,
  setDefectImages,
  aqlCalculations,
}) => {
  const [customDesc, setCustomDesc] = useState('');
  const [defectType, setDefectType] = useState<'critical' | 'major' | 'minor'>('major');

  const handleAddDefect = (desc: string, type: 'critical' | 'major' | 'minor') => {
    const existing = defects.find(
      (d) => d.description.toLowerCase() === desc.toLowerCase() && d.type === type
    );
    if (existing) {
      setDefects(
        defects.map((d) =>
          d === existing ? { ...d, count: d.count + 1 } : d
        )
      );
    } else {
      setDefects([...defects, { description: desc, type, count: 1 }]);
    }
  };

  const handleAddCustom = () => {
    if (customDesc.trim()) {
      handleAddDefect(customDesc.trim(), defectType);
      setCustomDesc('');
    }
  };

  const handleCountChange = (index: number, count: number) => {
    if (count <= 0) {
      setDefects(defects.filter((_, i) => i !== index));
    } else {
      const updated = [...defects];
      updated[index].count = count;
      setDefects(updated);
    }
  };

  const handleRemove = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  const handleDefectPhotoPick = async (index: number, file: File) => {
    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const updated = [...defects];
        updated[index] = { ...updated[index], photo: base64 };
        setDefects(updated);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const updated = [...defects];
      updated[index] = { ...updated[index], photo: file };
      setDefects(updated);
    }
  };

  const handleRemoveDefectPhoto = (index: number) => {
    const updated = [...defects];
    updated[index] = { ...updated[index], photo: null };
    setDefects(updated);
  };

  const handleAddImage = (file: File) => {
    setDefectImages([...defectImages, { file, caption: '' }]);
  };

  const handleRemoveImage = (index: number) => {
    setDefectImages(defectImages.filter((_, i) => i !== index));
  };

  const handleImageCaptionChange = (index: number, caption: string) => {
    const updated = [...defectImages];
    updated[index].caption = caption;
    setDefectImages(updated);
  };

  return (
    <div className="space-y-6">
      {/* AQL Result Verdict Summary */}
      <AQLResultCard
        sampleSize={aqlCalculations.sampleSize}
        limits={aqlCalculations.limits}
        foundCritical={aqlCalculations.totalCritical}
        foundMajor={aqlCalculations.totalMajor}
        foundMinor={aqlCalculations.totalMinor}
        verdict={aqlCalculations.verdict}
      />

      {/* Defect Quick Select Badges */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
          Log Defects
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_DEFECTS.map((defect) => (
            <button
              key={defect}
              type="button"
              onClick={() => handleAddDefect(defect, 'major')}
              className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded-full hover:border-blue-500 hover:text-blue-600 transition-all text-gray-700"
            >
              + {defect}
            </button>
          ))}
        </div>

        {/* Custom Defect Add Bar */}
        <div className="flex gap-2">
          <select
            value={defectType}
            onChange={(e) => setDefectType(e.target.value as any)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white font-medium w-28"
          >
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
          <Input
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Custom defect description..."
            className="h-9 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustom}
            className="h-9 text-xs gap-1 bg-primary text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Add Defect
          </Button>
        </div>

        {/* Defects Log Table */}
        {defects.length > 0 ? (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-2 text-left font-semibold text-gray-600">Defect Description</th>
                  <th className="p-2 text-center font-semibold text-gray-600 w-28">Severity</th>
                  <th className="p-2 text-center font-semibold text-gray-600 w-24">Count</th>
                  <th className="p-2 text-center font-semibold text-gray-600 w-16">Photo</th>
                  <th className="p-2 text-center font-semibold text-gray-600 w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {defects.map((d, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="p-2 font-medium text-gray-900">{d.description}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          d.type === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : d.type === 'major'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCountChange(index, d.count - 1)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          -
                        </Button>
                        <span className="w-7 font-bold text-gray-800">{d.count}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCountChange(index, d.count + 1)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {d.photo ? (
                        <div className="relative inline-block group">
                          <BlobImagePreview
                            file={d.photo}
                            alt="Defect"
                            className="w-7 h-7 object-cover rounded border border-gray-300 mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDefectPhoto(index)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Photo"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-400 hover:text-blue-600 mx-auto">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleDefectPhotoPick(index, e.target.files[0]);
                              }
                            }}
                          />
                          <Camera className="w-3.5 h-3.5" />
                        </label>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
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
        ) : (
          <p className="text-xs text-gray-400 italic">No defects recorded yet.</p>
        )}
      </div>

      {/* Defect Photos Upload */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
            Defect Photos Evidence
          </h4>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((f) => handleAddImage(f));
                }
              }}
              className="hidden"
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 hover:bg-blue-100">
              <Camera className="w-3.5 h-3.5" /> + Upload Defect Photo
            </span>
          </label>
        </div>

        {defectImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {defectImages.map((img, i) => (
              <div key={i} className="border rounded-md p-2 bg-white space-y-1.5 relative shadow-sm">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-gray-500 hover:text-red-600 shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="h-24 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                  <BlobImagePreview
                    file={img.file}
                    alt="Defect evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Input
                  value={img.caption}
                  onChange={(e) => handleImageCaptionChange(i, e.target.value)}
                  placeholder="Defect caption..."
                  className="h-7 text-[11px]"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No defect photos uploaded yet.</p>
        )}
      </div>
    </div>
  );
};
