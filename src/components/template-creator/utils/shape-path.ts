// ---------------------------------------------------------------------------
// Shape path generation: vertex computation, scaling, SVG path building
// ---------------------------------------------------------------------------

import type { ShapeConfig } from '@/components/product-sketch/types';
import { MARGIN } from './types';
import type { Point } from './types';

// ---------------------------------------------------------------------------
// Arch ry helper -- semicircle uses rx, segmental uses archHeight
// ---------------------------------------------------------------------------

export function getArchRy(shape: ShapeConfig, drawW: number, drawH: number, realH: number): number {
  const rx = drawW / 2;
  const isSemicircle = (shape.archType ?? 'semicircle') === 'semicircle';
  return isSemicircle ? rx : ((shape.archHeight ?? realH * 0.3) / realH) * drawH;
}

// ---------------------------------------------------------------------------
// Vertex computation -- real-world coordinates (mm)
//
// These are the ACTUAL vertices in real dimensions. They are used to:
// 1. Compute real-world edge lengths for dimension labels
// 2. Scale proportionally into SVG drawing-area coordinates
// ---------------------------------------------------------------------------

export function getRealVertices(
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
      // Semicircle: arch height = half the width. Segmental: user-defined.
      const isSemicircle = (shape.archType ?? 'semicircle') === 'semicircle';
      const archH = isSemicircle ? w / 2 : (shape.archHeight ?? h * 0.3);
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

export function scaleVertices(
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

export function getShapePath(
  shape: ShapeConfig,
  svgVerts: Point[],
  drawW: number,
  drawH: number,
  _realW: number,
  realH: number,
): string {
  if (shape.type === 'arch') {
    // Semicircle: ry = rx (true half-circle, arch height = half the width)
    // Segmental: ry = user-defined archHeight (shallower curve)
    const rx = drawW / 2;
    const isSemicircle = (shape.archType ?? 'semicircle') === 'semicircle';
    const ry = isSemicircle ? rx : ((shape.archHeight ?? realH * 0.3) / realH) * drawH;
    const bl = { x: MARGIN, y: MARGIN + drawH };
    const tl = { x: MARGIN, y: MARGIN + ry };
    const tr = { x: MARGIN + drawW, y: MARGIN + ry };
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
