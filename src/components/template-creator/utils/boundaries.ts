// ---------------------------------------------------------------------------
// Shape boundary helpers: find shape edge at a given x or y coordinate
// ---------------------------------------------------------------------------

import type { ShapeConfig } from '@/components/product-sketch/types';
import { MARGIN } from './types';
import type { Point } from './types';
import { getArchRy } from './shape-path';

// ---------------------------------------------------------------------------
// Find the topmost Y where a vertical line at `x` intersects the shape edges
// ---------------------------------------------------------------------------

export function getTopYAtX(
  x: number, svgVerts: Point[], shape: ShapeConfig,
  drawW: number, drawH: number, _realW: number, realH: number,
): number {
  if (shape.type === 'arch') {
    const archHPx = getArchRy(shape, drawW, drawH, realH);
    const cx = MARGIN + drawW / 2;
    const rx = drawW / 2;
    const ry = archHPx;
    const dx = x - cx;
    if (Math.abs(dx) <= rx) {
      const normalizedX = dx / rx;
      const sqr = 1 - normalizedX * normalizedX;
      if (sqr > 0) return MARGIN + archHPx - ry * Math.sqrt(sqr);
    }
    return MARGIN + archHPx;
  }
  // For polygons: find highest intersection of vertical line x with any edge
  let minY = MARGIN + drawH;
  for (let i = 0; i < svgVerts.length; i++) {
    const a = svgVerts[i];
    const b = svgVerts[(i + 1) % svgVerts.length];
    if ((a.x <= x && b.x >= x) || (b.x <= x && a.x >= x)) {
      if (Math.abs(b.x - a.x) < 0.001) continue;
      const t = (x - a.x) / (b.x - a.x);
      const y = a.y + t * (b.y - a.y);
      if (y < minY) minY = y;
    }
  }
  return minY;
}

// ---------------------------------------------------------------------------
// Find the bottommost Y where a vertical line at `x` intersects the shape edges
// ---------------------------------------------------------------------------

export function getBottomYAtX(x: number, svgVerts: Point[]): number {
  let maxY = 0;
  for (let i = 0; i < svgVerts.length; i++) {
    const a = svgVerts[i];
    const b = svgVerts[(i + 1) % svgVerts.length];
    if ((a.x <= x && b.x >= x) || (b.x <= x && a.x >= x)) {
      if (Math.abs(b.x - a.x) < 0.001) continue;
      const t = (x - a.x) / (b.x - a.x);
      const y = a.y + t * (b.y - a.y);
      if (y > maxY) maxY = y;
    }
  }
  return maxY;
}

// ---------------------------------------------------------------------------
// Find the leftmost X where a horizontal line at `y` intersects the shape edges
// ---------------------------------------------------------------------------

export function getLeftXAtY(
  y: number, svgVerts: Point[], shape: ShapeConfig,
  drawW: number, drawH: number, _realW: number, realH: number,
): number {
  if (shape.type === 'arch') {
    const archHPx = getArchRy(shape, drawW, drawH, realH);
    if (y < MARGIN + archHPx) {
      const cx = MARGIN + drawW / 2;
      const ry = archHPx;
      const rx = drawW / 2;
      const dy = (MARGIN + archHPx) - y;
      const sqr = 1 - (dy / ry) * (dy / ry);
      if (sqr > 0) return cx - rx * Math.sqrt(sqr);
    }
    return MARGIN;
  }
  let minX = MARGIN + drawW;
  for (let i = 0; i < svgVerts.length; i++) {
    const a = svgVerts[i];
    const b = svgVerts[(i + 1) % svgVerts.length];
    if ((a.y <= y && b.y >= y) || (b.y <= y && a.y >= y)) {
      if (Math.abs(b.y - a.y) < 0.001) continue;
      const t = (y - a.y) / (b.y - a.y);
      const x = a.x + t * (b.x - a.x);
      if (x < minX) minX = x;
    }
  }
  return minX;
}

// ---------------------------------------------------------------------------
// Find the rightmost X where a horizontal line at `y` intersects the shape edges
// ---------------------------------------------------------------------------

export function getRightXAtY(
  y: number, svgVerts: Point[], shape: ShapeConfig,
  drawW: number, drawH: number, _realW: number, realH: number,
): number {
  if (shape.type === 'arch') {
    const archHPx = getArchRy(shape, drawW, drawH, realH);
    if (y < MARGIN + archHPx) {
      const cx = MARGIN + drawW / 2;
      const ry = archHPx;
      const rx = drawW / 2;
      const dy = (MARGIN + archHPx) - y;
      const sqr = 1 - (dy / ry) * (dy / ry);
      if (sqr > 0) return cx + rx * Math.sqrt(sqr);
    }
    return MARGIN + drawW;
  }
  let maxX = MARGIN;
  for (let i = 0; i < svgVerts.length; i++) {
    const a = svgVerts[i];
    const b = svgVerts[(i + 1) % svgVerts.length];
    if ((a.y <= y && b.y >= y) || (b.y <= y && a.y >= y)) {
      if (Math.abs(b.y - a.y) < 0.001) continue;
      const t = (y - a.y) / (b.y - a.y);
      const x = a.x + t * (b.x - a.x);
      if (x > maxX) maxX = x;
    }
  }
  return maxX;
}
