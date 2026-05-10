import React from 'react';
import { Label } from '@/components/ui/label';
import type { GlassType } from '../types';

interface AppearanceTabProps {
  frameColor: string;
  glassType: GlassType;
  customGlassTint: string;
  setFrameColor: (c: string) => void;
  setGlassType: (g: GlassType) => void;
  setCustomGlassTint: (c: string) => void;
}

const FRAME_COLORS = [
  { value: '#C0C0C0', label: 'Silver' },
  { value: '#4F4F4F', label: 'Charcoal' },
  { value: '#CD7F32', label: 'Bronze' },
] as const;

const GLASS_TYPES: { value: GlassType; label: string }[] = [
  { value: 'clear', label: 'Clear' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'custom-tint', label: 'Custom' },
];

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  frameColor,
  glassType,
  customGlassTint,
  setFrameColor,
  setGlassType,
  setCustomGlassTint,
}) => {
  return (
    <div className="space-y-6">
      {/* Frame Color */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Frame Color</Label>
        <div className="grid grid-cols-3 gap-2">
          {FRAME_COLORS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFrameColor(value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2 border transition-colors ${
                frameColor === value
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-transparent hover:bg-muted'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-muted"
                style={{ backgroundColor: value }}
              />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Glass Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Glass Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {GLASS_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGlassType(value)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                glassType === value
                  ? 'border-violet-400 bg-violet-50 text-violet-700'
                  : 'border-muted text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {glassType === 'custom-tint' && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-muted-foreground">Tint Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customGlassTint}
                onChange={(e) => setCustomGlassTint(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-input p-0.5"
              />
              <span className="text-xs text-muted-foreground font-mono">
                {customGlassTint}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppearanceTab;
