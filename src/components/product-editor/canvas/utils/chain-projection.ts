// ---------------------------------------------------------------------------
// Corner-window chain geometry.
//
// The chain is laid out in a top-down "plan" space, then projected to the
// screen with a cabinet oblique projection. That projection leaves vertical
// lines vertical, so every segment reduces to a shear+scale SVG matrix and the
// existing flat renderers work unchanged inside the transform group.
// ---------------------------------------------------------------------------

import type { Point } from './types';
import { MARGIN, BOTTOM_LABEL_SPACE, DIM_OFFSET, DIM_LABEL_GAP, DIM_FONT, CHAIN_DIM_REACH } from './types';
import { OVERLAP_TOLERANCE, worstOverlapFraction } from './chain-overlap';

// ---------------------------------------------------------------------------
// Gutters
//
// The bounding box is measured from the legs and posts alone, but the dimension
// lines, their labels and the angle badges are all drawn OUTSIDE that box. The
// viewBox has to carry room for them or they render past its edge and get cut
// off by whatever the canvas sits next to.
//
// Each gutter is MARGIN plus whatever that side's annotation actually reaches.
// ---------------------------------------------------------------------------

/**
 * Height dimension (line, label, half a rotated glyph) or a leg's own stack of
 * width dimensions, whichever reaches further -- a leg whose sill slants can
 * throw its dimensions out sideways rather than downward.
 */
const GUTTER_LEFT = MARGIN + Math.max(DIM_OFFSET + DIM_LABEL_GAP + DIM_FONT / 2, CHAIN_DIM_REACH);
/** Angle badge: it sits above the topmost post and is DIM_FONT + padding tall. */
const GUTTER_TOP = MARGIN + DIM_OFFSET * 0.6 + DIM_FONT + 6;
/** A slanted sill pushes its whole dimension stack sideways, not just down. */
const GUTTER_RIGHT = MARGIN + CHAIN_DIM_REACH;
const GUTTER_BOTTOM = MARGIN + Math.max(BOTTOM_LABEL_SPACE, CHAIN_DIM_REACH);

/** Depth foreshortening. 0.5 is the classic "cabinet" projection. */
export const DEPTH_FACTOR = 0.5;
/** Screen angle the depth axis recedes along. */
export const DEPTH_ANGLE = Math.PI / 4;
/** Draw-space height of the chain, before margins. */
export const BASE_DRAW_HEIGHT = 180;
/** Furthest the whole assembly will ever be turned to unhide a leg. */
export const MAX_VIEW_TURN_DEG = 90;
/**
 * Narrowest a leg may be drawn, as a share of its true width. A leg turned
 * almost edge-on is not hidden by anything, but it collapses to a sliver with
 * no room for its panels -- just as unusable as being covered.
 */
export const MIN_FACE_RATIO = 0.25;
/**
 * Narrowest a corner post may be drawn, as a share of its real width. Posts are
 * drawn in the picture plane (see walkChain), so one at a corner folded almost
 * back on itself would otherwise vanish and let the two legs touch.
 */
export const MIN_POST_FACE = 0.25;

/** Which way depth recedes on screen. +1 is up and to the right. */
export type DepthSign = 1 | -1;

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
  /**
   * Plan-space distance from the viewer, for painting order. Larger is further
   * away, whichever way depth recedes -- the depth sign only moves a point
   * sideways on screen, never nearer or further.
   */
  depth: number;
}

/** How the whole assembly is turned and which way depth recedes. */
export interface ChainView {
  /** Turn applied to every leg, in radians. 0 keeps the first leg square-on. */
  rotationRad: number;
  depthSign: DepthSign;
  /**
   * False when no orientation leaves every leg visible -- a shape that hides
   * part of itself from any single viewpoint, such as a bay closed to a full
   * right angle at both joints.
   */
  resolved: boolean;
}

export interface ChainLayoutPost {
  index: number;
  corners: [Point, Point, Point, Point];
}

