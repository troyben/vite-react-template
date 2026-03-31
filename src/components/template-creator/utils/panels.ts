// ---------------------------------------------------------------------------
// Panel computation: dividers, polygon clipping, centers
// ---------------------------------------------------------------------------

import type { ShapeConfig } from '@/components/product-sketch/types';
import type { Point, DividerLine } from './types';
import { MARGIN, ARCH_CURVE_STEPS } from './types';
import { getArchRy } from './shape-path';
import { getPolygonXIntersections, getArchXIntersections, clipPolygonToVerticalStrip } from './geometry';

// ---------------------------------------------------------------------------
// Panel divider calculation
//
// For each divider between panels, we find where a vertical line at a given
// x-fraction intersects the polygon edges and draw a line between the
// topmost and bottommost intersections.
// ---------------------------------------------------------------------------

export function getPanelDividers(
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
      const archHPx = getArchRy(shape, drawW, drawH, realH);
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
// Arch: build a smooth SVG clip path for a panel slice
// ---------------------------------------------------------------------------

export function getArchPanelClipPath(
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

export function getPanelPolygonPoints(
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
    const archHPx = getArchRy(shape, drawW, drawH, realH);
    return getArchPanelClipPath(leftFrac, rightFrac, drawW, drawH, archHPx);
  }

  // For polygons: find where the left and right vertical lines
  // intersect each edge, then build a clipped polygon.
  // We walk the polygon edges and clip to the [leftX, rightX] strip.
  const clipped = clipPolygonToVerticalStrip(svgVerts, leftX, rightX);
  return clipped.map((p) => `${p.x},${p.y}`).join(' ');
}

// ---------------------------------------------------------------------------
// Compute panel center for opening indicators
// ---------------------------------------------------------------------------

export function getPanelCenter(
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
    const archHPx = getArchRy(shape, drawW, drawH, realH);
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
