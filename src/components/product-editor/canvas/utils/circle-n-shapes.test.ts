import { describe, expect, it, vi } from 'vitest';
import type { ShapeConfig } from '../../types';
import { getNShapeOpening, getRealVertices, getShapePath, scaleVertices } from './shape-path';
import { getPanelDividers, getPanelPolygonPoints } from './panels';
import { findPanelAtPoint } from './tool-interactions';
import { getEdgeCommitFn } from './edge-commit';
import { polygonArea } from './chain-overlap';
import { pointInPolygon } from './chain-interaction';
import { MARGIN } from './types';

function geometry(shape: ShapeConfig) {
  return {
    shape, width: 1000, height: 1000, panels: 1, panelWidths: [1000], drawW: 200, drawH: 200,
    svgVerts: scaleVertices(getRealVertices(shape, 1000, 1000), 1000, 1000, 200, 200),
  };
}

describe('Circle geometry', () => {
  const shape: ShapeConfig = { type: 'circle' };
  it('has a smooth closed arc path and a round clipping boundary', () => {
    const verts = getRealVertices(shape, 1000, 1000);
    for (const v of verts) expect(Math.hypot(v.x - 500, v.y - 500)).toBeCloseTo(500, 8);
    expect(polygonArea(verts) / (Math.PI * 500 ** 2)).toBeCloseTo(1, 3);
    expect(getShapePath(shape, [], 200, 200, 1000, 1000))
      .toBe('M 40 140 A 100 100 0 1 1 240 140 A 100 100 0 1 1 40 140 Z');
  });

  it('terminates the central divider at the circle and ignores bounding-box corners', () => {
    const geo = geometry(shape);
    const [divider] = getPanelDividers(shape, 2, [500, 500], geo.svgVerts, 200, 200, 1000, 1000);
    expect(divider.topY).toBeCloseTo(MARGIN);
    expect(divider.bottomY).toBeCloseTo(MARGIN + 200);
    expect(findPanelAtPoint(geo, 45, 45)).toBeNull();
    expect(findPanelAtPoint(geo, 140, 140)?.panelIndex).toBe(0);
  });
});

describe('N-Shape geometry', () => {
  const shape: ShapeConfig = { type: 'n-shape', cutoutWidth: 600, cutoutHeight: 700, cutoutOffset: 150 };

  it('has two legs and a top bar around an empty bottom opening', () => {
    const vertices = getRealVertices(shape, 1000, 1000);
    expect(vertices).toHaveLength(8);
    expect(polygonArea(vertices)).toBe(580000);
    expect(pointInPolygon({ x: 100, y: 900 }, vertices)).toBe(true);
    expect(pointInPolygon({ x: 900, y: 900 }, vertices)).toBe(true);
    expect(pointInPolygon({ x: 500, y: 100 }, vertices)).toBe(true);
    expect(pointInPolygon({ x: 500, y: 900 }, vertices)).toBe(false);
  });

  it('keeps divider and panel glass above the cutout, while both legs accept tools', () => {
    const geo = geometry(shape);
    const [divider] = getPanelDividers(shape, 2, [500, 500], geo.svgVerts, 200, 200, 1000, 1000);
    expect(divider).toEqual({ x: 140, topY: 40, bottomY: 100 });
    expect(findPanelAtPoint(geo, 60, 210)?.panelIndex).toBe(0);
    expect(findPanelAtPoint(geo, 220, 210)?.panelIndex).toBe(0);
    expect(findPanelAtPoint(geo, 140, 210)).toBeNull();
    const pts = getPanelPolygonPoints(shape, 0, 3, [150, 600, 250], geo.svgVerts, 200, 200, 1000, 1000);
    const polygon = pts.split(' ').map((p) => { const [x, y] = p.split(',').map(Number); return { x, y }; });
    expect(polygonArea(polygon)).toBeCloseTo(6000);
  });

  it('edits opening height/width and both leg widths by edge coordinates', () => {
    const onShapeConfigChange = vi.fn();
    const onWidthChange = vi.fn();
    const onHeightChange = vi.fn();
    const ctx = { shape, width: 1000, height: 1000, onShapeConfigChange, onWidthChange, onHeightChange };
    getEdgeCommitFn(ctx, { x: 750, y: 1000 }, { x: 750, y: 300 })?.(650);
    getEdgeCommitFn(ctx, { x: 750, y: 300 }, { x: 150, y: 300 })?.(500);
    getEdgeCommitFn(ctx, { x: 150, y: 1000 }, { x: 0, y: 1000 })?.(200);
    getEdgeCommitFn(ctx, { x: 1000, y: 1000 }, { x: 750, y: 1000 })?.(300);
    expect(onShapeConfigChange.mock.calls).toEqual([
      [{ cutoutHeight: 650 }], [{ cutoutWidth: 500 }], [{ cutoutOffset: 200 }], [{ cutoutOffset: 100 }],
    ]);
    expect(onWidthChange).not.toHaveBeenCalled();
    expect(onHeightChange).not.toHaveBeenCalled();
  });

  it('centers default openings and bounds oversized or invalid configuration', () => {
    expect(getNShapeOpening({ type: 'n-shape' }, 1000, 1000))
      .toEqual({ width: 600, height: 700, left: 200, right: 800, top: 300 });
    expect(getNShapeOpening({ type: 'n-shape', cutoutWidth: 1500, cutoutHeight: -50, cutoutOffset: NaN }, 1000, 1000))
      .toEqual({ width: 1000, height: 0, left: 0, right: 1000, top: 1000 });
  });
});