export interface ChainLayout {
  segments: ChainLayoutSegment[];
  posts: ChainLayoutPost[];
  view: ChainView;
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
 *
 * `startHeadingRad` turns the whole assembly before the walk begins. 0 leaves
 * the first leg square-on to the viewer, drawn at its true width.
 */
export function walkChain(
  widthsMm: number[],
  connectors: Array<{ angle: number; postWidth: number }>,
  startHeadingRad = 0,
): ChainPlan {
  const segments: PlanSegment[] = [];
  const posts: PlanPost[] = [];

  let heading = startHeadingRad;
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

    // The post advances along the bisector, but only its in-plane component.
    //
    // Advancing into depth as well would leave the two legs meeting the post at
    // different distances from the viewer, and a point further away draws
    // higher: the post's top edge would then rise above the leg beside it as a
    // wedge, and its bottom edge would stop short. Keeping the advance in the
    // picture plane means both legs meet the joint at the same depth, so post
    // and window corners land on exactly the same level.
    //
    // The cost is that the footprint loses the post's own depth -- 100mm at a
    // corner, against window widths in the metres. The legs themselves keep
    // their true headings and depths, so the corner still reads as a corner.
    const facing = bx < 0 ? -1 : 1;
    const inPlane = facing * Math.max(Math.abs(bx), MIN_POST_FACE);
    posts.push({
      index: i,
      startX: x, startY: y,
      dirX: inPlane, dirY: 0,
      widthMm: connector.postWidth,
    });
    x += inPlane * connector.postWidth;
    heading += turn;
  }

  return { segments, posts };
}

/**
 * Cabinet oblique projection. Depth recedes up and to the right, or up and to
 * the left when `depthSign` is -1.
 *
 * Only the horizontal term flips: a point's distance from the viewer still
 * raises it on screen by the same amount either way, so mirroring the depth
 * axis re-sides the drawing without changing what is in front of what.
 */
export function projectPlanPoint(x: number, y: number, depthSign: DepthSign = 1): Point {
  return {
    x: x + DEPTH_FACTOR * y * Math.cos(DEPTH_ANGLE) * depthSign,
    // Written as a subtraction rather than a unary negation so that y = 0
    // yields +0, not -0 -- keeps the front plane exactly equal to its input.
    y: 0 - DEPTH_FACTOR * y * Math.sin(DEPTH_ANGLE),
  };
}

// ---------------------------------------------------------------------------
// Choosing the view
//
// Every leg is drawn into one flat picture, so a chain that folds toward the
// viewer can put its second leg straight on top of its first. Turning the whole
// assembly a little separates them -- but a turned assembly no longer shows any
// leg at its true width, and the first leg is the surface the user places
// panels and openings on.
//
// So: stay square-on while the drawing still reads, and turn by the smallest
// angle that frees the hidden leg once it does not. On an ordinary corner that
// means no turn at all out to about 110 degrees of bend, after which the turn
// eases in a degree at a time rather than snapping.
// ---------------------------------------------------------------------------

/** The four projected corners of each leg's face, in draw-independent mm. */
function legFaces(
  widthsMm: number[],
  heightMm: number,
  connectors: Array<{ angle: number; postWidth: number }>,
  rotationRad: number,
  depthSign: DepthSign,
): Point[][] {
  return walkChain(widthsMm, connectors, rotationRad).segments.map((s) => {
    const near = projectPlanPoint(s.startX, s.startY, depthSign);
    const far = projectPlanPoint(s.startX + s.dirX * s.widthMm, s.startY + s.dirY * s.widthMm, depthSign);
    return [
      near,
      far,
      { x: far.x, y: far.y + heightMm },
      { x: near.x, y: near.y + heightMm },
    ];
  });
}

/**
 * Narrowest leg in the chain, as a share of its true width.
 *
 * A leg's drawn width is its heading's horizontal component plus whatever the
 * depth shear adds, so this is independent of how wide the leg actually is.
 */
export function narrowestFaceRatio(
  connectors: Array<{ angle: number; postWidth: number }>,
  rotationRad: number,
  depthSign: DepthSign,
): number {
  const widths = new Array(connectors.length + 1).fill(1);
  return Math.min(
    ...walkChain(widths, connectors, rotationRad).segments.map((s) =>
      Math.abs(s.dirX + DEPTH_FACTOR * s.dirY * Math.cos(DEPTH_ANGLE) * depthSign),
    ),
  );
}

/**
 * Smallest turn -- and the depth direction to pair it with -- that leaves every
 * leg both unhidden and wide enough to read. Prefers no turn at all, then turns
 * of one degree, two, and so on out to MAX_VIEW_TURN_DEG.
 *
 * The common cases exit on the first probe, so this normally costs one extra
 * plan walk. Only chains bent past roughly 110 degrees search at all.
 */
