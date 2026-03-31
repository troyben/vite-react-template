import React from 'react';
import PanelRenderer from './PanelRenderer';
import DimensionLines from './DimensionLines';
import { getShapeClipPath, getShapeSVGPath } from '@/utils/shapeClipPath';
import type { OpeningDirection, Unit, ActiveHingeSelector, ShapeConfig } from './types';

interface FramePreviewProps {
  panels: number;
  panelWidths: number[];
  width: number;
  height: number;
  unit: Unit;
  isSliding: boolean;
  frameColor: string;
  glassType: string;
  customGlassTint: string;
  openingPanels: number[];
  openingDirections: Record<number, OpeningDirection>;
  panelDivisions: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  openingPanes: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>;
  type: 'window' | 'door';
  doorType: 'hinged' | 'sliding';
  windowType: 'hinged' | 'sliding';
  activeHingeSelector: ActiveHingeSelector | null;
  shape?: ShapeConfig;
  previewWidth?: number;
  previewHeight?: number;
}

// Helper: get L-shape outline vertices as [x%, y%] pairs
function getLShapeVertices(cutW: number, cutH: number, pos: string): number[][] {
  switch (pos) {
    case 'top-right':
      return [[0, 0], [100 - cutW, 0], [100 - cutW, cutH], [100, cutH], [100, 100], [0, 100]];
    case 'top-left':
      return [[cutW, 0], [100, 0], [100, 100], [0, 100], [0, cutH], [cutW, cutH]];
    case 'bottom-right':
      return [[0, 0], [100, 0], [100, 100 - cutH], [100 - cutW, 100 - cutH], [100 - cutW, 100], [0, 100]];
    case 'bottom-left':
      return [[0, 0], [100, 0], [100, 100], [cutW, 100], [cutW, 100 - cutH], [0, 100 - cutH]];
    default:
      return [[0, 0], [100, 0], [100, 100], [0, 100]];
  }
}

// Helper: clip a global polygon to a panel's local coordinate space
function polygonForPanel(globalVerts: number[][], panelLeftX: number, panelWidth: number): string {
  // We need to intersect the polygon with the panel's vertical strip and convert to local coords.
  // Simplified: just remap x coordinates to panel-local and let the clip handle it.
  const points = globalVerts.map(([vx, vy]) => {
    const lx = ((vx - panelLeftX) / panelWidth) * 100;
    return `${lx}% ${vy}%`;
  });
  return `polygon(${points.join(', ')})`;
}

