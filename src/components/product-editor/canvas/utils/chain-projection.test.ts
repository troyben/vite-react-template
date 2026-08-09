import { describe, it, expect } from 'vitest';
import { walkChain, projectPlanPoint, layoutChain, solveView, narrowestFaceRatio, MIN_FACE_RATIO, MAX_VIEW_TURN_DEG } from './chain-projection';
import { worstOverlapFraction, OVERLAP_TOLERANCE } from './chain-overlap';
import {
  DIM_OFFSET, DIM_LABEL_GAP, DIM_FONT, MARGIN,
  CHAIN_INNER_DIM_OFFSET, CHAIN_INNER_LABEL_GAP, CHAIN_LEG_DIM_OFFSET, CHAIN_LEG_LABEL_GAP, CHAIN_DIM_REACH,
  CHAIN_PANE_DIM_OFFSET, CHAIN_PANE_LABEL_GAP, CHAIN_LEG_DIM_OFFSET_PANES, chainDimReach,
} from './types';

const close = (a: number, b: number, tol = 0.01) => Math.abs(a - b) < tol;

describe('walkChain', () => {
  it('places a single segment at the origin facing the viewer', () => {
    const plan = walkChain([1000], []);
    expect(plan.segments).toHaveLength(1);
    expect(plan.posts).toHaveLength(0);
    const s = plan.segments[0];
    expect(s.startX).toBe(0);
    expect(s.startY).toBe(0);
    expect(close(s.dirX, 1)).toBe(true);
    expect(close(s.dirY, 0)).toBe(true);
  });

  it('turns the second segment 90 degrees for a 90 degree interior angle', () => {
    const plan = walkChain([1000, 800], [{ angle: 90, postWidth: 100 }]);
    expect(plan.segments).toHaveLength(2);
    expect(plan.posts).toHaveLength(1);

    // The post starts at the end of segment 0 and takes only the in-plane part
    // of the 45 degree bisector, so both legs meet it at the same depth and the
    // joint draws flush. See the comment in walkChain.
    const post = plan.posts[0];
    expect(close(post.startX, 1000)).toBe(true);
    expect(close(post.startY, 0)).toBe(true);
    expect(close(post.dirX, Math.SQRT1_2)).toBe(true);
    expect(post.dirY).toBe(0);

    // segment 1 starts past the post, at the same depth, and heads away
    const s1 = plan.segments[1];
    expect(close(s1.startX, 1000 + 100 * Math.SQRT1_2)).toBe(true);
    expect(s1.startY).toBe(0);
    expect(close(s1.dirX, 0)).toBe(true);
    expect(close(s1.dirY, 1)).toBe(true);
  });

  it('keeps the chain straight at 180 degrees', () => {
    const plan = walkChain([1000, 800], [{ angle: 180, postWidth: 100 }]);
    const s1 = plan.segments[1];
    expect(close(s1.startX, 1100)).toBe(true);
    expect(close(s1.startY, 0)).toBe(true);
    expect(close(s1.dirX, 1)).toBe(true);
    expect(close(s1.dirY, 0)).toBe(true);
  });

  it('folds toward the viewer above 180 degrees', () => {
    const plan = walkChain([1000, 800], [{ angle: 270, postWidth: 0 }]);
    const s1 = plan.segments[1];
    expect(close(s1.dirY, -1)).toBe(true);
  });
});

describe('projectPlanPoint', () => {
  it('leaves the front plane untouched', () => {
    expect(projectPlanPoint(500, 0)).toEqual({ x: 500, y: 0 });
  });

  it('sends depth up and to the right', () => {
    const p = projectPlanPoint(0, 100);
    expect(close(p.x, 100 * 0.5 * Math.SQRT1_2)).toBe(true);
    expect(close(p.y, -100 * 0.5 * Math.SQRT1_2)).toBe(true);
  });
});

