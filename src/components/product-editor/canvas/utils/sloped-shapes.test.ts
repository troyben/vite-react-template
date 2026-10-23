import { describe, expect, it, vi } from 'vitest';
import type { ShapeConfig } from '../../types';
import { getRealVertices, getShortSideHeight, scaleVertices } from './shape-path';
import { getEdgeCommitFn } from './edge-commit';
import { getPanelDividers, getPanelPolygonPoints } from './panels';
import { MARGIN } from './types';
import { polygonArea } from './chain-overlap';

describe.each(['slope-left', 'slope-right'] as const)('%s geometry', (type) => {
  const shape: ShapeConfig = { type, shortSideHeight: 400 };

  it('has a flat base and vertical sides of the specified heights', () => {
    const [tl, tr, br, bl] = getRealVertices(shape, 1200, 1000);
    expect([tl.x, bl.x]).toEqual([0, 0]);
    expect([tr.x, br.x]).toEqual([1200, 1200]);
    expect([bl.y, br.y]).toEqual([1000, 1000]);
    expect([bl.y - tl.y, br.y - tr.y]).toEqual(type === 'slope-left' ? [1000, 400] : [400, 1000]);
    expect(polygonArea([tl, tr, br, bl])).toBe(840000);
  });

  it('clips panels and dividers to the sloped top', () => {
    const vertices = scaleVertices(getRealVertices(shape, 1200, 1000), 1200, 1000, 600, 500);
    const [divider] = getPanelDividers(shape, 2, [600, 600], vertices, 600, 500, 1200, 1000);
    expect(divider).toEqual({ x: MARGIN + 300, topY: MARGIN + 150, bottomY: MARGIN + 500 });
    const panels = [0, 1].map((index) => getPanelPolygonPoints(
      shape, index, 2, [600, 600], vertices, 600, 500, 1200, 1000,
    ).split(' ').map((point) => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    }));
    const areas = panels.map((points) => Math.abs(polygonArea(points)));
    expect(areas).toEqual(type === 'slope-left' ? [127500, 82500] : [82500, 127500]);
  });

  it('edits each side independently and leaves the diagonal derived', () => {
    const onWidthChange = vi.fn();
    const onHeightChange = vi.fn();
    const onShapeConfigChange = vi.fn();
    const ctx = { shape, width: 1200, height: 1000, onWidthChange, onHeightChange, onShapeConfigChange };
    const [tl, tr, br, bl] = getRealVertices(shape, 1200, 1000);
    getEdgeCommitFn(ctx, br, bl)?.(1500);
    getEdgeCommitFn(ctx, tl, bl)?.(700);
    getEdgeCommitFn(ctx, tr, br)?.(800);
    expect(onWidthChange).toHaveBeenCalledWith(1500);
    expect(onHeightChange).toHaveBeenCalledWith(type === 'slope-left' ? 700 : 800);
    expect(onShapeConfigChange).toHaveBeenCalledWith({ shortSideHeight: type === 'slope-left' ? 800 : 700 });
    expect(getEdgeCommitFn(ctx, tl, tr)).toBeNull();
  });
});

describe('short-side height bounds', () => {
  it.each([
    [undefined, 400], [-50, 0], [1500, 1000], [NaN, 400], [Infinity, 400],
  ])('normalizes %s to %s', (shortSideHeight, expected) => {
    expect(getShortSideHeight({ type: 'slope-left', shortSideHeight }, 1000)).toBe(expected);
  });

  it('uses the new overall height when dimensions shrink', () => {
    expect(getShortSideHeight({ type: 'slope-right', shortSideHeight: 800 }, 500)).toBe(500);
  });
});
