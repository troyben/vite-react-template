import React from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';

// Utils
import type { Point } from './utils/types';
import {
  MARGIN,
  BOTTOM_LABEL_SPACE,
  DIM_COLOR,
  DIM_FONT,
  FRAME_STROKE,
  DIVIDER_STROKE,
  DIM_OFFSET,
  MARKER_SIZE,
} from './utils/types';
import { getGlassColor } from './utils/glass-color';
import { getArchRy, getRealVertices, scaleVertices, getShapePath } from './utils/shape-path';
import { getOutwardNormal, realEdgeLength, isBottomEdge } from './utils/geometry';
import { getPanelDividers, getPanelPolygonPoints, getPanelCenter } from './utils/panels';
import { getTopYAtX, getBottomYAtX, getLeftXAtY, getRightXAtY } from './utils/boundaries';
import { getOpeningIndicator } from './utils/opening-indicators';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ShapeCanvasProps {
  shape: ShapeConfig;
  width: number;       // real-world width (mm)
  height: number;      // real-world height (mm)
  unit: string;
  panels: number;
  panelWidths: number[];
  frameColor: string;
  glassType: string;
  customGlassTint?: string;
  openingPanels: number[];
  openingDirections: Record<number, string>;
  isSliding: boolean;
  panelDivisions?: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  shape,
  width,
  height,
  unit,
  panels,
  panelWidths,
  frameColor,
  glassType,
  customGlassTint,
  openingPanels,
  openingDirections,
  isSliding,
  panelDivisions,
}) => {
  // Fixed drawing area -- the shape always fills this box.
  // The SVG scales to the container via preserveAspectRatio, not by changing the viewBox.
  const drawW = 180;
  const drawH = 180;

  const totalW = drawW + 2 * MARGIN;
  const totalH = drawH + 2 * MARGIN + BOTTOM_LABEL_SPACE;

  // Compute vertices
  const realVerts = getRealVertices(shape, width, height);
  const svgVerts = scaleVertices(realVerts, width, height, drawW, drawH);

  // Shape outline path
  const shapePath = getShapePath(shape, svgVerts, drawW, drawH, width, height);

  // Glass color
  const glassColor = getGlassColor(glassType, frameColor, customGlassTint);

  // Panel dividers
  const dividers = getPanelDividers(
    shape, panels, panelWidths, svgVerts,
    drawW, drawH, width, height,
  );

  // Shape center (for outward-normal computation)
  const svgCenterX = svgVerts.reduce((s, v) => s + v.x, 0) / svgVerts.length;
  const svgCenterY = svgVerts.reduce((s, v) => s + v.y, 0) / svgVerts.length;

  // Edges for dimension lines (skip bottom edge)
  const maxRealY = Math.max(...realVerts.map((v) => v.y));
  const edges: Array<{
    sv1: Point;
    sv2: Point;
    realLen: number;
  }> = [];

  for (let i = 0; i < svgVerts.length; i++) {
    const j = (i + 1) % svgVerts.length;
    const rv1 = realVerts[i];
    const rv2 = realVerts[j];
    if (isBottomEdge(rv1, rv2, maxRealY)) continue;
    edges.push({
      sv1: svgVerts[i],
      sv2: svgVerts[j],
      realLen: realEdgeLength(rv1, rv2),
    });
  }

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ width: '100%', height: '88vh' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Defs: arrow markers for dimension lines */}
      <defs>
        <marker
          id="sc-arrowL"
          markerWidth={MARKER_SIZE}
          markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE}
          refY={MARKER_SIZE / 2}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d={`M${MARKER_SIZE},0 L0,${MARKER_SIZE / 2} L${MARKER_SIZE},${MARKER_SIZE}`}
            fill={DIM_COLOR}
          />
        </marker>
        <marker
          id="sc-arrowR"
          markerWidth={MARKER_SIZE}
          markerHeight={MARKER_SIZE}
          refX="0"
          refY={MARKER_SIZE / 2}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE}`}
            fill={DIM_COLOR}
          />
        </marker>
        {/* Clip path matching shape outline -- used to contain opening indicators */}
        <clipPath id="sc-shape-clip">
          <path d={shapePath} />
        </clipPath>
      </defs>

      {/* --- Layer 1: Glass fill per panel --- */}
      {Array.from({ length: panels }).map((_, i) => {
        const pts = getPanelPolygonPoints(
          shape, i, panels, panelWidths, svgVerts,
          drawW, drawH, width, height,
        );
        if (!pts) return null;
        const isOpening = openingPanels.includes(i);
        const fillColor = isOpening ? '#44D5B880' : glassColor;
        return (
          <polygon
            key={`glass-${i}`}
            points={pts}
            fill={fillColor}
            stroke="none"
          />
        );
      })}

      {/* --- Layer 2: Panel divider lines --- */}
      {dividers.map((d, i) => (
        <line
          key={`div-${i}`}
          x1={d.x}
          y1={d.topY}
          x2={d.x}
          y2={d.bottomY}
          stroke={frameColor}
          strokeWidth={DIVIDER_STROKE}
        />
      ))}

      {/* --- Layer 2b: Pane subdivision lines (double thin lines within each panel) --- */}
      {panelDivisions && panelDivisions.map((div) => {
        const { panelIndex, horizontalCount, verticalCount } = div;
        if (horizontalCount <= 1 && verticalCount <= 1) return null;

        // Get this panel's bounding region
        const total = panelWidths.reduce((a, b) => a + b, 0);
        let leftFrac = 0;
        for (let i = 0; i < panelIndex; i++) {
          leftFrac += (panelWidths[i] ?? 0) / total;
        }
        const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
        const panelLeft = MARGIN + leftFrac * drawW;
        const panelRight = MARGIN + rightFrac * drawW;
        const panelW = panelRight - panelLeft;

        // Find top and bottom Y at this panel's x range by sampling the center x
        const panelCenterX = (panelLeft + panelRight) / 2;
        const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
        const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
        const panelH = panelBottomY - panelTopY;

        const gap = 1; // gap between double lines
        const lines: React.ReactNode[] = [];

        // Horizontal subdivision lines (rows)
        for (let r = 1; r < horizontalCount; r++) {
          const frac = r / horizontalCount;
          const y = panelTopY + frac * panelH;
          // Find actual left and right x at this y by intersecting with shape edges
          const lx = getLeftXAtY(y, svgVerts, shape, drawW, drawH, width, height);
          const rx = getRightXAtY(y, svgVerts, shape, drawW, drawH, width, height);
          const clippedLeft = Math.max(panelLeft, lx);
          const clippedRight = Math.min(panelRight, rx);
          lines.push(
            <line key={`pane-h-${panelIndex}-${r}-a`}
              x1={clippedLeft} y1={y - gap / 2} x2={clippedRight} y2={y - gap / 2}
              stroke={frameColor} strokeWidth={0.8} />,
            <line key={`pane-h-${panelIndex}-${r}-b`}
              x1={clippedLeft} y1={y + gap / 2} x2={clippedRight} y2={y + gap / 2}
              stroke={frameColor} strokeWidth={0.8} />,
          );
        }

        // Vertical subdivision lines (columns)
        for (let c = 1; c < verticalCount; c++) {
          const frac = c / verticalCount;
          const x = panelLeft + frac * panelW;
          // Find top and bottom y at this x
          const topY = getTopYAtX(x, svgVerts, shape, drawW, drawH, width, height);
          const botY = getBottomYAtX(x, svgVerts);
          lines.push(
            <line key={`pane-v-${panelIndex}-${c}-a`}
              x1={x - gap / 2} y1={topY} x2={x - gap / 2} y2={botY}
              stroke={frameColor} strokeWidth={0.8} />,
            <line key={`pane-v-${panelIndex}-${c}-b`}
              x1={x + gap / 2} y1={topY} x2={x + gap / 2} y2={botY}
              stroke={frameColor} strokeWidth={0.8} />,
          );
        }

        return <g key={`panes-${panelIndex}`}>{lines}</g>;
      })}

      {/* --- Layer 3: Frame border --- */}
      <path
        d={shapePath}
        fill="none"
        stroke={frameColor}
        strokeWidth={FRAME_STROKE}
        strokeLinejoin="miter"
      />

      {/* --- Layer 4: Opening indicators (clipped to shape outline) --- */}
      <g clipPath="url(#sc-shape-clip)">
        {openingPanels.map((panelIdx) => {
          const dir = openingDirections[panelIdx];
          if (!dir) return null;
          const { cx, cy, w: pw, h: ph } = getPanelCenter(
            shape, panelIdx, panels, panelWidths, svgVerts,
            drawW, drawH, width, height,
          );
          return getOpeningIndicator(dir, isSliding, cx, cy, pw, ph, `opening-${panelIdx}`);
        })}
      </g>

      {/* --- Layer 5: Dimension lines for each non-bottom edge --- */}
      {(() => {
        // Pre-compute all label positions, then stagger any that overlap
        const dimData = edges.map((edge, i) => {
          const { nx, ny } = getOutwardNormal(
            edge.sv1.x, edge.sv1.y,
            edge.sv2.x, edge.sv2.y,
            svgCenterX, svgCenterY,
          );
          return { edge, nx, ny, idx: i };
        });

        // Check if two label positions are too close and stagger offsets
        const offsets = dimData.map(() => DIM_OFFSET);
        for (let a = 0; a < dimData.length; a++) {
          for (let b = a + 1; b < dimData.length; b++) {
            const da = dimData[a], db = dimData[b];
            const midAx = (da.edge.sv1.x + da.edge.sv2.x) / 2 + da.nx * offsets[a];
            const midAy = (da.edge.sv1.y + da.edge.sv2.y) / 2 + da.ny * offsets[a];
            const midBx = (db.edge.sv1.x + db.edge.sv2.x) / 2 + db.nx * offsets[b];
            const midBy = (db.edge.sv1.y + db.edge.sv2.y) / 2 + db.ny * offsets[b];
            const dist = Math.sqrt((midAx - midBx) ** 2 + (midAy - midBy) ** 2);
            if (dist < 28) {
              // Push the shorter edge further out
              if (da.edge.realLen <= db.edge.realLen) {
                offsets[a] = offsets[a] + 14;
              } else {
                offsets[b] = offsets[b] + 14;
              }
            }
          }
        }

        return dimData.map(({ edge, nx, ny, idx }, i) => {
          const off = offsets[i];
          const lx1 = edge.sv1.x + nx * off;
          const ly1 = edge.sv1.y + ny * off;
          const lx2 = edge.sv2.x + nx * off;
          const ly2 = edge.sv2.y + ny * off;

          // Label midpoint along the dimension line
          const labelX = (lx1 + lx2) / 2 + nx * 8;
          const labelY = (ly1 + ly2) / 2 + ny * 8;

          const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
          const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

          return (
            <g key={`dim-${idx}`}>
              {/* Extension lines */}
              <line
                x1={edge.sv1.x} y1={edge.sv1.y}
                x2={lx1} y2={ly1}
                stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
              />
              <line
                x1={edge.sv2.x} y1={edge.sv2.y}
                x2={lx2} y2={ly2}
                stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
              />
              {/* Dimension line */}
              <line
                x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke={DIM_COLOR} strokeWidth={0.8}
                markerStart="url(#sc-arrowL)" markerEnd="url(#sc-arrowR)"
              />
              {/* Label */}
              <text
                x={labelX} y={labelY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={600}
                transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
              >
                {edge.realLen} {unit}
              </text>
            </g>
          );
        });
      })()}

      {/* --- Layer 5b: Arch dimensions (height + width at spring line) --- */}
      {shape.type === 'arch' && (() => {
        const isSemicircle = (shape.archType ?? 'semicircle') === 'semicircle';
        const archH = isSemicircle ? width / 2 : (shape.archHeight ?? height * 0.3);
        const archHPx = getArchRy(shape, drawW, drawH, height);
        const apexY = MARGIN; // top of arch
        const springY = MARGIN + archHPx; // where arch meets straight sides
        const centerX = MARGIN + drawW / 2;

        // --- Arch height: vertical dimension on the right side ---
        const hLineX = MARGIN + drawW + DIM_OFFSET;
        const hLabelX = hLineX + 8;
        const hMidY = (apexY + springY) / 2;

        // --- Arch width at spring line: horizontal dimension above the arch ---
        const wLineY = MARGIN - DIM_OFFSET;
        const wLabelY = wLineY - 8;
        const archLeft = MARGIN;
        const archRight = MARGIN + drawW;

        return (
          <g>
            {/* Arch height -- vertical dimension line on right */}
            <line x1={MARGIN + drawW} y1={apexY} x2={hLineX} y2={apexY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={MARGIN + drawW} y1={springY} x2={hLineX} y2={springY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={hLineX} y1={apexY} x2={hLineX} y2={springY}
              stroke={DIM_COLOR} strokeWidth={0.8}
              markerStart="url(#sc-arrowL)" markerEnd="url(#sc-arrowR)" />
            <text x={hLabelX} y={hMidY}
              textAnchor="start" dominantBaseline="middle"
              fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={600}
              transform={`rotate(90, ${hLabelX}, ${hMidY})`}>
              {Math.round(archH)} {unit}
            </text>

            {/* Arch width -- horizontal dimension line above */}
            <line x1={archLeft} y1={apexY} x2={archLeft} y2={wLineY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={archRight} y1={apexY} x2={archRight} y2={wLineY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={archLeft} y1={wLineY} x2={archRight} y2={wLineY}
              stroke={DIM_COLOR} strokeWidth={0.8}
              markerStart="url(#sc-arrowL)" markerEnd="url(#sc-arrowR)" />
            <text x={centerX} y={wLabelY}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={600}>
              {width} {unit}
            </text>
          </g>
        );
      })()}

      {/* --- Layer 6: Bottom edge dimension (same style as other edges) --- */}
      {(() => {
        // Find the bottom edge from real vertices
        const bottomRV1 = realVerts.find((_, i) => {
          const j = (i + 1) % realVerts.length;
          return isBottomEdge(realVerts[i], realVerts[j], maxRealY);
        });
        const bottomIdx = realVerts.indexOf(bottomRV1!);
        if (bottomIdx < 0) return null;

        const j = (bottomIdx + 1) % svgVerts.length;
        const sv1 = svgVerts[bottomIdx];
        const sv2 = svgVerts[j];
        const rv1 = realVerts[bottomIdx];
        const rv2 = realVerts[j];
        const len = realEdgeLength(rv1, rv2);

        // Outward normal (pointing down for bottom edge)
        const { nx, ny } = getOutwardNormal(
          sv1.x, sv1.y, sv2.x, sv2.y,
          svgCenterX, svgCenterY,
        );

        const lx1 = sv1.x + nx * DIM_OFFSET;
        const ly1 = sv1.y + ny * DIM_OFFSET;
        const lx2 = sv2.x + nx * DIM_OFFSET;
        const ly2 = sv2.y + ny * DIM_OFFSET;

        const labelX = (lx1 + lx2) / 2 + nx * 8;
        const labelY = (ly1 + ly2) / 2 + ny * 8;

        const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
        const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

        return (
          <g>
            {/* Extension lines */}
            <line
              x1={sv1.x} y1={sv1.y}
              x2={lx1} y2={ly1}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
            />
            <line
              x1={sv2.x} y1={sv2.y}
              x2={lx2} y2={ly2}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
            />
            {/* Dimension line */}
            <line
              x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={DIM_COLOR} strokeWidth={0.8}
              markerStart="url(#sc-arrowL)"
              markerEnd="url(#sc-arrowR)"
            />
            {/* Label */}
            <text
              x={labelX} y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={DIM_FONT}
              fill={DIM_COLOR}
              fontWeight={600}
              transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
            >
              {len} {unit}
            </text>
          </g>
        );
      })()}
    </svg>
  );
};

export default ShapeCanvas;
