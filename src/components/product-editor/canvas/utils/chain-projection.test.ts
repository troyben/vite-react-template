import { describe, it, expect } from 'vitest';
import { walkChain, projectPlanPoint, layoutChain } from './chain-projection';

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

    // post starts at the end of segment 0 and runs along the 45 degree bisector
    const post = plan.posts[0];
    expect(close(post.startX, 1000)).toBe(true);
    expect(close(post.startY, 0)).toBe(true);
    expect(close(post.dirX, Math.SQRT1_2)).toBe(true);
    expect(close(post.dirY, Math.SQRT1_2)).toBe(true);

    // segment 1 starts past the post and heads straight away from the viewer
    const s1 = plan.segments[1];
    expect(close(s1.startX, 1000 + 100 * Math.SQRT1_2)).toBe(true);
    expect(close(s1.startY, 100 * Math.SQRT1_2)).toBe(true);
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
