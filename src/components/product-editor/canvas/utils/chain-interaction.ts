// ---------------------------------------------------------------------------
// Turning a click on the chain canvas into a click on one leg.
//
// Every leg is drawn inside a <g transform="matrix(...)"> that maps the leg's
// own local draw space onto the projected chain. The tool helpers in
// tool-interactions.ts and remove-tools.ts all work in that local space and
// know nothing about the chain -- so routing a tool to a leg is just a matter
// of finding which leg was hit, pushing the point back through the leg's
// matrix, and handing the helper that leg's geometry.
//
// This is what lets the chain path reuse the flat path's tools rather than
// growing a parallel set of its own.
// ---------------------------------------------------------------------------

import type { ShapeConfig, Segment } from '@/components/product-editor/types';
import type { Point } from './types';
import type { Matrix6, ChainLayout } from './chain-projection';
import type { CanvasGeometry } from './tool-interactions';
import type { RemoveContext } from './remove-tools';
import type { PlacedArc } from './canvas-tools';
import { getRealVertices, scaleVertices } from './shape-path';
import { getPanelDividers } from './panels';

/**
 * Push a point in chain draw space back into a leg's local draw space.
 *
 * The projection leaves verticals vertical, so a leg's matrix is always
 * [a, b, 0, 1, e, f] -- c is 0 and d is 1. That makes the inverse direct:
 *
 *   screenX = a*u + e            ->  u = (screenX - e) / a
 *   screenY = b*u + v + f        ->  v = screenY - f - b*u
 *
 * `a` is the leg's drawn width as a share of its true width, which solveView
 * keeps at or above MIN_FACE_RATIO, so it never approaches zero. The guard is
 * for callers that build a matrix by hand.
 */
export function screenToLegLocal(matrix: Matrix6, p: Point): Point | null {
  const [a, b, , , e, f] = matrix;
  if (!Number.isFinite(a) || Math.abs(a) < 1e-6) return null;
  const u = (p.x - e) / a;
  return { x: u, y: p.y - f - b * u };
}

/** Which leg contains a point in chain draw space, or null. Nearest first. */
export function legAtPoint(layout: ChainLayout, p: Point): number | null {
  // Walk nearest-to-furthest so a click in an overlap goes to the leg the user
  // can actually see -- the same order the legs are painted in, reversed.
  const order = layout.segments
    .slice()
    .sort((s1, s2) => s1.depth - s2.depth);
  for (const leg of order) {
    if (pointInPolygon(p, leg.corners)) return leg.index;
  }
  return null;
}

export function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * The shape a given leg is drawn with. Only the root leg carries the product's
 * real shape; every attached leg is a plain rectangle. Mirrors ChainCanvas's
 * render call so hit-testing can never disagree with what is on screen.
 */
export function legShape(shape: ShapeConfig, legIndex: number, rootIndex: number): ShapeConfig {
  return legIndex === rootIndex ? shape : { type: 'rectangle' };
}

export interface LegGeometryInput {
  segment: Segment;
  shape: ShapeConfig;
  drawW: number;
  drawH: number;
  heightMm: number;
}

/** A leg's local draw-space geometry, in the shape the tool helpers expect. */
export function legGeometry(input: LegGeometryInput): CanvasGeometry {
  const { segment, shape, drawW, drawH, heightMm } = input;
  const widthMm = segment.width;
  const realVerts = getRealVertices(shape, widthMm, heightMm);
  const svgVerts = scaleVertices(realVerts, widthMm, heightMm, drawW, drawH);
  return {
    panels: segment.panels,
    panelWidths: segment.panelWidths,
    svgVerts,
    drawW,
    drawH,
    width: widthMm,
    height: heightMm,
    shape,
    panelDivisions: segment.panelDivisions,
    panelDivisionHeights: segment.panelDivisionHeights,
    panelDivisionWidths: segment.panelDivisionWidths,
  };
}

/** The same leg, in the shape the erase helpers expect. */
export function legRemoveContext(input: LegGeometryInput, customArcs: PlacedArc[]): RemoveContext {
  const { segment, shape, drawW, drawH, heightMm } = input;
  const widthMm = segment.width;
  const realVerts = getRealVertices(shape, widthMm, heightMm);
  const svgVerts = scaleVertices(realVerts, widthMm, heightMm, drawW, drawH);
  const dividers = getPanelDividers(
    shape, segment.panels, segment.panelWidths, svgVerts, drawW, drawH, widthMm, heightMm,
  );
  return {
    shape,
    panels: segment.panels,
    panelWidths: segment.panelWidths,
    svgVerts,
    drawW,
    drawH,
    width: widthMm,
    height: heightMm,
    dividers,
    panelDivisions: segment.panelDivisions,
    panelDivisionHeights: segment.panelDivisionHeights,
    panelDivisionWidths: segment.panelDivisionWidths,
    openingPanels: segment.openingPanels ?? [],
    openingDirections: segment.openingDirections ?? {},
    openingPanes: segment.openingPanes,
    customArcs,
    removedSections: segment.removedSections,
  };
}
