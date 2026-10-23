import { describe, expect, it } from 'vitest';
import { rotateLShape } from './shapeTransforms';
import { getRealVertices } from './canvas/utils/shape-path';
import type { ShapeConfig } from './types';

describe('L-Shape clockwise rotation', () => {
  const initial = {
    shape: { type: 'l-shape', cutoutWidth: 350, cutoutHeight: 500, cutoutPosition: 'top-right' } as ShapeConfig,
    width: 1200, height: 900,
  };

  it('rotates every vertex through a real 90° turn, swapping dimensions', () => {
    const next = rotateLShape(initial.shape, initial.width, initial.height);
    const expected = getRealVertices(initial.shape, initial.width, initial.height)
      .map(({ x, y }) => ({ x: initial.height - y, y: x }));
    const actual = getRealVertices(next.shape, next.width, next.height);
    expect(next.width).toBe(900);
    expect(next.height).toBe(1200);
    expect(actual).toHaveLength(expected.length);
    expect(actual).toEqual(expect.arrayContaining(expected));
    expect(next.shape).toMatchObject({ cutoutPosition: 'bottom-right', cutoutWidth: 500, cutoutHeight: 350 });
    expect(initial.shape.cutoutPosition).toBe('top-right');
  });

  it('reaches both illustrated top-bar orientations and returns after four turns', () => {
    let current = initial;
    for (const corner of ['bottom-right', 'bottom-left', 'top-left', 'top-right']) {
      current = rotateLShape(current.shape, current.width, current.height);
      expect(current.shape.cutoutPosition).toBe(corner);
    }
    expect(current).toEqual(initial);
  });

  it('pins proportionate defaults before swapping unequal dimensions', () => {
    const next = rotateLShape({ type: 'l-shape' }, 1200, 800);
    expect(next.shape).toMatchObject({ cutoutWidth: 320, cutoutHeight: 480, cutoutPosition: 'bottom-right' });
  });
});