describe('layoutChain', () => {
  it('gives a lone segment an unsheared matrix', () => {
    const layout = layoutChain([1000], 1000, []);
    const [a, b, c, d] = layout.segments[0].matrix;
    expect(close(a, 1)).toBe(true);
    expect(close(b, 0)).toBe(true);
    expect(c).toBe(0);
    expect(d).toBe(1);
  });

  it('shears the second leg of a 90 degree corner', () => {
    const layout = layoutChain([1000, 800], 1000, [{ angle: 90, postWidth: 100 }]);
    const [a, b] = layout.segments[1].matrix;
    // dir = (0, 1): a = D*cosA, b = -D*sinA
    expect(close(a, 0.5 * Math.SQRT1_2)).toBe(true);
    expect(close(b, -0.5 * Math.SQRT1_2)).toBe(true);
  });

  it('scales uniformly from the shared height', () => {
    const layout = layoutChain([1000, 800], 2000, [{ angle: 90, postWidth: 100 }]);
    expect(close(layout.scale, 180 / 2000)).toBe(true);
    expect(close(layout.drawH, 180)).toBe(true);
    expect(close(layout.segments[1].drawW, (180 / 2000) * 800)).toBe(true);
  });

  it('fits the bounding box so nothing is drawn left of or above the margin', () => {
    const layout = layoutChain([1000, 800], 1000, [{ angle: 270, postWidth: 100 }]);
    const xs = layout.segments.flatMap((s) => s.corners.map((p) => p.x));
    const ys = layout.segments.flatMap((s) => s.corners.map((p) => p.y));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(39.99);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(39.99);
    expect(layout.totalW).toBeGreaterThan(Math.max(...xs));
    expect(layout.totalH).toBeGreaterThan(Math.max(...ys));
  });
});

describe('walkChain view rotation', () => {
  it('turns the whole assembly by the start heading', () => {
    const plan = walkChain([1000], [], Math.PI / 2);
    const s = plan.segments[0];
    expect(close(s.dirX, 0)).toBe(true);
    expect(close(s.dirY, 1)).toBe(true);
  });

  it('leaves the first leg square-on by default', () => {
    expect(close(walkChain([1000], []).segments[0].dirX, 1)).toBe(true);
  });
});

describe('projectPlanPoint depth sign', () => {
  it('mirrors depth to the left without changing how far it rises', () => {
    const right = projectPlanPoint(0, 100, 1);
    const left = projectPlanPoint(0, 100, -1);
    expect(close(left.x, -right.x)).toBe(true);
    expect(close(left.y, right.y)).toBe(true);
  });
});

describe('solveView', () => {
  const corner = (interior: number) => solveView([1000, 1000], 1000, [{ angle: interior, postWidth: 100 }]);

  it('does not turn a chain with no corners', () => {
    const view = solveView([1000], 1000, []);
    expect(view).toEqual({ rotationRad: 0, depthSign: 1, resolved: true });
  });

  it('keeps an ordinary right-angle corner square-on', () => {
    const view = corner(90);
    expect(view.rotationRad).toBe(0);
    expect(view.depthSign).toBe(1);
  });

  it('keeps the first leg square-on when the corner bends toward the viewer', () => {
    // The reported case: interior 270 is a 90 degree bend downward on screen.
    // Before, the second leg folded back over the first; now depth mirrors
    // instead and no rotation is spent.
    const view = corner(270);
    expect(view.rotationRad).toBe(0);
    expect(view.depthSign).toBe(-1);
    expect(view.resolved).toBe(true);
  });

  it('turns only once staying square-on stops working, and eases in', () => {
    const turns = [270, 285, 300, 315, 330].map((a) => Math.abs(corner(a).rotationRad));
    // Monotone, so dragging the slider never snaps the drawing round.
    for (let i = 1; i < turns.length; i++) expect(turns[i]).toBeGreaterThanOrEqual(turns[i - 1]);
    expect(turns[0]).toBe(0);
    expect(turns[turns.length - 1]).toBeGreaterThan(0);
  });

  it('admits when a shape hides part of itself from every angle', () => {
    // A three-leg bay closed hard at both joints puts its two returns face to
    // face. No single viewpoint shows both.
    const view = solveView([800, 1200, 800], 1000, [
      { angle: 45, postWidth: 100 },
      { angle: 45, postWidth: 100 },
    ]);
    expect(view.resolved).toBe(false);
  });
});

