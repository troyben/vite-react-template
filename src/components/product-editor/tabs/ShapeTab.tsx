import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ShapeConfig, Unit } from '@/components/product-editor/types';
import { getShortSideHeight } from '@/components/product-editor/canvas/utils/shape-path';

interface ShapeTabProps {
  shape: ShapeConfig;
  height: number;
  unit: Unit;
  onChange: (updates: Partial<ShapeConfig>) => void;
}

const handleNumericChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  field: keyof ShapeConfig,
  onChange: (updates: Partial<ShapeConfig>) => void,
) => {
  const val = e.target.value;
  if (val === '') {
    onChange({ [field]: undefined });
    return;
  }
  const num = parseFloat(val);
  if (!isNaN(num)) {
    onChange({ [field]: num });
  }
};

const ShapeTab: React.FC<ShapeTabProps> = ({ shape, height, unit, onChange }) => {
  switch (shape.type) {
    case 'arch':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Arch Height (mm)</Label>
            <Input
              type="number"
              step={5}
              value={shape.archHeight ?? ''}
              onChange={(e) => handleNumericChange(e, 'archHeight', onChange)}
              placeholder="100"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Arch Type</Label>
            <select
              value={shape.archType ?? 'semicircle'}
              onChange={(e) => onChange({ archType: e.target.value as 'semicircle' | 'segmental' })}
              className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="semicircle">Semicircle</option>
              <option value="segmental">Segmental</option>
            </select>
          </div>
        </div>
      );

    case 'trapezoid':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Top Width (mm)</Label>
            <Input
              type="number"
              step={10}
              value={shape.topWidth ?? ''}
              onChange={(e) => handleNumericChange(e, 'topWidth', onChange)}
              placeholder="600"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bottom width is the main width set in the Dimensions tab.
            </p>
          </div>
        </div>
      );

    case 'slope-left':
    case 'slope-right':
      return (
        <div className="space-y-1.5">
          <Label htmlFor="short-side-height" className="text-xs text-muted-foreground">
            {shape.type === 'slope-left' ? 'Right' : 'Left'} Side Height ({unit})
          </Label>
          <Input
            id="short-side-height"
            type="number"
            min={0}
            max={height}
            step="any"
            value={shape.shortSideHeight ?? ''}
            onChange={(e) => handleNumericChange(e, 'shortSideHeight', onChange)}
            placeholder={String(getShortSideHeight(shape, height))}
            className="h-8 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            The taller side uses the overall height in Dimensions. The shorter side
            is limited to that height; leave blank for 40% of the overall height.
          </p>
        </div>
      );

    case 'l-shape':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cutout Width (mm)</Label>
            <Input
              type="number"
              step={10}
              value={shape.cutoutWidth ?? ''}
              onChange={(e) => handleNumericChange(e, 'cutoutWidth', onChange)}
              placeholder="400"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cutout Height (mm)</Label>
            <Input
              type="number"
              step={10}
              value={shape.cutoutHeight ?? ''}
              onChange={(e) => handleNumericChange(e, 'cutoutHeight', onChange)}
              placeholder="400"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cutout Position</Label>
            <select
              value={shape.cutoutPosition ?? 'top-right'}
              onChange={(e) => onChange({ cutoutPosition: e.target.value as ShapeConfig['cutoutPosition'] })}
              className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
        </div>
      );

    case 'triangle':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Peak Position</Label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={shape.peakPosition ?? 0.5}
              onChange={(e) => onChange({ peakPosition: Number(e.target.value) })}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Left</span>
              <span>{((shape.peakPosition ?? 0.5) * 100).toFixed(0)}%</span>
              <span>Right</span>
            </div>
          </div>
        </div>
      );

    case 'gable':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Apex Rise (mm)</Label>
            <Input
              type="number"
              step={10}
              value={shape.gableHeight ?? ''}
              onChange={(e) => handleNumericChange(e, 'gableHeight', onChange)}
              placeholder="400"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Height of the triangle above the side walls. The overall height in the
              Dimensions tab includes it, so the side walls are height minus apex rise.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Apex Position</Label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={shape.peakPosition ?? 0.5}
              onChange={(e) => onChange({ peakPosition: Number(e.target.value) })}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Left</span>
              <span>{((shape.peakPosition ?? 0.5) * 100).toFixed(0)}%</span>
              <span>Right</span>
            </div>
          </div>
        </div>
      );

    case 'pentagon':
    case 'hexagon':
      return (
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          No additional configuration needed for {shape.type} shapes.
        </div>
      );

    case 'rectangle':
    default:
      return (
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          Standard rectangular shape. Adjust dimensions in the Dimensions tab.
        </div>
      );
  }
};

export default ShapeTab;
