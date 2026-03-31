import React from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARGIN = 40;               // space around shape for dimension labels
const BOTTOM_LABEL_SPACE = 20;   // extra room below shape for bottom dimension
const DIM_COLOR = '#7E88C3';
const DIM_FONT = 8;
const FRAME_STROKE = 4;
const DIVIDER_STROKE = 1.5;
const DIM_OFFSET = 16;           // how far dimension lines sit from the shape edge
const MARKER_SIZE = 4;
const ARCH_CURVE_STEPS = 24;     // segments for arch curves

// ---------------------------------------------------------------------------
// Glass color helper (matches MiniSketchPreview)
// ---------------------------------------------------------------------------

function getGlassColor(
  glassType: string,
  frameColor: string,
  customTint?: string,
): string {
  switch (glassType) {
    case 'clear':
      return frameColor === '#C0C0C0'
        ? 'rgba(200,210,255,0.3)'
        : 'rgba(200,200,255,0.3)';
    case 'frosted':
      return 'rgba(255,255,255,0.8)';
    case 'custom-tint':
      return `${customTint || '#AEEEEE'}80`;
    default:
      return 'rgba(200,200,255,0.3)';
  }
}

// ---------------------------------------------------------------------------
// Vertex computation — real-world coordinates (mm)
//
// These are the ACTUAL vertices in real dimensions. They are used to:
// 1. Compute real-world edge lengths for dimension labels
// 2. Scale proportionally into SVG drawing-area coordinates
// ---------------------------------------------------------------------------

