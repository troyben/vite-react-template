import React from 'react';

export interface ConnectorSliderProps {
  x: number;
  y: number;
  height: number;
  angle: number;
  onChange: (angle: number) => void;
}

const PANEL_W = 54;

/**
 * Vertical angle slider anchored to a corner post. Rendered in a foreignObject
 * so it can be a native range input — the same trick the inline dimension
 * editor uses.
 */
const ConnectorSlider: React.FC<ConnectorSliderProps> = ({ x, y, height, angle, onChange }) => {
  const h = Math.max(height, 90);
  return (
    <foreignObject x={x - PANEL_W / 2} y={y} width={PANEL_W} height={h + 26}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.94)', border: '1px solid #7E88C3',
          borderRadius: 8, padding: '6px 2px', boxSizing: 'border-box',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={1}
          max={359}
          step={1}
          value={angle}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            writingMode: 'vertical-lr' as const,
            direction: 'rtl',
            height: h,
            width: 20,
            accentColor: '#7c3aed',
          }}
          aria-label="Corner angle in degrees"
        />
        <span style={{ fontSize: 10, fontWeight: 600, color: '#4c1d95' }}>{angle}&deg;</span>
      </div>
    </foreignObject>
  );
};

export default ConnectorSlider;
