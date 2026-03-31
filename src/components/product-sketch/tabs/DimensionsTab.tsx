import React from 'react';
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
  setWidth,
  setUnit,
  handleDimensionChange,
  handlePanelWidthChange,
}) => {
  return (
    <>
      <div className="dimensions">
        <div className="dimensions-header">
          <label>Dimensions</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="unit-select"
          >
            <option value="mm">millimeters</option>
            <option value="cm">centimeters</option>
            <option value="m">meters</option>
          </select>
        </div>
        <div className="dimensions-inputs">
          <div className="form-group">
            <label>Width ({unit})</label>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
              step="0.1"
              className="dimension-input"
            />
          </div>
          <div className="form-group">
            <label>Height ({unit})</label>
            <input
              type="number"
              value={height}
              onChange={e => handleDimensionChange(e.target.value, 'height')}
              step="0.1"
              className="dimension-input"
            />
          </div>
        </div>
      </div>
      {/* Panel Widths */}
      <div className="control-group">
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>
          Panel Widths ({unit})
        </label>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 6,
            flexWrap: 'wrap',
            background: '#f9fafe',
            borderRadius: 6,
            padding: '10px 8px',
            border: '1px solid #DFE3FA',
            alignItems: 'center'
          }}
        >
          {Array.from({ length: panels }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 60,
                marginRight: 4
              }}
            >
              <label
                style={{
                  fontSize: 12,
                  color: '#7E88C3',
                  marginBottom: 2,
                  fontWeight: 500
                }}
              >
                P{i + 1}
              </label>
              <input
                type="number"
                min={0.01}
                step="any"
                value={panelWidths[i] || ''}
                onChange={e => handlePanelWidthChange(i, e.target.value)}
                style={{
                  width: 60,
                  textAlign: 'center',
                  fontWeight: 600,
                  background: i === panels - 1 && panels > 1 ? '#f3f3f3' : 'white',
                  border: i === panels - 1 && panels > 1 ? '1px solid #e0e0e0' : '1px solid #DFE3FA',
                  color: i === panels - 1 && panels > 1 ? '#b0b0b0' : '#373B53',
                  borderRadius: 4,
                  outline: 'none',
                  fontSize: 14,
                  padding: '4px 0'
                }}
                disabled={i === panels - 1 && panels > 1}
              />
            </div>
          ))}
          <div
            style={{
              marginLeft: 12,
              fontSize: 13,
              color: '#7E88C3',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            Total: <span style={{ color: '#373B53', fontWeight: 700 }}>{panelWidths.reduce((a, b) => a + b, 0)}</span> {unit}
          </div>
        </div>
        <small style={{ color: '#7E88C3', fontSize: 12 }}>
          Set each panel width. Last panel auto-adjusts to match total width.
        </small>
      </div>
    </>
  );
};

export default DimensionsTab;
