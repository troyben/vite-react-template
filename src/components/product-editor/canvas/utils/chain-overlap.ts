// ---------------------------------------------------------------------------
// How much of one leg does another leg hide?
//
// A chain is drawn as a single flat projection, so two legs can land on top of
// each other and the one behind becomes unreadable. chain-projection uses these
// helpers to search for a view angle where that does not happen.
//
// Every polygon here is a projected leg face: a convex quadrilateral. Convexity
// is what lets the clip below be this short.
// ---------------------------------------------------------------------------

import type { Point } from './types';

/** Overlap at or below this share of a leg's face is treated as clear. */
export const OVERLAP_TOLERANCE = 0.01;

/**
 * Signed area, positive when the points wind clockwise on screen (y grows
 * downward in SVG). The sign is what tells `toPositive` which way a polygon
 * was built, so callers that only want size must take the absolute value.
 */
export function polygonArea(poly: Point[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
}

/** Same polygon, wound so its signed area is positive. */
function toPositive(poly: Point[]): Point[] {
  return polygonArea(poly) < 0 ? poly.slice().reverse() : poly;
}

/**
 * Sutherland-Hodgman: the part of `subject` that falls inside `window`.
 * Both polygons must be convex and wound positive. Returns fewer than three
 * points when they do not meet.
 */
export function convexClip(subject: Point[], window: Point[]): Point[] {
  let out = subject;
  for (let i = 0; i < window.length && out.length > 0; i++) {
    const a = window[i];
    const b = window[(i + 1) % window.length];
    // Positive on the inner side of edge a->b, given positive winding.
    const side = (p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j];
      const q = input[(j + 1) % input.length];
      const sp = side(p);
      const sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
        const t = sp / (sp - sq);
        out.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
      }
    }
  }
  return out;
}

/**
 * Worst share of any single polygon's own area that another polygon covers,
 * as a fraction from 0 to 1.
 *
 * Measured against the *smaller* of each pair, not against the total: a small
 * leg fully swallowed by a large one is a complete loss of information even
 * though it is a small fraction of the drawing.
 */
export function worstOverlapFraction(polys: Point[][]): number {
  let worst = 0;
  for (let i = 0; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      const a = toPositive(polys[i]);
      const b = toPositive(polys[j]);
      const piece = convexClip(a, b);
      if (piece.length < 3) continue;
      const shared = Math.abs(polygonArea(piece));
      const smaller = Math.min(Math.abs(polygonArea(a)), Math.abs(polygonArea(b)));
      if (smaller > 0) worst = Math.max(worst, shared / smaller);
    }
  }
  return worst;
}