export function solveView(
  widthsMm: number[],
  heightMm: number,
  connectors: Array<{ angle: number; postWidth: number }>,
): ChainView {
  if (connectors.length === 0) return { rotationRad: 0, depthSign: 1, resolved: true };

  // Try the depth direction the chain already leans toward first, so a bend
  // that grows past a threshold does not also flip the drawing side to side.
  const netTurn = connectors.reduce((sum, c) => sum + (180 - c.angle), 0);
  const signs: DepthSign[] = netTurn >= 0 ? [1, -1] : [-1, 1];

  let best: ChainView = { rotationRad: 0, depthSign: signs[0], resolved: false };
  let bestPenalty = Infinity;

  for (let turn = 0; turn <= MAX_VIEW_TURN_DEG; turn++) {
    for (const deg of turn === 0 ? [0] : [turn, -turn]) {
      for (const depthSign of signs) {
        const rotationRad = (deg * Math.PI) / 180;
        const faceRatio = narrowestFaceRatio(connectors, rotationRad, depthSign);
        const hidden = worstOverlapFraction(legFaces(widthsMm, heightMm, connectors, rotationRad, depthSign));

        if (faceRatio >= MIN_FACE_RATIO && hidden < OVERLAP_TOLERANCE) {
          return { rotationRad, depthSign, resolved: true };
        }

        // Nothing has qualified yet, so remember the least-bad view in case
        // nothing ever does. Covered area and squashed width are both total
        // losses of information, so they weigh the same. Strict improvement
        // only, which keeps the smallest turn when scores tie.
        const penalty = hidden + Math.max(0, MIN_FACE_RATIO - faceRatio) / MIN_FACE_RATIO;
        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          best = { rotationRad, depthSign, resolved: false };
        }
      }
    }
  }

  return best;
}

/** Project the four corners of a plan-space run of the given width and height. */
function runCorners(
  startX: number, startY: number,
  dirX: number, dirY: number,
  widthMm: number, heightMm: number,
  scale: number, ox: number, oy: number,
  depthSign: DepthSign,
): [Point, Point, Point, Point] {
  const near = projectPlanPoint(startX, startY, depthSign);
  const far = projectPlanPoint(startX + dirX * widthMm, startY + dirY * widthMm, depthSign);
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
  const view = solveView(widthsMm, heightMm, connectors);
  const plan = walkChain(widthsMm, connectors, view.rotationRad);
  const scale = BASE_DRAW_HEIGHT / heightMm;
  const { depthSign } = view;

  // First pass with no offset, to measure the bounding box.
  const measure = (ox: number, oy: number) => {
    const segments = plan.segments.map((s) => ({
      index: s.index,
      corners: runCorners(s.startX, s.startY, s.dirX, s.dirY, s.widthMm, heightMm, scale, ox, oy, depthSign),
      drawW: s.widthMm * scale,
    }));
    const posts = plan.posts.map((p) => ({
      index: p.index,
      corners: runCorners(p.startX, p.startY, p.dirX, p.dirY, p.widthMm, heightMm, scale, ox, oy, depthSign),
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

  const ox = GUTTER_LEFT - minX;
  const oy = GUTTER_TOP - minY;
  const placed = measure(ox, oy);

  const cosA = Math.cos(DEPTH_ANGLE);
  const sinA = Math.sin(DEPTH_ANGLE);

  const segments: ChainLayoutSegment[] = plan.segments.map((s, i) => {
    const a = s.dirX + DEPTH_FACTOR * s.dirY * cosA * depthSign;
    const b = -DEPTH_FACTOR * s.dirY * sinA;
    const e = s.startX + DEPTH_FACTOR * s.startY * cosA * depthSign;
    const f = -DEPTH_FACTOR * s.startY * sinA;
    // c and d are 0 and 1: the oblique projection leaves vertical lines
    // vertical, so the local v (window height) axis maps straight through
    // with no shear or scale of its own -- only u (along the segment) picks
    // up the depth shear from dir.y.
    // The flat renderers draw their content starting at local (MARGIN, MARGIN),
    // so the matrix has to cancel that offset for the leg's top-left corner to
    // land on the projected corner.
    //
    // Both axes contribute to both screen coordinates once a leg is sheared:
    // local u moves the point by (a, b) and local v by (c, d) = (0, 1). So x
    // must cancel a*MARGIN and y must cancel BOTH b*MARGIN and d*MARGIN. Only
    // the d term was cancelled before, which drew every receding leg b*MARGIN
    // too low -- about 8% of the frame height at a right-angle corner, enough
    // to visibly unstick the leg from its corner post while the square-on legs
    // (where b is 0) stayed put.
    const matrix: Matrix6 = [
      a,
      b,
      0,
      1,
      scale * e + ox - a * MARGIN,
      scale * f + oy - MARGIN - b * MARGIN,
    ];
    return {
      index: s.index,
      matrix,
      corners: placed.segments[i].corners,
      drawW: placed.segments[i].drawW,
      depth: s.startY + (s.dirY * s.widthMm) / 2,
    };
  });

  return {
    segments,
    posts: placed.posts,
    view,
    scale,
    drawH: BASE_DRAW_HEIGHT,
    totalW: maxX - minX + GUTTER_LEFT + GUTTER_RIGHT,
    totalH: maxY - minY + GUTTER_TOP + GUTTER_BOTTOM,
  };
}
