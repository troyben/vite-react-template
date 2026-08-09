// ---------------------------------------------------------------------------
// Connector tool: outer-edge hit-testing and ghost-leg preview geometry.
//
// Shared by the flat path (ShapeCanvas, bounding box from svgVerts) and the
// chain path (ChainCanvas, bounding box from the projected leg corners) so
// the two render paths can't drift on hover/click behaviour for the
// connector tool. Pure geometry -- no React. Callers derive their own
// bounding box (that's the only thing that differs between them) and pass it
// in; everything past that point is identical.
// ---------------------------------------------------------------------------

import type { Point } from './types';

/** How close the cursor must be to an outer edge, in draw-space units. */
const EDGE_TOLERANCE = 24;

/** Draw-space half-thickness of the ghost corner post. */
const GHOST_POST_WIDTH = 8;

export interface EdgeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Bounding box of a set of draw-space points. */
export function boundsOf(points: Point[]): EdgeBounds {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Which outer edge of `bounds`, if any, the cursor is near. Draw-space units. */
export function edgeAtPoint(bounds: EdgeBounds, px: number, py: number): 'left' | 'right' | null {
  const { minX, maxX, minY, maxY } = bounds;
  if (py < minY - EDGE_TOLERANCE || py > maxY + EDGE_TOLERANCE) return null;
  if (Math.abs(px - minX) <= EDGE_TOLERANCE) return 'left';
  if (Math.abs(px - maxX) <= EDGE_TOLERANCE) return 'right';
  return null;
}

export interface ConnectorGhost {
  /** Corner-post rectangle. */
  post: { x: number; y: number; width: number; height: number };
  /** Dashed ghost-leg polygon, as an SVG `points` attribute value. */
  legPoints: string;
}

/**
 * Ghost preview geometry for a leg about to be attached at `edge` of `bounds`.
 * `referenceWidth` sizes the ghost leg (half its length) -- pass the
 * draw-space width of whichever unit the new leg's width will be copied
 * from, so the preview roughly matches what will actually be attached.
 */
export function getConnectorGhost(bounds: EdgeBounds, edge: 'left' | 'right', referenceWidth: number): ConnectorGhost {
  const { minX, maxX, minY, maxY } = bounds;
  const postX = edge === 'left' ? minX : maxX;
  const dir = edge === 'left' ? -1 : 1;
  const ghostLen = referenceWidth * 0.5;
  const points: Array<[number, number]> = [
    [postX + dir * GHOST_POST_WIDTH, minY],
    [postX + dir * (GHOST_POST_WIDTH + ghostLen), minY - ghostLen * 0.5],
    [postX + dir * (GHOST_POST_WIDTH + ghostLen), maxY - ghostLen * 0.5],
    [postX + dir * GHOST_POST_WIDTH, maxY],
  ];
  return {
    post: {
      x: dir > 0 ? postX : postX - GHOST_POST_WIDTH,
      y: minY,
      width: GHOST_POST_WIDTH,
      height: maxY - minY,
    },
    legPoints: points.map(([x, y]) => `${x},${y}`).join(' '),
  };
}