describe('layoutChain keeps every leg visible', () => {
  it('hides nothing at any bend it reports as resolved', () => {
    const hidden: Array<{ interior: number; fraction: number }> = [];
    for (let interior = 5; interior <= 355; interior += 5) {
      const connectors = [{ angle: interior, postWidth: 100 }];
      if (!solveView([1000, 1000], 1000, connectors).resolved) continue;
      const layout = layoutChain([1000, 1000], 1000, connectors);
      const fraction = worstOverlapFraction(layout.segments.map((s) => s.corners));
      if (fraction >= OVERLAP_TOLERANCE) hidden.push({ interior, fraction });
    }
    expect(hidden).toEqual([]);
  });

  it('resolves every bend up to 145 degrees either way', () => {
    // Past that the two legs are folded so far back onto each other that no
    // single viewpoint shows both -- solveView says so rather than pretending.
    const unresolved: number[] = [];
    for (let bend = -145; bend <= 145; bend += 5) {
      const connectors = [{ angle: 180 - bend, postWidth: 100 }];
      if (!solveView([1000, 1000], 1000, connectors).resolved) unresolved.push(bend);
    }
    expect(unresolved).toEqual([]);
  });

  it('still returns a usable view when it cannot resolve one', () => {
    const view = solveView([1000, 1000], 1000, [{ angle: 5, postWidth: 100 }]);
    expect(view.resolved).toBe(false);
    expect(Number.isFinite(view.rotationRad)).toBe(true);
    expect(Math.abs(view.rotationRad)).toBeLessThanOrEqual((MAX_VIEW_TURN_DEG * Math.PI) / 180);
  });

  it('orders legs so the furthest is painted first', () => {
    const layout = layoutChain([1000, 1000], 1000, [{ angle: 90, postWidth: 100 }]);
    // Interior 90 sends the second leg away from the viewer.
    expect(layout.segments[1].depth).toBeGreaterThan(layout.segments[0].depth);
  });

  it('reports the view it chose', () => {
    expect(layoutChain([1000, 1000], 1000, [{ angle: 270, postWidth: 100 }]).view.depthSign).toBe(-1);
  });
});

describe('legibility', () => {
  it('never draws a leg as an edge-on sliver', () => {
    const narrow: Array<{ interior: number; ratio: number }> = [];
    for (let interior = 5; interior <= 355; interior += 5) {
      const connectors = [{ angle: interior, postWidth: 100 }];
      const { rotationRad, depthSign, resolved } = solveView([1000, 1000], 1000, connectors);
      if (!resolved) continue;
      const ratio = narrowestFaceRatio(connectors, rotationRad, depthSign);
      if (ratio < MIN_FACE_RATIO) narrow.push({ interior, ratio });
    }
    expect(narrow).toEqual([]);
  });

  it('still keeps a plain right-angle corner square-on', () => {
    expect(solveView([1000, 1000], 1000, [{ angle: 90, postWidth: 100 }]).rotationRad).toBe(0);
    expect(solveView([1000, 1000], 1000, [{ angle: 270, postWidth: 100 }]).rotationRad).toBe(0);
  });
});

describe('joints draw flush', () => {
  // Every configuration the canvas can reach, including the Z that exposed the
  // problem: a post must never extend above or below the legs it joins.
  const configs: Array<[string, number[], number[]]> = [
    ['corner +90',  [1000, 1000],       [90]],
    ['corner -90',  [1000, 1000],       [-90]],
    ['corner -135', [1000, 1000],       [-135]],
    ['Z -90 +90',   [1000, 1000, 1000], [-90, 90]],
    ['bay +60',     [800, 1200, 800],   [60, 60]],
  ];

  for (const [name, widths, bends] of configs) {
    it(`keeps post and window corners level: ${name}`, () => {
      const connectors = bends.map((b) => ({ angle: 180 - b, postWidth: 100 }));
      const layout = layoutChain(widths, 1000, connectors);
      layout.posts.forEach((post, i) => {
        const postTop = Math.min(...post.corners.map((p) => p.y));
        const postBottom = Math.max(...post.corners.map((p) => p.y));
        for (const leg of [layout.segments[i], layout.segments[i + 1]]) {
          const legTop = Math.min(...leg.corners.map((p) => p.y));
          const legBottom = Math.max(...leg.corners.map((p) => p.y));
          expect(postTop).toBeGreaterThanOrEqual(legTop - 0.01);
          expect(postBottom).toBeLessThanOrEqual(legBottom + 0.01);
        }
      });
    });
  }

  it('gives every post the same height as the legs, not more', () => {
    const layout = layoutChain([1000, 1000, 1000], 1000, [
      { angle: 270, postWidth: 100 },
      { angle: 90, postWidth: 100 },
    ]);
    for (const post of layout.posts) {
      const span = Math.max(...post.corners.map((p) => p.y)) - Math.min(...post.corners.map((p) => p.y));
      expect(close(span, layout.drawH, 0.01)).toBe(true);
    }
  });

  it('never lets a post collapse to nothing', () => {
    for (let bend = -175; bend <= 175; bend += 5) {
      const layout = layoutChain([1000, 1000], 1000, [{ angle: 180 - bend, postWidth: 100 }]);
      const xs = layout.posts[0].corners.map((p) => p.x);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0);
    }
  });
});

