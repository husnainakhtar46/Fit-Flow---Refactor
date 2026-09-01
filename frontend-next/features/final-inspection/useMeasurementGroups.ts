'use client';

import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { FISizeBreakdown } from './types';

interface UseMeasurementGroupsProps {
  fields: any[];
  sizeBreakdowns: FISizeBreakdown[];
  defaultColor?: string;
  activeColor: string;
  activeSize: string;
  setValue: (name: string, value: any) => void;
  getValues: (name?: string) => any;
  append: (value: any) => void;
  replace: (values: any[]) => void;
  sampleCount?: number;
}

export type GroupStatus = 'empty' | 'pass' | 'fail';

export function useMeasurementGroups({
  fields,
  sizeBreakdowns,
  defaultColor = 'Default',
  activeColor,
  activeSize,
  setValue,
  getValues,
  append,
  replace,
  sampleCount = 5,
}: UseMeasurementGroupsProps) {
  // 1. Derive distinct colors from sizeBreakdowns
  const colorList = useMemo(() => {
    const rawColors = sizeBreakdowns
      .map((sb) => (sb.color || '').trim())
      .filter(Boolean);
    const unique = Array.from(new Set(rawColors));
    return unique.length > 0 ? unique : [defaultColor || 'Default'];
  }, [sizeBreakdowns, defaultColor]);

  // 2. Derive sizes per color
  const sizesByColor = useMemo(() => {
    const map: Record<string, string[]> = {};
    colorList.forEach((c) => {
      const matching = sizeBreakdowns.filter(
        (sb) => (sb.color || '').trim() === c || (!sb.color && c === defaultColor)
      );
      const sizes = matching.map((sb) => sb.size?.trim()).filter(Boolean);
      map[c] = sizes.length > 0 ? Array.from(new Set(sizes)) : ['M'];
    });
    return map;
  }, [colorList, sizeBreakdowns, defaultColor]);

  // 3. Normalized matching helper
  const isMatch = useCallback(
    (row: any, color: string, size: string) => {
      const rowColor = (row?.color || '').trim() || defaultColor;
      const rowSize = (row?.size_name || '').trim() || 'M';
      return rowColor.toLowerCase() === color.toLowerCase() && rowSize.toLowerCase() === size.toLowerCase();
    },
    [defaultColor]
  );

  // 4. Active slice indices in the global fields array
  const activeRowIndices = useMemo(() => {
    const indices: number[] = [];
    fields.forEach((f, idx) => {
      if (isMatch(f, activeColor, activeSize)) {
        indices.push(idx);
      }
    });
    return indices;
  }, [fields, activeColor, activeSize, isMatch]);

  // 5. Status evaluation (empty / pass / fail)
  const getGroupStatus = useCallback(
    (color: string, size: string): GroupStatus => {
      const matchingRows = fields.filter((f) => isMatch(f, color, size));
      if (matchingRows.length === 0) return 'empty';

      let hasEnteredSample = false;
      let hasFail = false;

      for (const row of matchingRows) {
        const std = parseFloat(row.std);
        const tol = parseFloat(row.tol);
        const samples = row.samples || [];

        for (const s of samples) {
          if (s?.value !== '' && s?.value !== null && s?.value !== undefined) {
            hasEnteredSample = true;
            const val = parseFloat(s.value);
            if (!isNaN(val) && !isNaN(std) && !isNaN(tol)) {
              if (Math.abs(val - std) > tol) {
                hasFail = true;
                break;
              }
            }
          }
        }
        if (hasFail) break;
      }

      if (!hasEnteredSample) return 'empty';
      return hasFail ? 'fail' : 'pass';
    },
    [fields, isMatch]
  );

  // 6. Auto-inherit POM structure from first available populated group
  const autoInheritPOMs = useCallback(() => {
    if (activeRowIndices.length > 0) return; // already has POMs
    // Find any populated group
    const sourceRows = fields.filter((f) => f.pom_name && f.pom_name.trim());
    if (sourceRows.length === 0) return;

    // Pick first unique set of POMs from source
    const seenPOMs = new Set<string>();
    const templatePOMs: any[] = [];
    for (const r of sourceRows) {
      if (!seenPOMs.has(r.pom_name)) {
        seenPOMs.add(r.pom_name);
        templatePOMs.push({
          pom_name: r.pom_name,
          tol: r.tol ?? 0.5,
          std: '',
        });
      }
    }

    if (templatePOMs.length > 0) {
      const newRows = templatePOMs.map((tp) => ({
        color: activeColor,
        size_name: activeSize,
        pom_name: tp.pom_name,
        tol: tp.tol,
        std: tp.std,
        samples: Array.from({ length: sampleCount }, (_, i) => ({
          index: i + 1,
          value: '',
        })),
      }));
      newRows.forEach((r) => append(r));
      toast.info(`Auto-inherited ${templatePOMs.length} POMs for ${activeColor} (${activeSize})`);
    }
  }, [activeRowIndices.length, fields, activeColor, activeSize, sampleCount, append]);

  // 7. Mirror Specs for active size across all other colors
  const mirrorSpecsToAllColors = useCallback(() => {
    const allMeasurements: any[] = getValues('measurements') || [];
    const sourceRows = allMeasurements.filter((m) => isMatch(m, activeColor, activeSize));
    if (sourceRows.length === 0) {
      toast.error(`No specs found for ${activeColor} (${activeSize}) to mirror.`);
      return;
    }

    const otherColors = colorList.filter((c) => c.toLowerCase() !== activeColor.toLowerCase());
    if (otherColors.length === 0) {
      toast.info('No other colors to mirror specs to.');
      return;
    }

    let updatedCount = 0;
    allMeasurements.forEach((m, idx) => {
      if (otherColors.some((c) => (m.color || '').toLowerCase() === c.toLowerCase())) {
        if ((m.size_name || '').toLowerCase() === activeSize.toLowerCase()) {
          const matchSource = sourceRows.find(
            (sr) => sr.pom_name?.trim().toLowerCase() === m.pom_name?.trim().toLowerCase()
          );
          if (matchSource && matchSource.std !== undefined && matchSource.std !== '') {
            setValue(`measurements.${idx}.std`, matchSource.std);
            setValue(`measurements.${idx}.tol`, matchSource.tol);
            updatedCount++;
          }
        }
      }
    });

    toast.success(`Mirrored specs for Size ${activeSize} across ${otherColors.length} other color(s) (${updatedCount} POMs).`);
  }, [getValues, isMatch, activeColor, activeSize, colorList, setValue]);

  // 8. Load template POMs for all (color, size) pairs
  const applyTemplateToAll = useCallback(
    (templatePOMs: any[]) => {
      if (!templatePOMs || templatePOMs.length === 0) return;
      const allRows: any[] = [];

      colorList.forEach((c) => {
        const sizes = sizesByColor[c] || ['M'];
        sizes.forEach((s) => {
          templatePOMs.forEach((pom: any) => {
            allRows.push({
              color: c,
              size_name: s,
              pom_name: pom.name || pom.pom_name || '',
              tol: pom.default_tol ?? pom.tol ?? 0.5,
              std: pom.default_std ?? pom.std ?? '',
              samples: Array.from({ length: sampleCount }, (_, i) => ({
                index: i + 1,
                value: '',
              })),
            });
          });
        });
      });

      replace(allRows);
      toast.success(`Applied template POMs across ${colorList.length} color(s) and all sizes.`);
    },
    [colorList, sizesByColor, sampleCount, replace]
  );

  return {
    colorList,
    sizesByColor,
    activeRowIndices,
    getGroupStatus,
    autoInheritPOMs,
    mirrorSpecsToAllColors,
    applyTemplateToAll,
  };
}
