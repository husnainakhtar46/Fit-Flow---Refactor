'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SizeColorRowProps {
  color: string;
  masterSizes: string[];
  activeSizes: string[];
  onToggleSize: (color: string, size: string) => void;
  onAddColorSize: (color: string, size: string) => void;
}

export const SizeColorRow: React.FC<SizeColorRowProps> = ({
  color,
  masterSizes,
  activeSizes,
  onToggleSize,
  onAddColorSize,
}) => {
  const [inlineSize, setInlineSize] = useState('');

  // Combine master sizes and any color-specific active sizes
  const displayedSizes = Array.from(new Set([...masterSizes, ...activeSizes]));

  const handleAddInline = () => {
    const trimmed = inlineSize.trim().toUpperCase();
    if (!trimmed) return;
    onAddColorSize(color, trimmed);
    setInlineSize('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
      {/* Color Name Label */}
      <div className="w-28 shrink-0 flex items-center">
        <span className="inline-block px-2.5 py-0.5 rounded-md font-semibold text-xs bg-blue-50 text-blue-800 border border-blue-200 truncate max-w-full">
          {color || 'Default'}
        </span>
      </div>

      {/* Size Toggle Pills */}
      <div className="flex flex-wrap items-center gap-1.5 flex-1">
        {displayedSizes.map((size) => {
          const isActive = activeSizes.includes(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => onToggleSize(color, size)}
              className={cn(
                'px-2.5 py-0.5 text-xs rounded-full font-bold transition-all border shadow-sm',
                isActive
                  ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
                  : 'bg-white text-gray-400 border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-600'
              )}
              title={isActive ? `Click to exclude ${size} for ${color}` : `Click to include ${size} for ${color}`}
            >
              {size} {isActive && '✓'}
            </button>
          );
        })}

        {/* Inline Size Adder for this color */}
        <div className="inline-flex items-center gap-1 ml-1">
          <Input
            value={inlineSize}
            onChange={(e) => setInlineSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInline();
              }
            }}
            placeholder="+ Size"
            className="h-6 w-20 text-[11px] bg-white px-2"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleAddInline}
            disabled={!inlineSize.trim()}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-900"
            title={`Add size specifically to ${color}`}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
