'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { toast } from 'sonner';

interface UseMeasurementGridProps {
  sampleCount: number;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  fields: any[];
}

export function useMeasurementGrid({
  sampleCount,
  setValue,
  getValues,
  fields,
}: UseMeasurementGridProps) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);

  const columnKeys = ['pom_name', 'tol', 'std', ...Array.from({ length: sampleCount }, (_, i) => `sample_${i + 1}`)];

  const getCellId = (rowIndex: number, columnKey: string) => `${rowIndex}:${columnKey}`;
  const isSelected = (rowIndex: number, columnKey: string) => selectedCells.has(getCellId(rowIndex, columnKey));

  const handleCellMouseDown = (index: number, key: string) => {
    const colIndex = columnKeys.indexOf(key);
    if (colIndex === -1) return;
    setIsDragSelecting(true);
    setDragStart({ row: index, col: colIndex });
    setSelectedCells(new Set([getCellId(index, key)]));
  };

  const handleCellMouseEnter = (index: number, key: string) => {
    if (!isDragSelecting || !dragStart) return;
    const colIndex = columnKeys.indexOf(key);
    if (colIndex === -1) return;

    const minRow = Math.min(dragStart.row, index);
    const maxRow = Math.max(dragStart.row, index);
    const minCol = Math.min(dragStart.col, colIndex);
    const maxCol = Math.max(dragStart.col, colIndex);

    const newSelected = new Set<string>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        newSelected.add(getCellId(r, columnKeys[c]));
      }
    }
    setSelectedCells(newSelected);
  };

  useEffect(() => {
    const handleUp = () => {
      if (isDragSelecting) {
        setIsDragSelecting(false);
      }
    };
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragSelecting]);

  const handleCellKeyDown = (e: React.KeyboardEvent, index: number, key: string) => {
    const colIndex = columnKeys.indexOf(key);
    if (colIndex === -1) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedCells.size > 1) {
        e.preventDefault();
        selectedCells.forEach((cellId) => {
          const [rStr, k] = cellId.split(':');
          const r = parseInt(rStr, 10);
          if (k.startsWith('sample_')) {
            const sIdx = parseInt(k.replace('sample_', ''), 10) - 1;
            setValue(`measurements.${r}.samples.${sIdx}.value`, '');
          } else {
            setValue(`measurements.${r}.${k}`, '');
          }
        });
        toast.info(`Cleared ${selectedCells.size} cells`);
        return;
      }
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      let targetRow = index;
      let targetCol = colIndex;

      if (e.key === 'ArrowUp') targetRow = Math.max(0, index - 1);
      if (e.key === 'ArrowDown' || e.key === 'Enter') targetRow = Math.min(fields.length - 1, index + 1);
      if (e.key === 'ArrowLeft') {
        const input = e.target as HTMLInputElement;
        if (input.selectionStart === 0 && input.selectionEnd === 0) {
          targetCol = Math.max(0, colIndex - 1);
        } else {
          return;
        }
      }
      if (e.key === 'ArrowRight') {
        const input = e.target as HTMLInputElement;
        if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
          targetCol = Math.min(columnKeys.length - 1, colIndex + 1);
        } else {
          return;
        }
      }

      if (targetRow !== index || targetCol !== colIndex) {
        e.preventDefault();
        const targetKey = columnKeys[targetCol];
        const selector = `[data-grid-cell="${targetRow}:${targetKey}"]`;
        const el = document.querySelector(selector) as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
          setSelectedCells(new Set([getCellId(targetRow, targetKey)]));
        }
      }
    }
  };

  const handleMeasurementPaste = (rowIndex: number, startColumn: string) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    const clipboardData = event.clipboardData.getData('text');
    if (!clipboardData || !clipboardData.includes('\t') && !clipboardData.includes('\n')) {
      return;
    }

    event.preventDefault();
    const rows = clipboardData.trim().split(/\r\n|\n|\r/);
    const startColIndex = columnKeys.indexOf(startColumn);
    if (startColIndex === -1) return;

    rows.forEach((rowText, rOffset) => {
      const targetRow = rowIndex + rOffset;
      if (targetRow >= fields.length) return;

      const cells = rowText.split('\t');
      cells.forEach((cellText, cOffset) => {
        const targetCol = startColIndex + cOffset;
        if (targetCol >= columnKeys.length) return;

        const colKey = columnKeys[targetCol];
        const trimmed = cellText.trim();

        if (colKey.startsWith('sample_')) {
          const sampleIndex = parseInt(colKey.replace('sample_', ''), 10) - 1;
          const parsed = trimmed === '' ? '' : isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
          setValue(`measurements.${targetRow}.samples.${sampleIndex}.value`, parsed);
        } else {
          const parsed = trimmed === '' ? '' : isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
          setValue(`measurements.${targetRow}.${colKey}`, parsed);
        }
      });
    });

    toast.success(`Pasted ${rows.length} row(s)`);
  };

  const handleCopy = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (selectedCells.size <= 1) return;

    event.preventDefault();
    const cellCoords = Array.from(selectedCells).map((c) => {
      const [r, k] = c.split(':');
      return { row: parseInt(r, 10), col: columnKeys.indexOf(k), key: k };
    });

    const minRow = Math.min(...cellCoords.map((c) => c.row));
    const maxRow = Math.max(...cellCoords.map((c) => c.row));
    const minCol = Math.min(...cellCoords.map((c) => c.col));
    const maxCol = Math.max(...cellCoords.map((c) => c.col));

    const measurements = getValues('measurements');
    const lines: string[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      const rowVals: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const colKey = columnKeys[c];
        let val = '';
        if (colKey.startsWith('sample_')) {
          const sIdx = parseInt(colKey.replace('sample_', ''), 10) - 1;
          val = measurements?.[r]?.samples?.[sIdx]?.value ?? '';
        } else {
          val = measurements?.[r]?.[colKey] ?? '';
        }
        rowVals.push(String(val));
      }
      lines.push(rowVals.join('\t'));
    }

    event.clipboardData.setData('text/plain', lines.join('\n'));
    toast.success(`Copied ${selectedCells.size} cell(s) to clipboard`);
  };

  const checkTol = (sampleVal: any, std: any, tol: any) => {
    const s = parseFloat(sampleVal);
    const target = parseFloat(std);
    const tolerance = parseFloat(tol);
    if (isNaN(s) || isNaN(target) || isNaN(tolerance)) return false;
    return Math.abs(s - target) > tolerance + 1e-5;
  };

  return {
    selectedCells,
    setSelectedCells,
    columnKeys,
    getCellId,
    isSelected,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellKeyDown,
    handleMeasurementPaste,
    handleCopy,
    checkTol,
  };
}
