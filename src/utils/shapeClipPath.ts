import type { ShapeConfig } from '@/components/product-sketch/types';

/**
 * Returns a CSS clip-path value for the given shape configuration.
 * widthPx and heightPx are the rendered pixel dimensions of the frame.
 */
export function getShapeClipPath(
  shape: ShapeConfig | undefined,
  widthPx: number,
  heightPx: number
): string {
  if (!shape || shape.type === 'rectangle') return 'none';

  switch (shape.type) {
    case 'arch':
      return getArchClipPath(shape, widthPx, heightPx);
    case 'trapezoid':
      return getTrapezoidClipPath(shape, widthPx, heightPx);
    case 'triangle':
      return getTriangleClipPath(shape, widthPx, heightPx);
    case 'l-shape':
      return getLShapeClipPath(shape, widthPx, heightPx);
    case 'pentagon':
      return getPentagonClipPath(widthPx, heightPx);
    case 'hexagon':
      return getHexagonClipPath(widthPx, heightPx);
    default:
      return 'none';
  }
}

function getArchClipPath(shape: ShapeConfig, w: number, h: number): string {
  const archRatio = (shape.archHeight || h * 0.3) / h;
  const archH = Math.min(archRatio, 0.5) * h;
  const rectTop = archH;

  // SVG path: start bottom-left, go up the left side to arch start,
  // arc across the top, down right side, close bottom
  const r = w / 2;
  const sweep = shape.archType === 'segmental' ? 0 : 1;

  return `path('M 0 ${h} L 0 ${rectTop} A ${r} ${archH} 0 0 1 ${w} ${rectTop} L ${w} ${h} Z')`;
}

function getTrapezoidClipPath(shape: ShapeConfig, w: number, h: number): string {
  const topWidth = shape.topWidth ?? w * 0.6;
  const insetLeft = ((w - topWidth) / 2 / w) * 100;
  const insetRight = 100 - insetLeft;
  return `polygon(${insetLeft}% 0%, ${insetRight}% 0%, 100% 100%, 0% 100%)`;
}

function getTriangleClipPath(shape: ShapeConfig, _w: number, _h: number): string {
  const peak = ((shape.peakPosition ?? 0.5) * 100).toFixed(1);
  return `polygon(${peak}% 0%, 0% 100%, 100% 100%)`;
}

function getLShapeClipPath(shape: ShapeConfig, w: number, h: number): string {
  const cutW = (shape.cutoutWidth ?? w * 0.4) / w * 100;
  const cutH = (shape.cutoutHeight ?? h * 0.4) / h * 100;
  const pos = shape.cutoutPosition || 'top-right';

  switch (pos) {
    case 'top-right':
      return `polygon(0% 0%, ${100 - cutW}% 0%, ${100 - cutW}% ${cutH}%, 100% ${cutH}%, 100% 100%, 0% 100%)`;
    case 'top-left':
      return `polygon(${cutW}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${cutH}%, ${cutW}% ${cutH}%)`;
    case 'bottom-right':
      return `polygon(0% 0%, 100% 0%, 100% ${100 - cutH}%, ${100 - cutW}% ${100 - cutH}%, ${100 - cutW}% 100%, 0% 100%)`;
    case 'bottom-left':
      return `polygon(0% 0%, 100% 0%, 100% 100%, ${cutW}% 100%, ${cutW}% ${100 - cutH}%, 0% ${100 - cutH}%)`;
    default:
      return 'none';
  }
}

function getPentagonClipPath(_w: number, _h: number): string {
  // Regular pentagon: top vertex centered, two upper sides angled, flat bottom
  return 'polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)';
}

function getHexagonClipPath(_w: number, _h: number): string {
  // Regular hexagon: flat top and bottom, angled sides
  return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
}

/**
 * Returns the vertices of the shape outline as [x%, y%] pairs.
 * Used by ShapeDimensionLines to know where to draw edge dimensions.
 */