const FramePreview: React.FC<FramePreviewProps> = ({
  panels,
  panelWidths,
  width,
  height,
  unit,
  isSliding,
  frameColor,
  glassType,
  customGlassTint,
  openingPanels,
  openingDirections,
  panelDivisions,
  openingPanes,
  type,
  doorType,
  windowType,
  activeHingeSelector,
  shape,
  previewWidth,
  previewHeight,
}) => {
  const frameW = previewWidth ?? (panels < 4 ? 400 : 700);
  const frameH = previewHeight ?? 400;
  const clipPath = shape && shape.type !== 'rectangle'
    ? getShapeClipPath(shape, frameW, frameH)
    : undefined;
  const archBorderRadius = shape?.type === 'arch'
    ? `${(shape.archHeight ?? frameH * 0.3)}px ${(shape.archHeight ?? frameH * 0.3)}px 0 0`
    : '0';

  const isNonRect = shape && shape.type !== 'rectangle';

  // Compute per-panel clip-paths so each panel follows the shape edges
  const getPanelClipPath = (panelIndex: number): string | undefined => {
    if (!isNonRect) return undefined;

    const panelCount = panels || 1;
    const leftPct = panelIndex / panelCount;
    const rightPct = (panelIndex + 1) / panelCount;
    const leftX = leftPct * 100;
    const rightX = rightPct * 100;

    switch (shape!.type) {
      case 'trapezoid': {
        const topW = shape!.topWidth ?? width * 0.6;
        const insetPct = ((width - topW) / 2 / width) * 100;
        // Top edge y = 0, interpolate x from inset
        const topLeftX = insetPct + leftPct * (100 - 2 * insetPct);
        const topRightX = insetPct + rightPct * (100 - 2 * insetPct);
        // Convert to panel-local coordinates (0-100% within this panel's box)
        const pW = rightX - leftX;
        const tlLocal = ((topLeftX - leftX) / pW) * 100;
        const trLocal = ((topRightX - leftX) / pW) * 100;
        return `polygon(${tlLocal}% 0%, ${trLocal}% 0%, 100% 100%, 0% 100%)`;
      }
      case 'triangle': {
        const peak = (shape!.peakPosition ?? 0.5) * 100;
        // Top edge: the peak is a single point; each panel slice has a portion
        const peakInPanel = ((peak - leftX) / (rightX - leftX)) * 100;
        // If peak is outside this panel, clip to the slope lines
        const leftY = peak <= leftX ? (1 - leftX / peak) * 100 : 100; // nonsense — recalculate
        // Simpler approach: compute the triangle top-y at leftX and rightX
        const topYAtLeft = peak === 0 ? 100 : leftX <= peak
          ? (1 - leftX / peak) * 100
          : (leftX - peak) / (100 - peak) * 100;
        // Actually let's use the correct geometry:
        // Triangle vertices: (peak%, 0%), (0%, 100%), (100%, 100%)
        // The top edge from (0%, 100%) to (peak%, 0%) and (peak%, 0%) to (100%, 100%)
        // At any x%, the y% of the top edge is:
        const topYAt = (xPct: number): number => {
          if (xPct <= peak) {
            // Left slope: from (0, 100) to (peak, 0)
            return peak === 0 ? 100 : 100 - (xPct / peak) * 100;
          } else {
            // Right slope: from (peak, 0) to (100, 100)
            return (100 - peak) === 0 ? 100 : ((xPct - peak) / (100 - peak)) * 100;
          }
        };
        const tlY = topYAt(leftX);
        const trY = topYAt(rightX);
        // Panel-local: convert y values, x is 0% and 100%
        // If peak falls within this panel, we need the peak vertex too
        if (peak > leftX && peak < rightX) {
          const peakLocal = ((peak - leftX) / (rightX - leftX)) * 100;
          return `polygon(${peakLocal}% 0%, 100% ${trY}%, 100% 100%, 0% 100%, 0% ${tlY}%)`;
        }
        return `polygon(0% ${tlY}%, 100% ${trY}%, 100% 100%, 0% 100%)`;
      }
      case 'arch': {
        // Arch: rect bottom + semicircular top. Per-panel, the top edge follows the arc.
        const archH = shape!.archHeight ?? height * 0.3;
        const archHPct = (archH / height) * 100;
        // The arch is a semicircle spanning the full width, top center is at y=0
        // At any x (0-1), the arch y = archHPct * (1 - sqrt(1 - (2x-1)^2))
        // for a semicircle centered at x=0.5
        const archYAt = (xFrac: number): number => {
          const dx = 2 * xFrac - 1; // -1 to 1
          const sqr = 1 - dx * dx;
          if (sqr <= 0) return archHPct;
          return archHPct * (1 - Math.sqrt(sqr));
        };
        // Sample several points along the top for a smooth curve
        const steps = 12;
        const points: string[] = [];
        for (let s = 0; s <= steps; s++) {
          const xGlobal = leftPct + (s / steps) * (rightPct - leftPct);
          const yPct = archYAt(xGlobal);
          const xLocal = (s / steps) * 100;
          points.push(`${xLocal}% ${yPct}%`);
        }
        points.push('100% 100%', '0% 100%');
        return `polygon(${points.join(', ')})`;
      }
      case 'l-shape': {
        const cutW = ((shape!.cutoutWidth ?? width * 0.4) / width) * 100;
        const cutH = ((shape!.cutoutHeight ?? height * 0.4) / height) * 100;
        const pos = shape!.cutoutPosition || 'top-right';
        // L-shape clip for each panel: determine if the panel overlaps the cutout region
        // For simplicity, apply the full L-shape clip and let CSS handle it
        // The panel-local clip needs to translate the L outline to panel-local coords
        const lVertices = getLShapeVertices(cutW, cutH, pos);
        const pW = rightX - leftX;
        const localPoints = lVertices.map(([vx, vy]) => {
          const lx = ((vx - leftX) / pW) * 100;
          return `${lx}% ${vy}%`;
        });
        return `polygon(${localPoints.join(', ')})`;
      }
      case 'pentagon': {
        const verts = [[50, 0], [100, 38], [81, 100], [19, 100], [0, 38]];
        const pW = rightX - leftX;
        return polygonForPanel(verts, leftX, pW);
      }
      case 'hexagon': {
        const verts = [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]];
        const pW = rightX - leftX;
        return polygonForPanel(verts, leftX, pW);
      }
      default:
        return undefined;
    }
  };

  // Inset the SVG frame by half the stroke width so stroke stays inside the shape
  const frameStroke = 6;
  const inset = frameStroke / 2;
  const svgFramePath = isNonRect ? getShapeSVGPath(shape, frameW - frameStroke, frameH - frameStroke) : null;

  return (
    <div className="product-preview" style={{ position: 'relative', overflow: 'visible' }}>
      {/* Old dimension lines — only for rectangle shapes (ProductSketch modal usage) */}
      {!isNonRect && (
        <DimensionLines
          panels={panels}
          panelWidths={panelWidths}
          width={width}
          height={height}
          unit={unit}
        />
      )}
      {/* Wrapper ensures SVG frame and clipped shape share the same origin */}
      <div style={{ position: 'relative', width: `${frameW}px`, height: `${frameH}px` }}>
        {/* SVG frame overlay — OUTSIDE clipped container so stroke stays inside shape */}
        {svgFramePath && (
          <svg
            width={frameW}
            height={frameH}
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
              strokeWidth={frameStroke}
              strokeLinejoin="miter"
              transform={`translate(${inset}, ${inset})`}
            />
          </svg>
        )}
        <div
          className="product-frame"
          style={{
            width: `${frameW}px`,
            height: `${frameH}px`,
            border: isNonRect ? 'none' : `4px solid ${frameColor}`,
            position: 'relative',
            borderRadius: archBorderRadius,
            perspective: '2000px',
            backgroundColor: isNonRect ? 'transparent' : (frameColor === '#C0C0C0' ? '#E5E5E5' : frameColor),
            padding: 0,
            transform: "scale(1)",
            transformOrigin: 'center center',
            boxSizing: 'border-box',
            display: 'flex',
            overflow: isSliding ? 'hidden' : 'visible',
            clipPath: clipPath || undefined,
          }}
        >
        {Array.from({ length: panels }).map((_, index) => {
          const panelClip = getPanelClipPath(index);
          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: '100%',
                display: 'block',
                position: 'relative',
                clipPath: panelClip || undefined,
                backgroundColor: frameColor === '#C0C0C0' ? '#E5E5E5' : frameColor,
                border: isNonRect ? 'none' : `3px solid ${frameColor}`,
                boxSizing: 'border-box',
              }}
            >
              <PanelRenderer
                panelIndex={index}
                panels={panels}
                openingPanels={openingPanels}
                openingDirections={openingDirections}
                isSliding={isSliding}
                frameColor={frameColor}
                glassType={glassType}
                customGlassTint={customGlassTint}
                panelDivisions={panelDivisions}
                openingPanes={openingPanes}
                type={type}
                doorType={doorType}
                windowType={windowType}
                activeHingeSelector={activeHingeSelector}
              />
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default FramePreview;
