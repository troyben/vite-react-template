import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Unit } from '../types';

interface DimensionsTabProps {
  width: number;
  height: number;
  unit: Unit;
  panels: number;
  panelWidths: number[];
  setWidth: (w: number) => void;
  setUnit: (u: Unit) => void;
  handleDimensionChange: (value: string, dimension: 'width' | 'height') => void;
  handlePanelWidthChange: (panelIndex: number, value: string) => void;
}

const DimensionsTab: React.FC<DimensionsTabProps> = ({
  width,
  height,
  unit,
  panels,
  panelWidths,
  setUnit,
  handleDimensionChange,
  handlePanelWidthChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Overall Dimensions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Overall Dimensions</h4>
          <div className="flex gap-1">
            {(['mm', 'cm', 'm'] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  unit === u
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Width ({unit})</Label>
            <Input
              type="number"
              value={width || ''}
              onChange={(e) => handleDimensionChange(e.target.value, 'width')}
              step="0.1"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Height ({unit})</Label>
            <Input
              type="number"
              value={height || ''}
              onChange={(e) => handleDimensionChange(e.target.value, 'height')}
              step="0.1"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Panel Widths */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Panel Widths ({unit})</h4>

        <div className={`grid gap-2 ${panels >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {Array.from({ length: panels }).map((_, i) => {
            const isLast = i === panels - 1 && panels > 1;
            return (
              <div key={i} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">P{i + 1}</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  value={panelWidths[i] || ''}
                  onChange={(e) => handlePanelWidthChange(i, e.target.value)}
                  disabled={isLast}
                  className={`h-8 text-sm text-center ${
                    isLast ? 'bg-muted/50 text-muted-foreground' : ''
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Last panel auto-adjusts to match total.
          </p>
          <span className="text-xs font-medium">
            Total:{' '}
            <span className="text-foreground font-semibold">
              {panelWidths.reduce((a, b) => a + b, 0)}
            </span>{' '}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DimensionsTab;
