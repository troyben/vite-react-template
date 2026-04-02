import React from 'react';
import type { Unit } from './types';

interface DimensionLinesProps {
  panels: number;
  panelWidths: number[];
  width: number;
  height: number;
  unit: Unit;
  frameWidth: number;
  frameHeight: number;
}

const DimensionLines: React.FC<DimensionLinesProps> = ({
  panels,
  panelWidths,
  width,
  height,
  unit,
  frameWidth,
  frameHeight,
}) => {
  const offset = 10;

  // Panel widths in px: always divide frameWidth equally, regardless of panelWidths values
  const panelPixelWidths = Array(panels).fill(frameWidth / panels);

  // Calculate x positions for panel boundaries (fixed equal parts)
  let acc = 0;
  const panelBoundaries = panelPixelWidths.map((w, i) => {
    const start = acc;
    acc += w;
    return { start, end: acc, width: w, index: i };
  });

  return (
    <>
      {/* Panel widths dimension lines at the top, close to the frame */}
      <div
        className="dimension-label dimension-label-panel-widths"
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% - ${frameHeight / 2 + 18}px)`,
          transform: `translateX(-50%)`,
          width: `${frameWidth}px`,
          height: '24px',
          pointerEvents: 'none',
          zIndex: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: 0 }}>
          {panelBoundaries.map((panel, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: `${panel.start}px`,
                  top: "-5px",
                  width: `${panel.width}px`,
                  height: 0,
                  pointerEvents: 'none',
                }}
              >
                {/* Panel width line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: `${panel.width}px`,
                    height: 0,
                    borderTop: '1.5px dashed #BDBDBD',
                    top: 0,
                  }}
                />
                {/* Left mini arrow */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: -6,
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '7px solid #BDBDBD',
                  }}
                />
                {/* Right mini arrow */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${panel.width - 7}px`,
                    top: -6,
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '7px solid #BDBDBD',
                  }}
                />
                {/* Panel width label centered above the line */}
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: "-25px",
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    color: '#7E88C3',
                    fontWeight: 700,
                    fontSize: 13,
                    padding: '0 8px',
                    borderRadius: 3,
                    border: '1px solid #DFE3FA',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {panelWidths[i]} {unit}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Bottom horizontal dimension (width) */}
      <div
        className="dimension-label dimension-label-bottom"
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% + ${frameHeight / 2 + offset}px)`,
          transform: `translateX(-50%)`,
          width: `${frameWidth}px`,
          height: '24px',
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: 0 }}>
          {/* Line */}
          <div
            className="dimension-line"
            style={{
              width: '100%',
              height: 0,
              borderTop: '2px solid #7E88C3',
              position: 'absolute',
              top: 10,
              left: 0,
            }}
          />
          {/* Left arrow */}
          <div
            className="dimension-arrow"
            style={{
              position: 'absolute',
              left: 0,
              top: 2,
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '10px solid #7E88C3',
            }}
          />
          {/* Right arrow */}
          <div
            className="dimension-arrow"
            style={{
              position: 'absolute',
              right: 0,
              top: 2,
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '10px solid #7E88C3',
            }}
          />
          {/* Label centered below the line */}
          <span
            className="dimension-text"
            style={{
              position: 'absolute',
              left: '50%',
              top: 16,
              transform: 'translateX(-50%)',
              background: '#fff',
              color: '#7E88C3',
              fontWeight: 700,
              fontSize: 15,
              padding: '0 8px',
              borderRadius: 4,
              border: '1px solid #DFE3FA',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              whiteSpace: 'nowrap'
            }}
          >
            {width} {unit}
          </span>
        </div>
      </div>
      {/* Left vertical dimension (height) */}
      <div
        className="dimension-label dimension-label-left"
        style={{
          position: 'absolute',
          left: `calc(50% - ${frameWidth / 1.6 + offset}px)`,
          top: '50%',
          transform: `translateY(-50%)`,
          height: `${frameHeight}px`,
          width: '32px',
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ position: 'relative', height: '100%', width: 0 }}>
          {/* Line */}
          <div
            className="dimension-line"
            style={{
              height: '100%',
              width: 0,
              borderLeft: '2px solid #7E88C3',
              position: 'absolute',
              left: 10,
              top: 0,
            }}
          />
          {/* Top arrow */}
          <div
            className="dimension-arrow"
            style={{
              position: 'absolute',
              left: 2,
              top: 0,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '10px solid #7E88C3',
            }}
          />
          {/* Bottom arrow */}
          <div
            className="dimension-arrow"
            style={{
              position: 'absolute',
              left: 2,
              bottom: 0,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #7E88C3',
            }}
          />
          {/* Label at left of line, vertically centered and rotated */}
          <span
            className="dimension-text"
            style={{
              position: 'absolute',
              left: 25,
              top: '50%',
              transform: 'translate(-100%, -50%) rotate(-90deg)',
              background: '#fff',
              color: '#7E88C3',
              fontWeight: 700,
              fontSize: 15,
              padding: '0 8px',
              borderRadius: 4,
              border: '1px solid #DFE3FA',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              whiteSpace: 'nowrap',
            }}
          >
            {height} {unit}
          </span>
        </div>
      </div>
    </>
  );
};

export default DimensionLines;