function getRealVertices(
  shape: ShapeConfig,
  w: number,
  h: number,
): Point[] {
  switch (shape.type) {
    case 'rectangle':
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];

    case 'trapezoid': {
      const topW = shape.topWidth ?? w * 0.6;
      const inset = (w - topW) / 2;
      return [
        { x: inset, y: 0 },
        { x: w - inset, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }

    case 'triangle': {
      const peakX = (shape.peakPosition ?? 0.5) * w;
      return [
        { x: peakX, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }

    case 'pentagon':
      return [
        { x: w * 0.5, y: 0 },
        { x: w, y: h * 0.38 },
        { x: w * 0.81, y: h },
        { x: w * 0.19, y: h },
        { x: 0, y: h * 0.38 },
      ];

    case 'hexagon':
      return [
        { x: w * 0.25, y: 0 },
        { x: w * 0.75, y: 0 },
        { x: w, y: h * 0.5 },
        { x: w * 0.75, y: h },
        { x: w * 0.25, y: h },
        { x: 0, y: h * 0.5 },
      ];

    case 'l-shape': {
      const cutW = shape.cutoutWidth ?? w * 0.4;
      const cutH = shape.cutoutHeight ?? h * 0.4;
      const pos = shape.cutoutPosition || 'top-right';
      switch (pos) {
        case 'top-right':
          return [
            { x: 0, y: 0 },
            { x: w - cutW, y: 0 },
            { x: w - cutW, y: cutH },
            { x: w, y: cutH },
            { x: w, y: h },
            { x: 0, y: h },
          ];
        case 'top-left':
          return [
            { x: cutW, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h },
            { x: 0, y: h },
            { x: 0, y: cutH },
            { x: cutW, y: cutH },
          ];
        case 'bottom-right':
          return [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h - cutH },
            { x: w - cutW, y: h - cutH },
            { x: w - cutW, y: h },
            { x: 0, y: h },
          ];
        case 'bottom-left':
          return [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h },
            { x: cutW, y: h },
            { x: cutW, y: h - cutH },
            { x: 0, y: h - cutH },
          ];
        default:
          return [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h },
            { x: 0, y: h },
          ];
      }
    }

    case 'arch': {
      // For arch, the straight-line vertices are the rectangular portion.
      // The curve is handled separately in path generation.
      const archH = shape.archHeight ?? h * 0.3;
      return [
        { x: 0, y: archH },
        { x: w, y: archH },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }

    default:
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
  }
}

// ---------------------------------------------------------------------------
// Scale real vertices into the SVG drawing area (with MARGIN offset)
// ---------------------------------------------------------------------------

function scaleVertices(
  realVerts: Point[],
  realW: number,
  realH: number,
  drawW: number,
  drawH: number,
): Point[] {
  const sx = drawW / realW;
  const sy = drawH / realH;
  return realVerts.map((v) => ({
    x: MARGIN + v.x * sx,
    y: MARGIN + v.y * sy,
  }));
}

// ---------------------------------------------------------------------------
// SVG path generation for the shape outline
// ---------------------------------------------------------------------------

function getShapePath(
  shape: ShapeConfig,
  svgVerts: Point[],
  drawW: number,
  drawH: number,
  _realW: number,
  realH: number,
): string {
  if (shape.type === 'arch') {
    // Arch: straight sides + bottom, with an elliptical arc across the top
    const archH = shape.archHeight ?? realH * 0.3;
    const archHPx = (archH / realH) * drawH;
    const rx = drawW / 2;
    const ry = archHPx;
    // Start at bottom-left, go up left side, arc across, down right side, close
    const bl = { x: MARGIN, y: MARGIN + drawH };
    const tl = { x: MARGIN, y: MARGIN + archHPx };
    const tr = { x: MARGIN + drawW, y: MARGIN + archHPx };
    const br = { x: MARGIN + drawW, y: MARGIN + drawH };
    return `M ${bl.x} ${bl.y} L ${tl.x} ${tl.y} A ${rx} ${ry} 0 0 1 ${tr.x} ${tr.y} L ${br.x} ${br.y} Z`;
  }

  // All other shapes: simple polygon
  if (svgVerts.length === 0) return '';
  const parts = svgVerts.map((v, i) =>
    i === 0 ? `M ${v.x} ${v.y}` : `L ${v.x} ${v.y}`,
  );
  parts.push('Z');
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Panel divider calculation
//
// For each divider between panels, we find where a vertical line at a given
// x-fraction intersects the polygon edges and draw a line between the
// topmost and bottommost intersections.
// ---------------------------------------------------------------------------

function getPolygonXIntersections(
  xVal: number,
  verts: Point[],
): number[] {
  const ys: number[] = [];
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    // Check if the vertical line at xVal crosses this edge
    if ((a.x <= xVal && b.x >= xVal) || (b.x <= xVal && a.x >= xVal)) {
      const dx = b.x - a.x;
      if (Math.abs(dx) < 0.001) {
        // Vertical edge — push both endpoints
        ys.push(a.y, b.y);
      } else {
        const t = (xVal - a.x) / dx;
        if (t >= -0.001 && t <= 1.001) {
          ys.push(a.y + t * (b.y - a.y));
        }
      }
    }
  }
  return ys;
}

function getArchXIntersections(
  xVal: number,
  drawW: number,
  drawH: number,
  archHPx: number,
): { topY: number; bottomY: number } {
  // Bottom is always at MARGIN + drawH (flat bottom edge)
  const bottomY = MARGIN + drawH;

  // Top: the arch curve. For an ellipse centered at (MARGIN + drawW/2, MARGIN + archHPx)
  // with rx = drawW/2 and ry = archHPx, the y at a given x is:
  // y = cy - ry * sqrt(1 - ((x - cx) / rx)^2)
  const cx = MARGIN + drawW / 2;
  const cy = MARGIN + archHPx;
  const rx = drawW / 2;
  const ry = archHPx;
  const dx = xVal - cx;
  const sqr = 1 - (dx * dx) / (rx * rx);
  const topY = sqr > 0 ? cy - ry * Math.sqrt(sqr) : cy;

  return { topY, bottomY };
}

interface DividerLine {
  x: number;
  topY: number;
  bottomY: number;
}

function getPanelDividers(
  shape: ShapeConfig,
  panels: number,
  panelWidths: number[],
  svgVerts: Point[],
  drawW: number,
  drawH: number,
  _realW: number,
  realH: number,
): DividerLine[] {
  if (panels <= 1) return [];

  const total = panelWidths.reduce((a, b) => a + b, 0);
  const dividers: DividerLine[] = [];
  let accFrac = 0;

  for (let i = 0; i < panels - 1; i++) {
    accFrac += (panelWidths[i] ?? 0) / total;
    const xVal = MARGIN + accFrac * drawW;

    if (shape.type === 'arch') {
      const archH = shape.archHeight ?? realH * 0.3;
      const archHPx = (archH / realH) * drawH;
      const { topY, bottomY } = getArchXIntersections(xVal, drawW, drawH, archHPx);
      dividers.push({ x: xVal, topY, bottomY });
    } else {
      const ys = getPolygonXIntersections(xVal, svgVerts);
      if (ys.length >= 2) {
        dividers.push({
          x: xVal,
          topY: Math.min(...ys),
          bottomY: Math.max(...ys),
        });
      }
    }
  }

  return dividers;
}

// ---------------------------------------------------------------------------
// Dimension line helpers
// ---------------------------------------------------------------------------

function getOutwardNormal(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  centerX: number,
  centerY: number,
): { nx: number; ny: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { nx: 0, ny: -1 };
  let nx = -dy / len;
  let ny = dx / len;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const toCenter = (centerX - midX) * nx + (centerY - midY) * ny;
  if (toCenter > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { nx, ny };
}

function realEdgeLength(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

// ---------------------------------------------------------------------------
// Determine which edges are "bottom" edges (both y at max)
// ---------------------------------------------------------------------------

function isBottomEdge(a: Point, b: Point, maxY: number): boolean {
  return Math.abs(a.y - maxY) < 0.5 && Math.abs(b.y - maxY) < 0.5;
}

// ---------------------------------------------------------------------------
// Opening indicator rendering
// ---------------------------------------------------------------------------

function getOpeningIndicator(
  direction: string,
  isSliding: boolean,
  panelCx: number,
  panelCy: number,
  panelW: number,
  panelH: number,
  keyPrefix: string,
): React.ReactNode {
  const arrowLen = Math.min(panelW, panelH) * 0.3;
  const arrowHead = 5;

  if (isSliding) {
    // Sliding: draw a horizontal double-headed arrow
    const color = '#9333ea'; // purple for sliding
    let x1: number, y1: number, x2: number, y2: number;
    if (direction === 'left') {
      x1 = panelCx + arrowLen * 0.5;
      x2 = panelCx - arrowLen * 0.5;
      y1 = y2 = panelCy;
    } else if (direction === 'right') {
      x1 = panelCx - arrowLen * 0.5;
      x2 = panelCx + arrowLen * 0.5;
      y1 = y2 = panelCy;
    } else if (direction === 'top') {
      x1 = x2 = panelCx;
      y1 = panelCy + arrowLen * 0.5;
      y2 = panelCy - arrowLen * 0.5;
    } else {
      x1 = x2 = panelCx;
      y1 = panelCy - arrowLen * 0.5;
      y2 = panelCy + arrowLen * 0.5;
    }
    return (
      <g key={keyPrefix}>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth={2} strokeDasharray="6,3"
        />
        <polygon
          points={arrowHeadPoints(x2, y2, x1, y1, arrowHead)}
          fill={color}
        />
      </g>
    );
  }

  // Hinged: draw a swing arc
  const color = '#2563eb'; // blue for hinged
  const radius = Math.min(panelW, panelH) * 0.35;
  let startAngle: number, endAngle: number, arcCx: number, arcCy: number;

  switch (direction) {
    case 'left':
      arcCx = panelCx - panelW * 0.4;
      arcCy = panelCy;
      startAngle = -40;
      endAngle = 40;
      break;
    case 'right':
      arcCx = panelCx + panelW * 0.4;
      arcCy = panelCy;
      startAngle = 140;
      endAngle = 220;
      break;
    case 'top':
      arcCx = panelCx;
      arcCy = panelCy - panelH * 0.4;
      startAngle = 50;
      endAngle = 130;
      break;
    case 'bottom':
    default:
      arcCx = panelCx;
      arcCy = panelCy + panelH * 0.4;
      startAngle = 230;
      endAngle = 310;
      break;
  }

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const sx = arcCx + radius * Math.cos(startRad);
  const sy = arcCy + radius * Math.sin(startRad);
  const ex = arcCx + radius * Math.cos(endRad);
  const ey = arcCy + radius * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return (
    <g key={keyPrefix}>
      <path
        d={`M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4,2"
      />
      <polygon
        points={arrowHeadPoints(ex, ey, sx, sy, arrowHead)}
        fill={color}
      />
    </g>
  );
}

function arrowHeadPoints(
  tipX: number,
  tipY: number,
  fromX: number,
  fromY: number,
  size: number,
): string {
  const dx = tipX - fromX;
  const dy = tipY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `${tipX},${tipY}`;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const base1X = tipX - ux * size + px * size * 0.5;
  const base1Y = tipY - uy * size + py * size * 0.5;
  const base2X = tipX - ux * size - px * size * 0.5;
  const base2Y = tipY - uy * size - py * size * 0.5;
  return `${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`;
}

// ---------------------------------------------------------------------------
// Arch: build a smooth SVG clip path for a panel slice
// ---------------------------------------------------------------------------

function getArchPanelClipPath(
  leftFrac: number,
  rightFrac: number,
  drawW: number,
  drawH: number,
  archHPx: number,
): string {
  const points: string[] = [];
  const steps = ARCH_CURVE_STEPS;
  for (let s = 0; s <= steps; s++) {
    const frac = leftFrac + (s / steps) * (rightFrac - leftFrac);
    const xVal = MARGIN + frac * drawW;
    const { topY } = getArchXIntersections(xVal, drawW, drawH, archHPx);
    points.push(`${xVal},${topY}`);
  }
  // Close along the bottom
  points.push(`${MARGIN + rightFrac * drawW},${MARGIN + drawH}`);
  points.push(`${MARGIN + leftFrac * drawW},${MARGIN + drawH}`);
  return points.join(' ');
}

// ---------------------------------------------------------------------------
// Build polygon points for a single panel (clipped to the shape)
// ---------------------------------------------------------------------------

function getPanelPolygonPoints(
  shape: ShapeConfig,
  panelIndex: number,
  _panels: number,
  panelWidths: number[],
  svgVerts: Point[],
  drawW: number,
  drawH: number,
  _realW: number,
  realH: number,
): string {
  const total = panelWidths.reduce((a, b) => a + b, 0);
  let leftFrac = 0;
  for (let i = 0; i < panelIndex; i++) {
    leftFrac += (panelWidths[i] ?? 0) / total;
  }
  const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
  const leftX = MARGIN + leftFrac * drawW;
  const rightX = MARGIN + rightFrac * drawW;

  if (shape.type === 'arch') {
    const archH = shape.archHeight ?? realH * 0.3;
    const archHPx = (archH / realH) * drawH;
    return getArchPanelClipPath(leftFrac, rightFrac, drawW, drawH, archHPx);
  }

  // For polygons: find where the left and right vertical lines
  // intersect each edge, then build a clipped polygon.
  // We walk the polygon edges and clip to the [leftX, rightX] strip.
  const clipped = clipPolygonToVerticalStrip(svgVerts, leftX, rightX);
  return clipped.map((p) => `${p.x},${p.y}`).join(' ');
}

// Sutherland-Hodgman clip a polygon to a vertical strip [xMin, xMax]
function clipPolygonToVerticalStrip(
  verts: Point[],
  xMin: number,
  xMax: number,
): Point[] {
  let output = [...verts];
  // Clip against left edge (x >= xMin)
  output = clipPolygonAgainstEdge(output, (p) => p.x >= xMin - 0.01, (a, b) => {
    const t = (xMin - a.x) / (b.x - a.x);
    return { x: xMin, y: a.y + t * (b.y - a.y) };
  });
  // Clip against right edge (x <= xMax)
  output = clipPolygonAgainstEdge(output, (p) => p.x <= xMax + 0.01, (a, b) => {
    const t = (xMax - a.x) / (b.x - a.x);
    return { x: xMax, y: a.y + t * (b.y - a.y) };
  });
  return output;
}

function clipPolygonAgainstEdge(
  verts: Point[],
  inside: (p: Point) => boolean,
  intersect: (a: Point, b: Point) => Point,
): Point[] {
  if (verts.length === 0) return [];
  const result: Point[] = [];
  for (let i = 0; i < verts.length; i++) {
    const current = verts[i];
    const next = verts[(i + 1) % verts.length];
    const cIn = inside(current);
    const nIn = inside(next);
    if (cIn) {
      result.push(current);
      if (!nIn) {
        result.push(intersect(current, next));
      }
    } else if (nIn) {
      result.push(intersect(current, next));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Compute panel center for opening indicators
// ---------------------------------------------------------------------------

function getPanelCenter(
  shape: ShapeConfig,
  panelIndex: number,
  _panels: number,
  panelWidths: number[],
  svgVerts: Point[],
  drawW: number,
  drawH: number,
  _realW: number,
  realH: number,
): { cx: number; cy: number; w: number; h: number } {
  const total = panelWidths.reduce((a, b) => a + b, 0);
  let leftFrac = 0;
  for (let i = 0; i < panelIndex; i++) {
    leftFrac += (panelWidths[i] ?? 0) / total;
  }
  const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
  const leftX = MARGIN + leftFrac * drawW;
  const rightX = MARGIN + rightFrac * drawW;
  const midX = (leftX + rightX) / 2;

  // Get approximate top and bottom at midX
  if (shape.type === 'arch') {
    const archH = shape.archHeight ?? realH * 0.3;
    const archHPx = (archH / realH) * drawH;
    const { topY, bottomY } = getArchXIntersections(midX, drawW, drawH, archHPx);
    return { cx: midX, cy: (topY + bottomY) / 2, w: rightX - leftX, h: bottomY - topY };
  }

  const ys = getPolygonXIntersections(midX, svgVerts);
  if (ys.length >= 2) {
    const topY = Math.min(...ys);
    const bottomY = Math.max(...ys);
    return { cx: midX, cy: (topY + bottomY) / 2, w: rightX - leftX, h: bottomY - topY };
  }

  return { cx: midX, cy: MARGIN + drawH / 2, w: rightX - leftX, h: drawH };
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
}) => {
  // Choose a drawing area size that preserves the real-world aspect ratio.
  // We pick a base dimension and scale the other to match.
  const BASE = 160;
  const aspect = width / height;
  let drawW: number, drawH: number;
  if (aspect >= 1) {
    drawW = BASE;
    drawH = BASE / aspect;
  } else {
    drawH = BASE;
    drawW = BASE * aspect;
  }

  // Ensure minimum legible size
  drawW = Math.max(drawW, 100);
  drawH = Math.max(drawH, 80);

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

  // Panel widths total
  const pwTotal = panelWidths.reduce((a, b) => a + b, 0);

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ width: '100%', height: '100vh' }}
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

      {/* --- Layer 3: Frame border --- */}
      <path
        d={shapePath}
        fill="none"
        stroke={frameColor}
        strokeWidth={FRAME_STROKE}
        strokeLinejoin="miter"
      />

      {/* --- Layer 4: Opening indicators --- */}
      {openingPanels.map((panelIdx) => {
        const dir = openingDirections[panelIdx];
        if (!dir) return null;
        const { cx, cy, w: pw, h: ph } = getPanelCenter(
          shape, panelIdx, panels, panelWidths, svgVerts,
          drawW, drawH, width, height,
        );
        return getOpeningIndicator(dir, isSliding, cx, cy, pw, ph, `opening-${panelIdx}`);
      })}

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

      {/* --- Layer 5b: Arch height annotation --- */}
      {shape.type === 'arch' && (() => {
        const archH = shape.archHeight ?? height * 0.3;
        const archHPx = (archH / height) * drawH;
        const xPos = MARGIN + drawW + DIM_OFFSET + 8;
        const topY = MARGIN;
        const bottomY = MARGIN + archHPx;
        const midY = (topY + bottomY) / 2;
        return (
          <g>
            <line
              x1={xPos} y1={topY} x2={xPos} y2={bottomY}
              stroke={DIM_COLOR}
              strokeWidth={1.2}
              strokeDasharray="4,2"
            />
            <text
              x={xPos + 10}
              y={midY}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={DIM_FONT - 1}
              fill={DIM_COLOR}
              fontWeight={500}
            >
              Arch: {Math.round(archH)} {unit}
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
