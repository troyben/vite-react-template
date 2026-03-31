// ---------------------------------------------------------------------------
// Geometry helpers: polygon intersection, clipping, normals, edge measurement
// ---------------------------------------------------------------------------

import { MARGIN } from './types';
import type { Point } from './types';

// ---------------------------------------------------------------------------
// Polygon / arch intersection helpers for panel dividers
// ---------------------------------------------------------------------------

export function getPolygonXIntersections(
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
        // Vertical edge -- push both endpoints
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

export function getArchXIntersections(
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

// ---------------------------------------------------------------------------
// Dimension line helpers
// ---------------------------------------------------------------------------

export function getOutwardNormal(
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

export function realEdgeLength(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

// ---------------------------------------------------------------------------
// Determine which edges are "bottom" edges (both y at max)
// ---------------------------------------------------------------------------

export function isBottomEdge(a: Point, b: Point, maxY: number): boolean {
  return Math.abs(a.y - maxY) < 0.5 && Math.abs(b.y - maxY) < 0.5;
}

// ---------------------------------------------------------------------------
// Sutherland-Hodgman polygon clipping to a vertical strip
// ---------------------------------------------------------------------------

export function clipPolygonToVerticalStrip(
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

export function clipPolygonAgainstEdge(
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
