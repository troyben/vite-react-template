import React from 'react';
import { ProductData } from './product-sketch';
import { getShapeClipPath, getShapeSVGPath } from '@/utils/shapeClipPath';

interface MiniSketchPreviewProps {
  sketch?: ProductData;
  widthPx?: number;
  heightPx?: number;
  pdfMode?: boolean;
}

// Helper for glass color
const getGlassColor = (sketch: ProductData, frameColor: string) => {
  switch (sketch.glassType) {
    case 'clear':
      return frameColor === '#C0C0C0'
        ? 'rgb(220,225,255)'
        : 'rgb(200,200,255)';
    case 'frosted':
      return 'rgb(255,255,255)';
    case 'custom-tint':
      return `${sketch.customGlassTint || '#AEEEEE'}80`;
    default:
      return 'rgba(200,200,255,0.3)';
  }
};

const renderMiniPreviewDimensionLines = (sketch: ProductData, widthPx: number, heightPx: number, pdfMode = false) => {
  if (!sketch) return null;
  const { width, height, unit, panels, panelWidths, panelDivisions, panelDivisionHeights } = sketch;
  const panelCount = panels || 1;
  const widths = panelWidths && panelWidths.length === panelCount ? panelWidths : Array(panelCount).fill(1);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = 0;

  // Scale all offsets and font sizes proportionally based on sketch size
  const isSmall = widthPx <= 150;
  const margin = isSmall ? 30 : 40;
  const marginTop = isSmall ? 15 : 30;
  const arrowOffset = isSmall ? 5 : 10;
  const tickLen = isSmall ? 4 : 8;
  const fontSize = pdfMode ? 14 : isSmall ? 7 : 11;
  const fontSizeLg = pdfMode ? 16 : isSmall ? 8 : 13;
  const fontWeight = isSmall ? 500 : 700;
  const strokeW = isSmall ? 0.75 : 1.5;
  const tickStrokeW = isSmall ? 0.5 : 1;
  const markerSize = isSmall ? 4 : 6;

  // For vertical panel heights (if panelDivisionHeights is present)
  let verticalTicks: any[] = [];
  if (panelDivisions && panelDivisionHeights && panelDivisionHeights.length) {
    const firstPanelHeights = panelDivisionHeights[0]?.rowHeights || [];
    const totalHeight = firstPanelHeights.reduce((a, b) => a + b, 0);
    let y = margin;
    for (let i = 0; i < firstPanelHeights.length; i++) {
      const h = firstPanelHeights[i];
      const hPx = (h / totalHeight) * heightPx;
      verticalTicks.push(
        <g key={i}>
          <line x1={margin - tickLen} y1={y} x2={margin} y2={y} stroke="#7E88C3" strokeWidth={tickStrokeW} />
          <text x={margin + widthPx / 2} y={y - (isSmall ? 3 : 8)} textAnchor="middle" fontSize={fontSize} fill="#7E88C3" fontWeight={fontWeight}>{h} {unit}</text>
        </g>
      );
      y += hPx;
    }
    verticalTicks.push(<line key="end" x1={margin - tickLen} y1={y} x2={margin} y2={y} stroke="#7E88C3" strokeWidth={tickStrokeW} />);
  }

  return (
    <svg
      width={widthPx + margin}
      height={heightPx + margin + marginTop}
      style={{
        position: 'absolute',
        left: -margin,
        top: -marginTop,
        pointerEvents: 'none',
        zIndex: 20
      }}
    >
      {/* Horizontal (top) dimension line */}
      <line x1={margin + arrowOffset} y1={marginTop * 0.6} x2={margin + widthPx - arrowOffset} y2={marginTop * 0.6} stroke="#7E88C3" strokeWidth={strokeW} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" />
      {/* Top ticks and panel width labels */}
      {widths.map((w, i) => {
        const px = (w / total) * widthPx;
        const left = margin + x;
        x += px;
        return (
          <g key={i}>
            <line x1={left} y1={marginTop * 0.6 - tickLen / 2} x2={left} y2={marginTop * 0.6 + tickLen / 2} stroke="#7E88C3" strokeWidth={tickStrokeW} />
            <text x={left + px / 2} y={marginTop * 0.6 - tickLen} textAnchor="middle" fontSize={fontSize} fill="#7E88C3" fontWeight={fontWeight}>{w} {unit}</text>
          </g>
        );
      })}
      {/* End tick */}
      <line x1={margin + widthPx} y1={marginTop * 0.6 - tickLen / 2} x2={margin + widthPx} y2={marginTop * 0.6 + tickLen / 2} stroke="#7E88C3" strokeWidth={tickStrokeW} />
      {/* Bottom (overall width) dimension line */}
      <line x1={margin + arrowOffset} y1={heightPx + margin} x2={margin + widthPx - arrowOffset} y2={heightPx + margin} stroke="#7E88C3" strokeWidth={strokeW} markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)" />
      <text x={margin + widthPx / 2} y={heightPx + margin + (isSmall ? 10 : 16)} textAnchor="middle" fontSize={fontSizeLg} fill="#7E88C3" fontWeight={fontWeight}>{width} {unit}</text>

      {/* Left (vertical) dimension line */}
      <line x1={margin - tickLen * 1.5} y1={marginTop + arrowOffset} x2={margin - tickLen * 1.5} y2={heightPx + marginTop - arrowOffset} stroke="#7E88C3" strokeWidth={strokeW} markerStart="url(#varrowTop)" markerEnd="url(#varrowBottom)" />

      {/* Vertical panel heights and labels */}
      {verticalTicks}
      <text x={isSmall ? 10 : 18} y={marginTop + heightPx / 2} textAnchor="middle" fontSize={fontSize} fill="#7E88C3" fontWeight={fontWeight} transform={`rotate(-90, ${isSmall ? 10 : 18}, ${marginTop + heightPx / 2})`}>{height} {unit}</text>
      <defs>
        <marker id="arrowLeft" markerWidth={markerSize} markerHeight={markerSize} refX={markerSize} refY={markerSize / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M${markerSize},0 L0,${markerSize / 2} L${markerSize},${markerSize}`} fill="#7E88C3" />
        </marker>
        <marker id="arrowRight" markerWidth={markerSize} markerHeight={markerSize} refX="0" refY={markerSize / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M0,0 L${markerSize},${markerSize / 2} L0,${markerSize}`} fill="#7E88C3" />
        </marker>
        <marker id="varrowTop" markerWidth={markerSize} markerHeight={markerSize} refX={markerSize} refY={markerSize / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M${markerSize},0 L0,${markerSize / 2} L${markerSize},${markerSize}`} fill="#7E88C3" />
        </marker>
        <marker id="varrowBottom" markerWidth={markerSize} markerHeight={markerSize} refX="0" refY={markerSize / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M0,0 L${markerSize},${markerSize / 2} L0,${markerSize}`} fill="#7E88C3" />
        </marker>
      </defs>
    </svg>
  );
};

