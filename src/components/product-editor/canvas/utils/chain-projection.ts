// ---------------------------------------------------------------------------
// Corner-window chain geometry.
//
// The chain is laid out in a top-down "plan" space, then projected to the
// screen with a cabinet oblique projection. That projection leaves vertical
// lines vertical, so every segment reduces to a shear+scale SVG matrix and the
// existing flat renderers work unchanged inside the transform group.
// ---------------------------------------------------------------------------

import type { Point } from './types';
import { MARGIN, BOTTOM_LABEL_SPACE } from './types';

/** Depth foreshortening. 0.5 is the classic "cabinet" projection. */
export const DEPTH_FACTOR = 0.5;
/** Screen angle the depth axis recedes along. */
export const DEPTH_ANGLE = Math.PI / 4;
/** Draw-space height of the chain, before margins. */
export const BASE_DRAW_HEIGHT = 180;

/** SVG matrix(a, b, c, d, e, f): (u,v) -> (a*u + c*v + e, b*u + d*v + f) */
export type Matrix6 = [number, number, number, number, number, number];

export interface PlanSegment {
  index: number;
  startX: number; startY: number;
  dirX: number; dirY: number;
  headingRad: number;
  widthMm: number;
}

export interface PlanPost {
  index: number;
  startX: number; startY: number;
  dirX: number; dirY: number;
  widthMm: number;
}

export interface ChainPlan {
  segments: PlanSegment[];
  posts: PlanPost[];
}

export interface ChainLayoutSegment {
  index: number;
  matrix: Matrix6;
  /** Projected corners in draw space: top-left, top-right, bottom-right, bottom-left. */
  corners: [Point, Point, Point, Point];
  /** Local draw-space width of this segment, for the flat renderers. */
  drawW: number;
}

export interface ChainLayoutPost {
  index: number;
  corners: [Point, Point, Point, Point];
}

export interface ChainLayout {
  segments: ChainLayoutSegment[];
  posts: ChainLayoutPost[];
  /** Draw units per mm. Uniform across both axes. */
  scale: number;
  drawH: number;
  totalW: number;
  totalH: number;
}

/**
 * Walk the chain in plan space.
 *
 * Interior angle theta turns the next segment by (180 - theta), so theta = 180
 * is straight and theta = 90 is a right-angle corner. Each post advances along
 * the bisector of the two headings it joins, so it visually fills the corner.
 */
export function walkChain(
  widthsMm: number[],
  connectors: Array<{ angle: number; postWidth: number }>,
): ChainPlan {
  const segments: PlanSegment[] = [];
  const posts: PlanPost[] = [];

  let heading = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i < widthsMm.length; i++) {
    const dirX = Math.cos(heading);
    const dirY = Math.sin(heading);
    segments.push({
      index: i,
      startX: x, startY: y,
      dirX, dirY,
      headingRad: heading,
      widthMm: widthsMm[i],
    });
    x += dirX * widthsMm[i];
    y += dirY * widthsMm[i];

    const connector = connectors[i];
    if (!connector) continue;

    const turn = ((180 - connector.angle) * Math.PI) / 180;
    const bisector = heading + turn / 2;
    const bx = Math.cos(bisector);
    const by = Math.sin(bisector);
    posts.push({
      index: i,
      startX: x, startY: y,
      dirX: bx, dirY: by,
      widthMm: connector.postWidth,
    });
    x += bx * connector.postWidth;
    y += by * connector.postWidth;
    heading += turn;
  }

  return { segments, posts };
}

/** Cabinet oblique projection. Depth recedes up and to the right. */
export function projectPlanPoint(x: number, y: number): Point {
  return {
    x: x + DEPTH_FACTOR * y * Math.cos(DEPTH_ANGLE),
    // Written as a subtraction rather than a unary negation so that y = 0
    // yields +0, not -0 -- keeps the front plane exactly equal to its input.
    y: 0 - DEPTH_FACTOR * y * Math.sin(DEPTH_ANGLE),
  };
}

/** Project the four corners of a plan-space run of the given width and height. */
function runCorners(
  startX: number, startY: number,
  dirX: number, dirY: number,
  widthMm: number, heightMm: number,
  scale: number, ox: number, oy: number,
): [Point, Point, Point, Point] {
  const near = projectPlanPoint(startX, startY);
  const far = projectPlanPoint(startX + dirX * widthMm, startY + dirY * widthMm);
  const toDraw = (p: Point, drop: number): Point => ({
    x: p.x * scale + ox,
    y: (p.y + drop) * scale + oy,
  });
  return [
    toDraw(near, 0),
    toDraw(far, 0),
    toDraw(far, heightMm),
    toDraw(near, heightMm),
  ];
}

/**
 * Project the whole chain into draw space and produce one transform matrix per
 * segment, plus a fitted viewBox.
 */
export function layoutChain(
  widthsMm: number[],
  heightMm: number,
  connectors: Array<{ angle: number; postWidth: number }>,
): ChainLayout {
  const plan = walkChain(widthsMm, connectors);
  const scale = BASE_DRAW_HEIGHT / heightMm;

  // First pass with no offset, to measure the bounding box.
  const measure = (ox: number, oy: number) => {
    const segments = plan.segments.map((s) => ({
      index: s.index,
      corners: runCorners(s.startX, s.startY, s.dirX, s.dirY, s.widthMm, heightMm, scale, ox, oy),
      drawW: s.widthMm * scale,
    }));
    const posts = plan.posts.map((p) => ({
      index: p.index,
      corners: runCorners(p.startX, p.startY, p.dirX, p.dirY, p.widthMm, heightMm, scale, ox, oy),
    }));
    return { segments, posts };
  };

  const probe = measure(0, 0);
  const allPoints = [
    ...probe.segments.flatMap((s) => s.corners),
    ...probe.posts.flatMap((p) => p.corners),
  ];
  const minX = Math.min(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const maxY = Math.max(...allPoints.map((p) => p.y));

  const ox = MARGIN - minX;
  const oy = MARGIN - minY;
  const placed = measure(ox, oy);

  const cosA = Math.cos(DEPTH_ANGLE);
  const sinA = Math.sin(DEPTH_ANGLE);

  const segments: ChainLayoutSegment[] = plan.segments.map((s, i) => {
    const a = s.dirX + DEPTH_FACTOR * s.dirY * cosA;
    const b = -DEPTH_FACTOR * s.dirY * sinA;
    const e = s.startX + DEPTH_FACTOR * s.startY * cosA;
    const f = -DEPTH_FACTOR * s.startY * sinA;
    // c and d are 0 and 1: the oblique projection leaves vertical lines
    // vertical, so the local v (window height) axis maps straight through
    // with no shear or scale of its own -- only u (along the segment) picks
    // up the depth shear from dir.y.
    const matrix: Matrix6 = [
      a,
      b,
      0,
      1,
      scale * e + ox - a * MARGIN,
      scale * f + oy - MARGIN,
    ];
    return { index: s.index, matrix, corners: placed.segments[i].corners, drawW: placed.segments[i].drawW };
  });

  return {
    segments,
    posts: placed.posts,
    scale,
    drawH: BASE_DRAW_HEIGHT,
    totalW: maxX - minX + 2 * MARGIN,
    totalH: maxY - minY + 2 * MARGIN + BOTTOM_LABEL_SPACE,
  };
}