describe('the viewBox has room for the dimensions', () => {
  // The bounding box is measured from legs and posts, but the dimension lines,
  // their labels and the angle badges are drawn outside it. Anything landing
  // beyond the viewBox is cut off on screen.
  const configs: Array<[string, number[], number[]]> = [
    ['single leg',  [1000],             []],
    ['corner +90',  [1000, 1000],       [90]],
    ['corner -90',  [1000, 1000],       [-90]],
    ['corner -145', [1000, 1000],       [-145]],
    ['Z -90 +90',   [1000, 1000, 1000], [-90, 90]],
    ['bay +60',     [800, 1200, 800],   [60, 60]],
    ['tall',        [1000, 1000],       [-90]],
  ];

  for (const [name, widths, bends] of configs) {
    it(`fits every annotation: ${name}`, () => {
      const connectors = bends.map((b) => ({ angle: 180 - b, postWidth: 100 }));
      const layout = layoutChain(widths, 3000, connectors);
      const corners = layout.segments.flatMap((s) => s.corners);

      // Height dimension, at the far left: line, label, half a rotated glyph.
      const leftInk = Math.min(...corners.map((p) => p.x)) - DIM_OFFSET - DIM_LABEL_GAP - DIM_FONT / 2;
      expect(leftInk).toBeGreaterThanOrEqual(0);

      // Width dimensions, below each sill.
      const bottomInk = Math.max(...corners.map((p) => p.y)) + DIM_OFFSET + DIM_LABEL_GAP + DIM_FONT;
      expect(bottomInk).toBeLessThanOrEqual(layout.totalH);

      // Angle badge above each post.
      for (const post of layout.posts) {
        const badgeTop = Math.min(...post.corners.map((p) => p.y)) - DIM_OFFSET * 0.6 - 10;
        expect(badgeTop).toBeGreaterThanOrEqual(0);
      }

      // Nothing at all past the right edge.
      const rightInk = Math.max(...corners.map((p) => p.x)) + DIM_OFFSET;
      expect(rightInk).toBeLessThanOrEqual(layout.totalW);
    });
  }
});

describe('the matrix puts a leg where its corners say it is', () => {
  // The corners are used for hit-testing, dimensions and the erase overlay;
  // the matrix is what actually draws the frame and glass. They were allowed to
  // disagree once: the matrix cancelled the renderers' MARGIN offset on the v
  // axis but not the u axis, so any sheared leg drew b*MARGIN below its own
  // corners while square-on legs looked fine.
  const configs: Array<[string, number[], number[]]> = [
    ['corner +90',  [1000, 1000],       [90]],
    ['corner -90',  [1000, 1000],       [-90]],
    ['corner -135', [1000, 1000],       [-135]],
    ['corner +45',  [1000, 800],        [45]],
    ['Z -90 +90',   [1000, 1000, 1000], [-90, 90]],
    ['bay +60',     [800, 1200, 800],   [60, 60]],
  ];

  for (const [name, widths, bends] of configs) {
    it(`draws every leg on its own corners: ${name}`, () => {
      const layout = layoutChain(widths, 1000, bends.map((b) => ({ angle: 180 - b, postWidth: 100 })));
      for (const leg of layout.segments) {
        const [a, b, c, d, e, f] = leg.matrix;
        const at = (u: number, v: number) => ({ x: a * u + c * v + e, y: b * u + d * v + f });
        const [tl, tr, br, bl] = leg.corners;

        const drawnTL = at(MARGIN, MARGIN);
        const drawnTR = at(MARGIN + leg.drawW, MARGIN);
        const drawnBR = at(MARGIN + leg.drawW, MARGIN + layout.drawH);
        const drawnBL = at(MARGIN, MARGIN + layout.drawH);

        expect(close(drawnTL.x, tl.x)).toBe(true);
        expect(close(drawnTL.y, tl.y)).toBe(true);
        expect(close(drawnTR.x, tr.x)).toBe(true);
        expect(close(drawnTR.y, tr.y)).toBe(true);
        expect(close(drawnBR.x, br.x)).toBe(true);
        expect(close(drawnBR.y, br.y)).toBe(true);
        expect(close(drawnBL.x, bl.x)).toBe(true);
        expect(close(drawnBL.y, bl.y)).toBe(true);
      }
    });
  }
});

