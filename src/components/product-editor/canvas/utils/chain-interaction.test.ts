import { describe, it, expect } from 'vitest';
import { layoutChain } from './chain-projection';
import { screenToLegLocal, legAtPoint, legGeometry, legShape, pointInPolygon } from './chain-interaction';
import { makeSegment } from './chain-model';
import { findPanelAtPoint } from './tool-interactions';
import { MARGIN } from './types';
import type { Matrix6 } from './chain-projection';
import type { ShapeConfig } from '@/components/product-editor/types';

const RECT: ShapeConfig = { type: 'rectangle' };
const close = (a: number, b: number, tol = 0.001) => Math.abs(a - b) < tol;

const chainOf = (widths: number[], bends: number[]) =>
  layoutChain(widths, 1000, bends.map((b) => ({ angle: 180 - b, postWidth: 100 })));

const CONFIGS: Array<[string, number[], number[]]> = [
  ['corner +90',  [1000, 1000],       [90]],
  ['corner -90',  [1000, 1000],       [-90]],
  ['corner -135', [1000, 1000],       [-135]],
  ['Z -90 +90',   [1000, 1000, 1000], [-90, 90]],
  ['bay +60',     [800, 1200, 800],   [60, 60]],
];

describe('screenToLegLocal', () => {
  // Tools hit-test in a leg's own coordinates, but the pointer arrives in the
  // chain's. If this inverse disagrees with the matrix by even a little, a
  // click lands on the wrong pane.
  for (const [name, widths, bends] of CONFIGS) {
    it(`round-trips through every leg's matrix: ${name}`, () => {
      const layout = chainOf(widths, bends);
      for (const leg of layout.segments) {
        const [a, b, c, d, e, f] = leg.matrix;
        const apply = (u: number, v: number) => ({ x: a * u + c * v + e, y: b * u + d * v + f });
        for (const u of [MARGIN, MARGIN + leg.drawW / 3, MARGIN + leg.drawW]) {
          for (const v of [MARGIN, MARGIN + layout.drawH / 2, MARGIN + layout.drawH]) {
            const back = screenToLegLocal(leg.matrix, apply(u, v));
            expect(back).not.toBeNull();
            expect(close(back!.x, u)).toBe(true);
            expect(close(back!.y, v)).toBe(true);
          }
        }
      }
    });
  }

  it('refuses a matrix that squashes the leg to nothing', () => {
    const degenerate: Matrix6 = [0, 0.5, 0, 1, 10, 10];
    expect(screenToLegLocal(degenerate, { x: 5, y: 5 })).toBeNull();
  });
});

describe('legAtPoint', () => {
  for (const [name, widths, bends] of CONFIGS) {
    it(`finds the leg under a point inside it: ${name}`, () => {
      const layout = chainOf(widths, bends);
      for (const leg of layout.segments) {
        const cx = leg.corners.reduce((s, p) => s + p.x, 0) / 4;
        const cy = leg.corners.reduce((s, p) => s + p.y, 0) / 4;
        expect(legAtPoint(layout, { x: cx, y: cy })).toBe(leg.index);
      }
    });
  }

  it('returns null well outside the chain', () => {
    const layout = chainOf([1000, 1000], [90]);
    expect(legAtPoint(layout, { x: -500, y: -500 })).toBeNull();
  });

  it('prefers the nearer leg where two overlap', () => {
    // A bay closed hard at both joints is the shape no view fully separates,
    // so a click in the overlap must resolve to the leg the user can see.
    const layout = chainOf([800, 1200, 800], [135, 135]);
    const overlap = layout.segments
      .map((s) => ({ i: s.index, depth: s.depth, cx: s.corners.reduce((a, p) => a + p.x, 0) / 4, cy: s.corners.reduce((a, p) => a + p.y, 0) / 4 }));
    for (const o of overlap) {
      const hit = legAtPoint(layout, { x: o.cx, y: o.cy });
      expect(hit).not.toBeNull();
      const hitDepth = layout.segments[hit!].depth;
      // Whatever it picked must be no further away than the leg whose centre
      // we probed -- never a leg hidden behind it.
      expect(hitDepth).toBeLessThanOrEqual(o.depth + 0.001);
    }
  });
});

describe('legShape', () => {
  it('gives the product shape to the root leg and rectangles to the rest', () => {
    const arch: ShapeConfig = { type: 'arch' } as ShapeConfig;
    expect(legShape(arch, 1, 1)).toBe(arch);
    expect(legShape(arch, 0, 1)).toEqual({ type: 'rectangle' });
  });
});

describe('legGeometry', () => {
  it('describes the leg at its own width, not the product width', () => {
    const layout = chainOf([1000, 600], [90]);
    const geo = legGeometry({
      segment: makeSegment(600),
      shape: RECT,
      drawW: layout.segments[1].drawW,
      drawH: layout.drawH,
      heightMm: 1000,
    });
    expect(geo.width).toBe(600);
    expect(geo.height).toBe(1000);
    expect(geo.drawW).toBe(layout.segments[1].drawW);
    expect(geo.svgVerts.length).toBeGreaterThan(2);
  });
});

describe('pointInPolygon', () => {
  const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
  it('accepts the inside and rejects the outside', () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
  });
});

describe('routing a click through to a pane', () => {
  // The whole point of the inverse: a point picked on the chain must come out
  // of the flat helpers as the same panel the user aimed at, on the same leg.
  const cases: Array<[string, number[], number[]]> = [
    ['corner +90', [1200, 900], [90]],
    ['corner -90', [1200, 900], [-90]],
    ['Z -90 +90', [1000, 900, 1100], [-90, 90]],
  ];

  for (const [name, widths, bends] of cases) {
    it(`lands on the right panel of the right leg: ${name}`, () => {
      const layout = chainOf(widths, bends);
      const segments = widths.map((w) => {
        const seg = makeSegment(w);
        // Three unequal panels, so an off-by-one in the inverse cannot pass.
        seg.panels = 3;
        seg.panelWidths = [w * 0.5, w * 0.2, w * 0.3];
        return seg;
      });

      for (let legIndex = 0; legIndex < segments.length; legIndex++) {
        const leg = layout.segments[legIndex];
        const geo = legGeometry({
          segment: segments[legIndex],
          shape: RECT,
          drawW: leg.drawW,
          drawH: layout.drawH,
          heightMm: 1000,
        });
        const [a, b, c, d, e, f] = leg.matrix;
        const toChain = (u: number, v: number) => ({ x: a * u + c * v + e, y: b * u + d * v + f });

        // Walk to the middle of each panel in the leg's own space.
        let cursor = MARGIN;
        for (let panel = 0; panel < 3; panel++) {
          const panelDrawW = (segments[legIndex].panelWidths[panel] / segments[legIndex].width) * leg.drawW;
          const localX = cursor + panelDrawW / 2;
          const localY = MARGIN + layout.drawH / 2;
          cursor += panelDrawW;

          const chainPt = toChain(localX, localY);
          expect(legAtPoint(layout, chainPt)).toBe(legIndex);

          const back = screenToLegLocal(leg.matrix, chainPt);
          expect(back).not.toBeNull();
          const hit = findPanelAtPoint(geo, back!.x, back!.y);
          expect(hit).not.toBeNull();
          expect(hit!.panelIndex).toBe(panel);
        }
      }
    });
  }
});
