import React from 'react';
import { ProductData } from './ProductSketch';

interface SketchPreviewProps {
  data: ProductData;
  size?: 'small' | 'medium' | 'large';
}

const SketchPreview: React.FC<SketchPreviewProps> = ({ data, size = 'medium' }) => {
  const dimensions = {
    small: { width: 200, height: 150 },
    medium: { width: 300, height: 200 },
    large: { width: 400, height: 300 }
  }[size];

  const renderPanelDivisions = (panelIndex: number) => {
    const division = data.panelDivisions?.find(d => d.panelIndex === panelIndex);
    if (!division) return null;

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
          gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
          height: '100%',
          width: '100%',
          gap: '1px',
          position: 'absolute',
          top: 0,
          left: 0,
          padding: '1px'
        }}
      >
        {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, index) => {
          const rowIndex = Math.floor(index / division.verticalCount);
          const colIndex = index % division.verticalCount;
          const openingPane = data.openingPanes?.find(p => 
            p.panelIndex === panelIndex && 
            p.rowIndex === rowIndex && 
            p.colIndex === colIndex
          );
          
          return (
            <div
              key={index}
              style={{
                border: '1px solid rgba(0,0,0,0.2)',
                backgroundColor: openingPane ? 'rgba(124, 93, 250, 0.15)' : 'transparent',
                position: 'relative'
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="sketch-preview"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        border: '2px solid #DFE3FA',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        className="sketch-frame"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: data.frameColor || '#C0C0C0',
          display: 'flex'
        }}
      >
        {Array.from({ length: data.panels }).map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              border: '1px solid rgba(0,0,0,0.1)',
              position: 'relative',
              backgroundColor: data.glassType === 'frosted' 
                ? 'rgba(255,255,255,0.8)' 
                : 'rgba(220,225,255,0.15)',
              transform: data.openingPanels?.includes(index) 
                ? 'perspective(1000px) rotateY(-15deg)' 
                : 'none',
              transformOrigin: 'left',
              transition: 'transform 0.3s ease'
            }}
          >
            {renderPanelDivisions(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SketchPreview;
