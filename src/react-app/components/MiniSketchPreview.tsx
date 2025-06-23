import React from 'react';
import { ProductData } from './ProductSketch';

interface MiniSketchPreviewProps {
  sketch?: ProductData;
  widthPx?: number;
  heightPx?: number;
  pdfMode?: boolean;
}

const renderMiniPreviewDimensionLines = (sketch: ProductData, widthPx: number, heightPx: number, pdfMode = false) => {
  if (!sketch) return null;
  const { width, height, unit, panels, panelWidths, panelDivisions, panelDivisionHeights } = sketch;
  const panelCount = panels || 1;
  const widths = panelWidths && panelWidths.length === panelCount ? panelWidths : Array(panelCount).fill(1);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = 0;
  const arrowOffset = 10;

  // For vertical panel heights (if panelDivisionHeights is present)
  let verticalTicks: any[] = [];
  if (panelDivisions && panelDivisionHeights && panelDivisionHeights.length) {
    // Use the first panel's rowHeights for vertical ticks (assuming all panels are the same)
    const firstPanelHeights = panelDivisionHeights[0]?.rowHeights || [];
    const totalHeight = firstPanelHeights.reduce((a, b) => a + b, 0);
    let y = 40;
    for (let i = 0; i < firstPanelHeights.length; i++) {
      const h = firstPanelHeights[i];
      const hPx = (h / totalHeight) * heightPx;
      // Center the label horizontally to the drawing
      verticalTicks.push(
        <g key={i}>
          <line x1={32} y1={y} x2={40} y2={y} stroke="#7E88C3" strokeWidth={1} />
          <text x={40 + widthPx / 2} y={y - (pdfMode ? 12 : 8)} textAnchor="middle" fontSize={pdfMode ? 14 : 11} fill="#7E88C3" fontWeight="bold">{h} {unit}</text>
        </g>
      );
      y += hPx;
    }
    // End tick
    verticalTicks.push(<line key="end" x1={32} y1={y} x2={40} y2={y} stroke="#7E88C3" strokeWidth={1} />);
  }

  return (
    <svg
      width={widthPx + 40}
      height={heightPx + 60}
      style={{
        position: 'absolute',
        left: -40,
        top: -30,
        pointerEvents: 'none',
        zIndex: 20
      }}
    >
      {/* Horizontal (top) dimension line */}
      <line x1={40 + arrowOffset} y1={18} x2={40 + widthPx - arrowOffset} y2={18} stroke="#7E88C3" strokeWidth={1.5} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" />
      {/* Top ticks and panel width labels */}
      {widths.map((w, i) => {
        const px = (w / total) * widthPx;
        const left = 40 + x;
        x += px;
        return (
          <g key={i}>
            <line x1={left} y1={10} x2={left} y2={26} stroke="#7E88C3" strokeWidth={1} />
            <text x={left + px / 2} y={pdfMode ? 2 : 10} textAnchor="middle" fontSize={pdfMode ? 14 : 11} fill="#7E88C3" fontWeight="bold">{w} {unit}</text>
          </g>
        );
      })}
      {/* End tick */}
      <line x1={40 + widthPx} y1={10} x2={40 + widthPx} y2={26} stroke="#7E88C3" strokeWidth={1} />
      {/* Bottom (overall width) dimension line */}
      <line x1={40 + arrowOffset} y1={heightPx + 40} x2={40 + widthPx - arrowOffset} y2={heightPx + 40} stroke="#7E88C3" strokeWidth={1.5} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" />
      <text x={40 + widthPx / 2} y={heightPx + (pdfMode ? 60 : 56)} textAnchor="middle" fontSize={pdfMode ? 16 : 13} fill="#7E88C3" fontWeight="bold">{width} {unit}</text>
     
      {/* Left (vertical) dimension line */}
      <line x1={32} y1={30 + arrowOffset} x2={32} y2={heightPx + 30 - arrowOffset} stroke="#7E88C3" strokeWidth={1.5} markerStart="url(#varrowTop)" markerEnd="url(#varrowBottom)" />

      {/* Vertical panel heights and labels */}
      {verticalTicks}
      <text x={18} y={heightPx / 2 + 40} textAnchor="middle" fontSize={pdfMode ? 14 : 11} fill="#7E88C3" fontWeight="bold" transform={`rotate(-90, 18, ${heightPx / 2 + 40})`}>{height} {unit}</text>
      <defs>
        <marker id="arrowLeft" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M6,0 L0,3 L6,6" fill="#7E88C3" />
        </marker>
        <marker id="arrowRight" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6" fill="#7E88C3" />
        </marker>
        <marker id="varrowTop" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M6,0 L0,3 L6,6" fill="#7E88C3" />
        </marker>
        <marker id="varrowBottom" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6" fill="#7E88C3" />
        </marker>
      </defs>
    </svg>
  );
};