const renderMiniPreviewPanel = (sketch: ProductData, panelIndex: number, frameColor: string, glassColor: string) => {
  const division = sketch.panelDivisions?.find(d => d.panelIndex === panelIndex);
  if (!division) return null;
  // Use a solid color for open panes
  const solidOpenColor = '#44D5B8'; // A shade of green for open glass
  const isPanelOpening = Array.isArray(sketch.openingPanels) && sketch.openingPanels.includes(panelIndex);
  const panelOpeningDirection = sketch.openingDirections?.[panelIndex];
  // Correct sliding logic: sliding if doorType is 'sliding' for doors or windowType === 'sliding' for windows
  const isSliding = (sketch.type === 'door' && sketch.doorType === 'sliding') ||
                    (sketch.type === 'window' && sketch.windowType === 'sliding');
  return (
    <div
      style={{
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
        zIndex: 0,
        overflow:  `${sketch.doorType === 'sliding' || sketch.windowType === 'sliding' ? 'hidden' : 'visible'}`,
      }}
    >
      {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, index) => {
        const rowIndex = Math.floor(index / division.verticalCount);
        const colIndex = index % division.verticalCount;
        const openingPane = sketch.openingPanes?.find(p =>
          p.panelIndex === panelIndex &&
          p.rowIndex === rowIndex &&
          p.colIndex === colIndex
        );
        // If panel is opening, treat all cells as open
        const isOpening = isPanelOpening || !!openingPane;
        // Transform logic
        let transform = 'none';
        let transformOrigin = 'center';
        let showHandle = false;
        let handleDirection = undefined;
        if (isPanelOpening && panelOpeningDirection) {
          showHandle = true;
          handleDirection = panelOpeningDirection;
          if (isSliding) {
            // Sliding transform for open panel
            switch (panelOpeningDirection) {
              case 'left':
                transform = 'translateX(-60%)';
                break;
              case 'right':
                transform = 'translateX(60%)';
                break;
              case 'top':
                transform = 'translateY(-60%)';
                break;
              case 'bottom':
                transform = 'translateY(60%)';
                break;
              default:
                break;
            }
          } else {
            // Hinged/tilt transform for open panel
            switch (panelOpeningDirection) {
              case 'left':
                transform = 'perspective(600px) translateZ(0) rotateY(-45deg) translateX(0%)';
                transformOrigin = '0 50%';
                break;
              case 'right':
                transform = 'perspective(600px) translateZ(0) rotateY(45deg) translateX(0%)';
                transformOrigin = '100% 50%';
                break;
              case 'top':
                transform = 'perspective(600px) translateZ(0) rotateX(55deg) translateY(0%)';
                transformOrigin = '100% 0';
                break;
              case 'bottom':
                transform = 'perspective(600px) translateZ(0) rotateX(-45deg) translateY(0%)';
                transformOrigin = '50% 100%';
                break;
              default:
                break;
            }
          }
        } else if (openingPane?.openingDirection) {
          showHandle = true;
          handleDirection = openingPane.openingDirection;
          if (isSliding) {
            // Sliding transform for open pane
            switch (openingPane.openingDirection) {
              case 'left':
                transform = 'translateX(-60%)';
                break;
              case 'right':
                transform = 'translateX(60%)';
                break;
              case 'top':
                transform = 'translateY(-60%)';
                break;
              case 'bottom':
                transform = 'translateY(60%)';
                break;
              default:
                break;
            }
          } else {
            // Hinged/tilt transform for open pane
            switch (openingPane.openingDirection) {
              case 'left':
                transform = 'perspective(300px) translateZ(0) rotateY(-45deg) translateX(0%)';
                transformOrigin = '0 50%';
                break;
              case 'right':
                transform = 'perspective(300px) translateZ(0) rotateY(45deg) translateX(0%)';
                transformOrigin = '100% 50%';
                break;
              case 'top':
                transform = 'perspective(600px) translateZ(0) rotateX(55deg) translateY(0%)';
                transformOrigin = '100% 0';
                break;
              case 'bottom':
                transform = 'perspective(300px) translateZ(0) rotateX(-45deg) translateY(0%)';
                transformOrigin = '50% 100%';
                break;
              default:
                break;
            }
          }
        }
        return (
          <div
            key={index}
            style={{
              border: `2px solid ${frameColor}`,
              backgroundColor: isOpening ? solidOpenColor : glassColor,
              position: 'relative',
              minWidth: 0,
              minHeight: 0,
              transition: 'all 0.3s',
              transform,
              transformOrigin,
              boxSizing: 'border-box',
              boxShadow: isOpening ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
              backfaceVisibility: 'hidden',
              zIndex: isOpening ? 99 : 0,
            }}
          >
            {showHandle && handleDirection && (
              <div
                style={{
                  position: 'absolute',
                  width:
                    handleDirection === 'left' || handleDirection === 'right'
                      ? '3px'
                      : '20px',
                  height:
                    handleDirection === 'top' || handleDirection === 'bottom'
                      ? '3px'
                      : '20px',
                  backgroundColor: frameColor,
                  borderRadius: '1px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  zIndex: 100,
                  ...{
                    left:
                      handleDirection === 'right'
                        ? '10%'
                        : handleDirection === 'left'
                        ? '90%'
                        : '50%',
                    top:
                      handleDirection === 'bottom'
                        ? '10%'
                        : handleDirection === 'top'
                        ? '90%'
                        : '50%',
                    transform: 'translate(-50%, -50%)',
                  },
                }}
              />
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
  const glassColor = getGlassColor(sketch, frameColor);
  const panelWidths =
    sketch.panelWidths && sketch.panelWidths.length === panelCount
      ? sketch.panelWidths
      : Array(panelCount).fill(1);
  const total = panelWidths.reduce((a, b) => a + b, 0);
  const flexes = panelWidths.map((w) => w / total);
  const isSmall = widthPx <= 150;
  const outerMarginTop = pdfMode ? 25 : isSmall ? 18 : 25;
  const outerMarginBottom = pdfMode ? 25 : isSmall ? 28 : 25;
  const outerMarginX = isSmall ? 10 : 0;
  const isNonRect = sketch.shape && sketch.shape.type !== 'rectangle';
  const svgFramePath = isNonRect ? getShapeSVGPath(sketch.shape, widthPx, heightPx) : null;

  return (
    <div style={{ position: 'relative', width: widthPx, height: heightPx, margin: `${outerMarginTop}px auto ${outerMarginBottom}px`, marginLeft: outerMarginX, background: '#fff' }}>
      {!pdfMode && renderMiniPreviewDimensionLines(sketch, widthPx, heightPx, pdfMode)}
      <div
        style={{
          display: 'flex',
          width: widthPx,
          height: heightPx,
          border: isNonRect ? 'none' : `2px solid ${frameColor}`,
          borderRadius: sketch.shape?.type === 'arch'
            ? `${(sketch.shape.archHeight ?? heightPx * 0.3)}px ${(sketch.shape.archHeight ?? heightPx * 0.3)}px 0 0`
            : 0,
          background: isNonRect ? 'transparent' : (frameColor === '#C0C0C0' ? '#E5E5E5' : frameColor),
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 0,
          clipPath: isNonRect
            ? getShapeClipPath(sketch.shape, widthPx, heightPx)
            : undefined,
        }}
      >
        {/* SVG frame overlay for non-rectangular shapes */}
        {svgFramePath && (
          <svg
            width={widthPx}
            height={heightPx}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <path
              d={svgFramePath}
              fill="none"
              stroke={frameColor}
              strokeWidth={isSmall ? 3 : 4}
              strokeLinejoin="miter"
            />
          </svg>
        )}
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
              border: 'none',
              boxSizing: 'border-box',
              zIndex: -2
            }}
          >
            {renderMiniPreviewPanel(sketch, i, frameColor, glassColor)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniSketchPreview;
