import { describe, it, expect } from 'vitest';
import { polygonArea, convexClip, worstOverlapFraction } from './chain-overlap';

const square = (x: number, y: number, size: number) => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size },
];

describe('polygonArea', () => {
  it('measures a square', () => {
    expect(Math.abs(polygonArea(square(0, 0, 10)))).toBe(100);
  });

  it('flips sign with winding', () => {
    const cw = square(0, 0, 10);
    expect(polygonArea(cw)).toBe(-polygonArea(cw.slice().reverse()));
  });
});

describe('convexClip', () => {
  it('returns the whole polygon when clipped against itself', () => {
    const s = square(0, 0, 10);
    expect(Math.abs(polygonArea(convexClip(s, s)))).toBeCloseTo(100, 6);
  });

  it('returns the shared half of two squares offset by half their width', () => {
    const piece = convexClip(square(0, 0, 10), square(5, 0, 10));
    expect(Math.abs(polygonArea(piece))).toBeCloseTo(50, 6);
  });

  it('returns nothing usable for disjoint polygons', () => {
    expect(convexClip(square(0, 0, 10), square(50, 0, 10)).length).toBeLessThan(3);
  });
});

describe('worstOverlapFraction', () => {
  it('is zero when nothing touches', () => {
    expect(worstOverlapFraction([square(0, 0, 10), square(50, 0, 10)])).toBe(0);
  });

  it('is one when a polygon is completely covered', () => {
    expect(worstOverlapFraction([square(0, 0, 100), square(10, 10, 10)])).toBeCloseTo(1, 6);
  });

  it('measures against the smaller polygon, not the larger', () => {
    // The small square is half-swallowed: 50 of its 100 units are hidden,
    // which is 50% of it but only 0.5% of the big one.
    const fraction = worstOverlapFraction([square(0, 0, 100), square(95, 0, 10)]);
    expect(fraction).toBeCloseTo(0.5, 6);
  });

  it('reports the worst pair, not the average', () => {
    const polys = [square(0, 0, 10), square(50, 0, 10), square(52, 0, 10)];
    expect(worstOverlapFraction(polys)).toBeCloseTo(0.8, 6);
  });
});