export function getShapeVertices(
  shape: ShapeConfig | undefined,
  width: number,
  height: number
): Array<{ x: number; y: number; label?: string }> {
  if (!shape || shape.type === 'rectangle') {
    return [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
  }

  switch (shape.type) {
    case 'trapezoid': {
      const topW = shape.topWidth ?? width * 0.6;
      const inset = (width - topW) / 2;
      return [
        { x: inset, y: 0 },
        { x: width - inset, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ];
    }
    case 'triangle': {
      const peak = (shape.peakPosition ?? 0.5) * width;
      return [
        { x: peak, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ];
    }
    case 'l-shape': {
      const cutW = shape.cutoutWidth ?? width * 0.4;
      const cutH = shape.cutoutHeight ?? height * 0.4;
      const pos = shape.cutoutPosition || 'top-right';
      if (pos === 'top-right') {
        return [
          { x: 0, y: 0 },
          { x: width - cutW, y: 0 },
          { x: width - cutW, y: cutH },
          { x: width, y: cutH },
          { x: width, y: height },
          { x: 0, y: height },
        ];
      }
      if (pos === 'top-left') {
        return [
          { x: cutW, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
          { x: 0, y: cutH },
          { x: cutW, y: cutH },
        ];
      }
      if (pos === 'bottom-right') {
        return [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height - cutH },
          { x: width - cutW, y: height - cutH },
          { x: width - cutW, y: height },
          { x: 0, y: height },
        ];
      }
      // bottom-left
      return [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: cutW, y: height },
        { x: cutW, y: height - cutH },
        { x: 0, y: height - cutH },
      ];
    }
    case 'pentagon':
      return [
        { x: width * 0.5, y: 0 },
        { x: width, y: height * 0.38 },
        { x: width * 0.81, y: height },
        { x: width * 0.19, y: height },
        { x: 0, y: height * 0.38 },
      ];
    case 'hexagon':
      return [
        { x: width * 0.25, y: 0 },
        { x: width * 0.75, y: 0 },
        { x: width, y: height * 0.5 },
        { x: width * 0.75, y: height },
        { x: width * 0.25, y: height },
        { x: 0, y: height * 0.5 },
      ];
    case 'arch': {
      const archH = shape.archHeight ?? height * 0.3;
      return [
        { x: 0, y: archH, label: 'arch-start-left' },
        { x: width, y: archH, label: 'arch-start-right' },
        { x: width, y: height },
        { x: 0, y: height },
      ];
    }
    default:
      return [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ];
  }
}

/**
 * Returns an SVG <path> `d` attribute that traces the shape outline.
 * Used to render a thick frame border that follows shape edges.
 * Coordinates are in pixels (matching widthPx x heightPx).
 */
export function getShapeSVGPath(
  shape: ShapeConfig | undefined,
  widthPx: number,
  heightPx: number
): string | null {
  if (!shape || shape.type === 'rectangle') return null;

  switch (shape.type) {
    case 'arch': {
      const archH = (shape.archHeight ?? heightPx * 0.3);
      const rx = widthPx / 2;
      const ry = archH;
      // Start bottom-left, go up left side, arc across top, down right side, close bottom
      return `M 0 ${heightPx} L 0 ${archH} A ${rx} ${ry} 0 0 1 ${widthPx} ${archH} L ${widthPx} ${heightPx} Z`;
    }
    case 'trapezoid': {
      const topW = shape.topWidth ?? widthPx * 0.6;
      const inset = (widthPx - topW) / 2;
      return `M ${inset} 0 L ${widthPx - inset} 0 L ${widthPx} ${heightPx} L 0 ${heightPx} Z`;
    }
    case 'triangle': {
      const peakX = (shape.peakPosition ?? 0.5) * widthPx;
      return `M ${peakX} 0 L ${widthPx} ${heightPx} L 0 ${heightPx} Z`;
    }
    case 'l-shape': {
      const cutW = shape.cutoutWidth ?? widthPx * 0.4;
      const cutH = shape.cutoutHeight ?? heightPx * 0.4;
      const pos = shape.cutoutPosition || 'top-right';
      const v = getLShapePixelVertices(widthPx, heightPx, cutW, cutH, pos);
      return `M ${v.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
    }
    case 'pentagon': {
      const v = [
        [widthPx * 0.5, 0],
        [widthPx, heightPx * 0.38],
        [widthPx * 0.81, heightPx],
        [widthPx * 0.19, heightPx],
        [0, heightPx * 0.38],
      ];
      return `M ${v.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
    }
    case 'hexagon': {
      const v = [
        [widthPx * 0.25, 0],
        [widthPx * 0.75, 0],
        [widthPx, heightPx * 0.5],
        [widthPx * 0.75, heightPx],
        [widthPx * 0.25, heightPx],
        [0, heightPx * 0.5],
      ];
      return `M ${v.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
    }
    default:
      return null;
  }
}

function getLShapePixelVertices(w: number, h: number, cutW: number, cutH: number, pos: string): number[][] {
  switch (pos) {
    case 'top-right':
      return [[0, 0], [w - cutW, 0], [w - cutW, cutH], [w, cutH], [w, h], [0, h]];
    case 'top-left':
      return [[cutW, 0], [w, 0], [w, h], [0, h], [0, cutH], [cutW, cutH]];
    case 'bottom-right':
      return [[0, 0], [w, 0], [w, h - cutH], [w - cutW, h - cutH], [w - cutW, h], [0, h]];
    case 'bottom-left':
      return [[0, 0], [w, 0], [w, h], [cutW, h], [cutW, h - cutH], [0, h - cutH]];
    default:
      return [[0, 0], [w, 0], [w, h], [0, h]];
  }
}
