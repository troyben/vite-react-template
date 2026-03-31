import React from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';

interface ShapeTabProps {
  shape: ShapeConfig;
  onChange: (updates: Partial<ShapeConfig>) => void;
}

const ShapeTab: React.FC<ShapeTabProps> = ({ shape, onChange }) => {
  switch (shape.type) {
    case 'arch':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Arch Height (px)
            </label>
            <input
              type="number"
              min={10}
              step={5}
              value={shape.archHeight ?? 100}
              onChange={(e) => onChange({ archHeight: Number(e.target.value) })}
              className="dimension-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Arch Type
            </label>
            <select
              value={shape.archType ?? 'semicircle'}
              onChange={(e) => onChange({ archType: e.target.value as 'semicircle' | 'segmental' })}
              className="styled-select w-full"
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Top Width (mm)
            </label>
            <input
              type="number"
              min={50}
              step={10}
              value={shape.topWidth ?? 600}
              onChange={(e) => onChange({ topWidth: Number(e.target.value) })}
              className="dimension-input w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bottom width is the main width set in the Dimensions tab.
            </p>
          </div>
        </div>
      );

    case 'l-shape':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Cutout Width (mm)
            </label>
            <input
              type="number"
              min={50}
              step={10}
              value={shape.cutoutWidth ?? 400}
              onChange={(e) => onChange({ cutoutWidth: Number(e.target.value) })}
              className="dimension-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Cutout Height (mm)
            </label>
            <input
              type="number"
              min={50}
              step={10}
              value={shape.cutoutHeight ?? 400}
              onChange={(e) => onChange({ cutoutHeight: Number(e.target.value) })}
              className="dimension-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Cutout Position
            </label>
            <select
              value={shape.cutoutPosition ?? 'top-right'}
              onChange={(e) => onChange({ cutoutPosition: e.target.value as ShapeConfig['cutoutPosition'] })}
              className="styled-select w-full"
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Peak Position
            </label>
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
