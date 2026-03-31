// ---------------------------------------------------------------------------
// Canvas tool types and helpers
// ---------------------------------------------------------------------------

export type CanvasTool = 'handle' | 'line' | 'arc' | null;

export interface PlacedArc {
  id: string;
  cx: number; cy: number;  // SVG center
  rx: number; ry: number;  // SVG radii
  startAngle: number;
  endAngle: number;
  realCx: number; realCy: number;
  realRx: number; realRy: number;
}

/** Convert SVG coords to real-world coords (mm) */
export function svgToReal(
  svgX: number, svgY: number,
  margin: number, drawW: number, drawH: number,
  realW: number, realH: number,
): { realX: number; realY: number } {
  const realX = ((svgX - margin) / drawW) * realW;
  const realY = ((svgY - margin) / drawH) * realH;
  return { realX, realY };
}

/** Convert real-world coords (mm) to SVG coords */
export function realToSvg(
  realX: number, realY: number,
  margin: number, drawW: number, drawH: number,
  realW: number, realH: number,
): { svgX: number; svgY: number } {
  const svgX = margin + (realX / realW) * drawW;
  const svgY = margin + (realY / realH) * drawH;
  return { svgX, svgY };
}

/** Snap a real-world value to a grid (default 1mm) */
export function snapToGrid(value: number, gridSize: number = 1): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Generate a unique ID for placed elements */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
