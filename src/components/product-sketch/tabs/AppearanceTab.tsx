import React from 'react';
import type { GlassType } from '../types';

interface AppearanceTabProps {
  frameColor: string;
  glassType: GlassType;
  customGlassTint: string;
  setFrameColor: (c: string) => void;
  setGlassType: (g: GlassType) => void;
  setCustomGlassTint: (c: string) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  frameColor,
  glassType,
  customGlassTint,
  setFrameColor,
  setGlassType,
  setCustomGlassTint,
}) => {
  return (
    <div className="form-row settings-row">
      <div className="form-group">
        <label>Frame Color</label>
        <div className="select-wrapper">
          <select
            value={frameColor}
            onChange={e => setFrameColor(e.target.value)}
            className="styled-select"
          >
            <option value="#C0C0C0">Natural/Silver</option>
            <option value="#4F4F4F">Charcoal Grey</option>
            <option value="#CD7F32">Bronze</option>
          </select>
        </div>
        {frameColor === 'custom' && (
          <input
            type="color"
            value={frameColor === 'custom' ? '#777777' : frameColor}
            onChange={e => setFrameColor(e.target.value)}
            className="color-picker"
          />
        )}
      </div>

      <div className="form-group">
        <label>Glass Type</label>
        <div className="select-wrapper">
          <select
            value={glassType}
            onChange={e => setGlassType(e.target.value as GlassType)}
            className="styled-select"
          >
            <option value="clear">Clear</option>
            <option value="frosted">Frosted</option>
            <option value="custom-tint">Custom Tinted</option>
          </select>
        </div>
        {glassType === 'custom-tint' && (
          <input
            type="color"
            value={customGlassTint}
            onChange={e => setCustomGlassTint(e.target.value)}
            className="color-picker"
          />
        )}
      </div>
    </div>
  );
};

export default AppearanceTab;