describe('the chain dimension stack', () => {
  // Two rows share each sill: panel widths, then the leg's own width. They are
  // stacked by distance along the sill's normal, so the order has to hold as
  // numbers -- on a slanted leg you cannot fall back on screen y to separate
  // them.
  it('keeps the panel row strictly inside the leg row', () => {
    expect(CHAIN_INNER_DIM_OFFSET).toBeGreaterThan(0);
    expect(CHAIN_INNER_DIM_OFFSET + CHAIN_INNER_LABEL_GAP).toBeLessThan(CHAIN_LEG_DIM_OFFSET);
  });

  it('reports a reach that covers its own outermost label', () => {
    expect(CHAIN_DIM_REACH).toBeGreaterThanOrEqual(
      CHAIN_LEG_DIM_OFFSET + CHAIN_LEG_LABEL_GAP + DIM_FONT / 2,
    );
  });

  it('leaves room for the whole stack on every side', () => {
    const configs: Array<[number[], number[]]> = [
      [[1000, 1000], [90]],
      [[1000, 1000], [-90]],
      [[1000, 900, 1000], [-90, 90]],
      [[800, 1200, 800], [60, 60]],
    ];
    for (const [widths, bends] of configs) {
      const layout = layoutChain(widths, 1000, bends.map((b) => ({ angle: 180 - b, postWidth: 100 })));
      const corners = layout.segments.flatMap((s) => s.corners);
      // A sill's normal can point diagonally, so the stack can be thrown out
      // sideways as far as it is thrown downward.
      expect(Math.min(...corners.map((p) => p.x)) - CHAIN_DIM_REACH).toBeGreaterThanOrEqual(0);
      expect(Math.max(...corners.map((p) => p.x)) + CHAIN_DIM_REACH).toBeLessThanOrEqual(layout.totalW);
      expect(Math.max(...corners.map((p) => p.y)) + CHAIN_DIM_REACH).toBeLessThanOrEqual(layout.totalH);
    }
  });
});

describe('the pane dimension row', () => {
  it('sits between the panel widths and the leg width', () => {
    expect(CHAIN_INNER_DIM_OFFSET + CHAIN_INNER_LABEL_GAP).toBeLessThanOrEqual(CHAIN_PANE_DIM_OFFSET);
    expect(CHAIN_PANE_DIM_OFFSET + CHAIN_PANE_LABEL_GAP).toBeLessThan(CHAIN_LEG_DIM_OFFSET_PANES);
  });

  it('costs extra reach only when a panel is actually subdivided', () => {
    expect(chainDimReach(false)).toBe(CHAIN_DIM_REACH);
    expect(chainDimReach(true)).toBeGreaterThan(chainDimReach(false));
  });

  it('widens the viewBox by exactly the extra reach it asks for', () => {
    const conns = [{ angle: 90, postWidth: 100 }];
    const plain = layoutChain([1000, 1000], 1000, conns, chainDimReach(false));
    const paned = layoutChain([1000, 1000], 1000, conns, chainDimReach(true));
    const extra = chainDimReach(true) - chainDimReach(false);
    expect(paned.totalW - plain.totalW).toBeCloseTo(extra * 2, 6);
  });

  it('still fits the whole stack once a pane row is present', () => {
    const reach = chainDimReach(true);
    for (const bends of [[90], [-90], [-90, 90]]) {
      const layout = layoutChain(
        bends.map(() => 1000).concat([1000]), 1000,
        bends.map((b) => ({ angle: 180 - b, postWidth: 100 })),
        reach,
      );
      const corners = layout.segments.flatMap((s) => s.corners);
      expect(Math.min(...corners.map((p) => p.x)) - reach).toBeGreaterThanOrEqual(0);
      expect(Math.max(...corners.map((p) => p.x)) + reach).toBeLessThanOrEqual(layout.totalW);
      expect(Math.max(...corners.map((p) => p.y)) + reach).toBeLessThanOrEqual(layout.totalH);
    }
  });
});