const renderMiniPreviewPanel = (sketch: ProductData, panelIndex: number) => {
  const division = sketch.panelDivisions?.find(d => d.panelIndex === panelIndex);
  if (!division) return null;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
      gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
      height: '100%',
      width: '100%',
      gap: '2px',
      position: 'absolute',
      top: 0,
      left: 0,
      padding: '2px',
      boxSizing: 'border-box',
      zIndex: 2
    }}>
      {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, index) => {
        const rowIndex = Math.floor(index / division.verticalCount);
        const colIndex = index % division.verticalCount;
        const openingPane = sketch.openingPanes?.find(p =>
          p.panelIndex === panelIndex &&
          p.rowIndex === rowIndex &&
          p.colIndex === colIndex
        );
        // Opening effect: transform for open panes
        let transform = 'none';
        if (openingPane?.openingDirection) {
          switch (openingPane.openingDirection) {
            case 'left': transform = 'translateX(-15%) rotateY(-10deg)'; break;
            case 'right': transform = 'translateX(15%) rotateY(10deg)'; break;
            case 'top': transform = 'translateY(-15%) rotateX(10deg)'; break;
            case 'bottom': transform = 'translateY(15%) rotateX(-10deg)'; break;
            default: break;
          }
        }
        // Handle position
        const handleStyle = openingPane?.openingDirection ? {
          position: 'absolute',
          background: '#aaa',
          borderRadius: 2,
          zIndex: 3,
          ...(openingPane.openingDirection === 'left' || openingPane.openingDirection === 'right'
            ? {
                width: 12, height: 3,
                top: '50%', right: openingPane.openingDirection === 'left' ? 4 : 'unset', left: openingPane.openingDirection === 'right' ? 4 : 'unset',
                transform: 'translateY(-50%)'
              }
            : {
                width: 3, height: 12,
                left: '50%', bottom: openingPane.openingDirection === 'top' ? 4 : 'unset', top: openingPane.openingDirection === 'bottom' ? 4 : 'unset',
                transform: 'translateX(-50%)'
              })
        } : {};
        return (
          <div
            key={index}
            style={{
              border: '1px solid #bfc7d1',
              backgroundColor: openingPane ? 'rgba(124, 93, 250, 0.15)' : '#e9eaf3',
              position: 'relative',
              minWidth: 0,
              minHeight: 0,
              transition: 'transform 0.3s',
              transform,
            }}
          >
            {openingPane && (
              <div style={handleStyle} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const MiniSketchPreview: React.FC<MiniSketchPreviewProps> = ({ sketch, widthPx = 500, heightPx = 200, pdfMode = false }) => {
  if (!sketch) return null;
  const panelCount = sketch.panels || 1;
  const frameColor = sketch.frameColor || '#C0C0C0';
  const panelWidths =
    sketch.panelWidths && sketch.panelWidths.length === panelCount
      ? sketch.panelWidths
      : Array(panelCount).fill(1);
  const total = panelWidths.reduce((a, b) => a + b, 0);
  const flexes = panelWidths.map((w) => w / total);
  return (
    <div style={{ position: 'relative', width: widthPx, height: heightPx, margin: '25px auto', background: '#fff' }}>
      {!pdfMode && renderMiniPreviewDimensionLines(sketch, widthPx, heightPx, pdfMode)}
      <div
        style={{
          display: 'flex',
          width: widthPx,
          height: heightPx,
          border: `2px solid ${frameColor}`,
          borderRadius: 0,
          overflow: 'hidden',
          background: '#f8fafd',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2
        }}
      >
        {Array.from({ length: panelCount }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: flexes[i],
              height: '100%',
              minWidth: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              background: '#e9eaf3',
              border: '1px solid #bfc7d1',
              boxSizing: 'border-box',
              zIndex: 1
            }}
          >
            {renderMiniPreviewPanel(sketch, i)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniSketchPreview;
