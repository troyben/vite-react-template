# Canvas Connector — Corner Window Chains — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Connector tool that joins additional rectangular window units to the left or right edge of the drawing at a slider-set angle, forming corner windows.

**Architecture:** The chain is laid out in a 2D plan space (`φₖ₊₁ = φₖ + (180° − θₖ)`) and projected to the screen with a cabinet oblique projection. That projection leaves vertical lines vertical, so each segment reduces to a pure shear+scale SVG matrix — every existing panel/glass/divider/opening renderer runs unmodified inside the transform group. Only dimension labels need new code, because their text must be rotated rather than sheared.

**Tech Stack:** React 19, TypeScript 6 (strict), Vite 8, plain SVG (the product editor does **not** use Konva despite what the root CLAUDE.md says), Tailwind 4, Vitest (added in Task 1).

**Spec:** `docs/superpowers/specs/2026-08-06-canvas-connector-design.md`
**Tracker:** bd epic `Projects-m4ar`

## Global Constraints

- **Zero regression rule:** when `connectors.length === 0`, `ShapeCanvas` must take the existing code path unchanged, and `buildProductData` must emit JSON with no `segments`, `connectors`, or `rootSegmentIndex` keys. Existing templates and quotations must render and serialise exactly as they do today.
- **No backend changes.** Templates store `sketchData` and quotations store `items` as JSON strings.
- **No new runtime dependencies.** Vitest is a devDependency only.
- Attached segments are **rectangles only**. The root segment keeps every existing shape type.
- Angle is an **integer**, range **1–359**, default **90**. Post width default **100** mm.
- Projection constants: `DEPTH_FACTOR = 0.5`, `DEPTH_ANGLE = Math.PI / 4`, `BASE_DRAW_HEIGHT = 180`.
- Shared across the chain (stay top-level on `ProductData`): `height`, `unit`, `type`, `doorType`, `windowType`, `frameColor`, `glassType`, `customGlassTint`, `shape`, `render3D`.
- TypeScript strict. `npm run build` (which runs `tsc -b`) must pass at the end of every task.
- **Commit messages must NOT contain a `Co-Authored-By: Claude` trailer** or any Claude attribution. This is a standing rule for this user across all projects.
- Work on branch `feat/canvas-connector` off `master` in `vite-react-template/`.

## Testing Approach — read this before Task 1

The repo has **no test framework and no existing tests**. Task 1 adds Vitest and configures it for **pure-function unit tests in a node environment only**. There is no jsdom, no React Testing Library, and no component test setup — adding those is out of scope.

That splits the tasks into two kinds, and each task states which kind it is:

- **Unit-tested tasks** (1, 2, 3, 11) cover the geometry, normalisation, cascade and cost maths. These follow strict TDD: write the failing test, watch it fail, implement, watch it pass, commit.
- **Manually verified tasks** (4–10, 12) are React/SVG rendering and interaction. These are verified by `npm run build` plus an explicit, scripted browser check with stated expected results. Every one of these tasks lists the exact clicks and the exact expected outcome. Do not claim one passes without actually running the browser steps.

Dev server: `npm run dev`, then open `http://localhost:3000/templates/create`.

---

## File Structure

**New files**

| File | Responsibility |
|---|---|
| `src/components/product-editor/canvas/utils/chain-projection.ts` | Pure geometry: plan walk, oblique projection, per-segment SVG matrices, chain bounding box. No React. |
| `src/components/product-editor/canvas/utils/chain-model.ts` | Pure data: `Chain` type, `normalizeToChain`, `chainToProductData`, `connectorRemovalRange`, `applyConnectorRemoval`. No React. |
| `src/components/product-editor/useSegmentChain.ts` | React state hook wrapping `chain-model.ts`: add/remove connectors, edit angle and post width, selection. |
| `src/components/product-editor/canvas/layers/SegmentLayers.tsx` | Renders one segment's geometry inside its transform group. |
| `src/components/product-editor/canvas/layers/ChainDimensionLayer.tsx` | Screen-space per-leg width dims, shared height dim, angle badges. |
| `src/components/product-editor/canvas/ConnectorSlider.tsx` | `foreignObject` vertical angle slider. |
| `vitest.config.ts` | Vitest config with the `@` alias. |

**Modified files**

| File | Change |
|---|---|
| `src/components/product-editor/types.ts` | `Segment`, `Connector` interfaces; three optional `ProductData` fields. |
| `src/components/product-editor/canvas/utils/canvas-tools.ts` | `CanvasTool` gains `'connector'`. |
| `src/components/product-editor/canvas/utils/remove-tools.ts` | `RemovableItem` gains `connector`; chain-aware hit test and cascade highlight. |
| `src/components/product-editor/canvas/ShapeCanvas.tsx` | Branch to the chain render path when connectors exist. |
| `src/components/product-editor/canvas/ShapeSelector.tsx` | Connector entry under a Tools divider. |
| `src/components/product-editor/ProductEditor.tsx` | Wire the chain hook, selection, and the connector panel section. |
| `src/components/product-editor/useProductEditorState.ts` | Delegate to `useSegmentChain`; route reads/writes to the active segment. |
| `src/components/product-editor/productEditorHandlers.ts` | Handlers target the active segment. |
| `src/utils/costCalculator.ts` | Sum per segment, add corner posts. |
| `src/utils/productDescription.ts` | Corner-window description. |
| `src/utils/templateSketchProps.ts` | Forward the new fields to `ShapeCanvas`. |

---

## Task 1: Chain projection geometry

**Kind:** unit-tested (TDD).

**Files:**
- Create: `vitest.config.ts`
- Create: `src/components/product-editor/canvas/utils/chain-projection.ts`
- Create: `src/components/product-editor/canvas/utils/chain-projection.test.ts`
- Modify: `package.json` (devDependency + `test` script)

**Interfaces:**
- Consumes: `Point` from `./types`.
- Produces:
  - `type Matrix6 = [number, number, number, number, number, number]`
  - `interface PlanSegment { index: number; startX: number; startY: number; dirX: number; dirY: number; headingRad: number; widthMm: number }`
  - `interface PlanPost { index: number; startX: number; startY: number; dirX: number; dirY: number; widthMm: number }`
  - `interface ChainPlan { segments: PlanSegment[]; posts: PlanPost[] }`
  - `interface ChainLayout { segments: Array<{ index: number; matrix: Matrix6; corners: [Point, Point, Point, Point]; drawW: number }>; posts: Array<{ index: number; corners: [Point, Point, Point, Point] }>; scale: number; drawH: number; totalW: number; totalH: number }`
  - `function walkChain(widthsMm: number[], connectors: Array<{ angle: number; postWidth: number }>): ChainPlan`
  - `function projectPlanPoint(x: number, y: number): Point`
  - `function layoutChain(widthsMm: number[], heightMm: number, connectors: Array<{ angle: number; postWidth: number }>): ChainLayout`

**Notes on the maths, for the implementer**

Plan space is a top-down view. `x` runs to the viewer's right, `y` runs away from the viewer. Segment 0 has heading 0 (facing the viewer, running along +x). Interior angle `θ` at a connector turns the next segment by `180° − θ`, so `θ = 180` is straight and `θ = 90` is a right-angle corner. The corner post sits at the joint, advancing along the bisector of the two headings.

Cabinet oblique projection, with depth receding up and to the right:

```
sx = x + D·y·cos(A)
sy =    −D·y·sin(A)          D = 0.5, A = 45°
```

Vertical (`v`, the window height) is untouched by the projection, so a segment's local `(u, v)` maps affinely to the screen. Deriving the matrix — with `start` the segment's plan start point and `dir` its unit heading:

```
sx = (start.x + D·start.y·cosA) + u·(dir.x + D·dir.y·cosA)
sy = (       − D·start.y·sinA) + u·(     − D·dir.y·sinA) + v·1
```

The existing per-panel renderers draw in **draw space** with a `MARGIN` offset, not in raw mm. So the group matrix is expressed in terms of local draw coordinates `lx = MARGIN + s·u`, `ly = MARGIN + s·v`, where `s` is draw units per mm:

```
matrix(a, b, 0, 1, s·e + ox − a·MARGIN, s·f + oy − MARGIN)
```

with `a = dir.x + D·dir.y·cosA`, `b = −D·dir.y·sinA`, `e = start.x + D·start.y·cosA`, `f = −D·start.y·sinA`. `ox`/`oy` shift the whole chain so its bounding box starts at `MARGIN`.

A **uniform** scale is required in both axes or the oblique projection skews wrongly, so `s = BASE_DRAW_HEIGHT / heightMm` and each segment's local `drawW = s · widthMm`.

- [ ] **Step 1: Install Vitest and add the test script**

```bash
npm install --save-dev vitest@latest
```

Then add to the `scripts` block of `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Create the Vitest config**

The Vite config's `'@': '/src'` alias is a server-root path and does not resolve under Node, so the test config needs its own.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Write the failing test**

```ts
// src/components/product-editor/canvas/utils/chain-projection.test.ts
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
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `npm test -- chain-projection`
Expected: FAIL — `Failed to resolve import "./chain-projection"`.

- [ ] **Step 5: Implement the module**

```ts
// src/components/product-editor/canvas/utils/chain-projection.ts
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
    y: -DEPTH_FACTOR * y * Math.sin(DEPTH_ANGLE),
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
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `npm test -- chain-projection`
Expected: PASS, 10 tests.

- [ ] **Step 7: Confirm the build still compiles**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts \
  src/components/product-editor/canvas/utils/chain-projection.ts \
  src/components/product-editor/canvas/utils/chain-projection.test.ts
git commit -m "feat(canvas): chain plan walk and oblique projection geometry"
```

---

## Task 2: Chain data model and back-compat normalisation

**Kind:** unit-tested (TDD).

**Files:**
- Modify: `src/components/product-editor/types.ts`
- Create: `src/components/product-editor/canvas/utils/chain-model.ts`
- Create: `src/components/product-editor/canvas/utils/chain-model.test.ts`

**Interfaces:**
- Consumes: `ProductData`, `OpeningDirection` from `@/components/product-editor/types`; `SectionId` from `./section-outline`.
- Produces:
  - `interface Segment` and `interface Connector` exported from `types.ts`
  - `interface Chain { segments: Segment[]; connectors: Connector[]; rootIndex: number }`
  - `function normalizeToChain(d: ProductData): Chain`
  - `function chainToProductData(chain: Chain): Pick<ProductData, 'width' | 'panels' | 'panelWidths' | 'panelDivisions' | 'panelDivisionHeights' | 'panelDivisionWidths' | 'openingPanels' | 'openingDirections' | 'openingPanes' | 'removedSections' | 'segments' | 'connectors' | 'rootSegmentIndex'>`
  - `function makeSegment(width: number): Segment`
  - `const DEFAULT_CONNECTOR_ANGLE = 90`, `const DEFAULT_POST_WIDTH = 100`

- [ ] **Step 1: Add the types**

Append to `src/components/product-editor/types.ts`. It already imports nothing, so add the `SectionId` import at the top:

```ts
import type { SectionId } from '@/components/product-editor/canvas/utils/section-outline';
```

Then append:

```ts
/**
 * One leg of a corner-window chain. Segment 0 mirrors the legacy top-level
 * ProductData fields so old payloads keep working; attached segments are
 * always rectangles.
 */
export interface Segment {
  id: string;
  width: number;
  panels: number;
  panelWidths: number[];
  panelDivisions?: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  openingPanels?: number[];
  openingDirections?: Record<number, OpeningDirection>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
    openingType?: 'hinged' | 'sliding';
  }>;
  removedSections?: SectionId[];
}

/** Joins segments[i] to segments[i+1]. */
export interface Connector {
  id: string;
  /** Interior angle in degrees. Integer, 1-359. 180 is straight. */
  angle: number;
  /** Aluminium corner post width in mm. */
  postWidth: number;
}
```

And add these three optional fields inside the existing `ProductData` interface, next to `render3D`:

```ts
  segments?: Segment[];
  connectors?: Connector[];
  rootSegmentIndex?: number;
```

- [ ] **Step 2: Write the failing test**

```ts
// src/components/product-editor/canvas/utils/chain-model.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeToChain, chainToProductData, makeSegment } from './chain-model';
import type { ProductData } from '@/components/product-editor/types';

const legacy: ProductData = {
  type: 'window',
  windowType: 'hinged',
  width: 1000,
  height: 1200,
  panels: 2,
  panelWidths: [600, 400],
  openingPanels: [1],
  openingDirections: { 1: 'left' },
  unit: 'mm',
  shape: { type: 'rectangle' },
};

describe('normalizeToChain', () => {
  it('turns a legacy single-unit payload into a one-segment chain', () => {
    const chain = normalizeToChain(legacy);
    expect(chain.segments).toHaveLength(1);
    expect(chain.connectors).toHaveLength(0);
    expect(chain.rootIndex).toBe(0);
    expect(chain.segments[0].width).toBe(1000);
    expect(chain.segments[0].panels).toBe(2);
    expect(chain.segments[0].panelWidths).toEqual([600, 400]);
    expect(chain.segments[0].openingPanels).toEqual([1]);
  });

  it('reads attached segments and connectors when present', () => {
    const chain = normalizeToChain({
      ...legacy,
      segments: [
        { id: 's0', width: 1000, panels: 2, panelWidths: [600, 400] },
        { id: 's1', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c0', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    });
    expect(chain.segments).toHaveLength(2);
    expect(chain.connectors).toHaveLength(1);
    expect(chain.segments[1].width).toBe(800);
  });

  it('does not share array references with the input', () => {
    const chain = normalizeToChain(legacy);
    chain.segments[0].panelWidths[0] = 1;
    expect(legacy.panelWidths).toEqual([600, 400]);
  });
});

describe('chainToProductData', () => {
  it('omits the chain fields entirely for a single segment', () => {
    const chain = normalizeToChain(legacy);
    const out = chainToProductData(chain);
    expect(out.width).toBe(1000);
    expect(out.panels).toBe(2);
    expect(out.panelWidths).toEqual([600, 400]);
    expect('segments' in out).toBe(false);
    expect('connectors' in out).toBe(false);
    expect('rootSegmentIndex' in out).toBe(false);
  });

  it('round-trips a legacy payload unchanged', () => {
    const out = chainToProductData(normalizeToChain(legacy));
    expect(out.width).toBe(legacy.width);
    expect(out.panels).toBe(legacy.panels);
    expect(out.panelWidths).toEqual(legacy.panelWidths);
    expect(out.openingPanels).toEqual(legacy.openingPanels);
    expect(out.openingDirections).toEqual(legacy.openingDirections);
  });

  it('emits the chain fields once a connector exists, with segment 0 also flattened', () => {
    const chain = normalizeToChain(legacy);
    chain.segments.push(makeSegment(800));
    chain.connectors.push({ id: 'c0', angle: 90, postWidth: 100 });
    const out = chainToProductData(chain);
    expect(out.width).toBe(1000);          // top-level still describes segment 0
    expect(out.segments).toHaveLength(2);
    expect(out.connectors).toHaveLength(1);
    expect(out.rootSegmentIndex).toBe(0);
  });
});

describe('makeSegment', () => {
  it('creates a single full-width panel with no openings', () => {
    const s = makeSegment(750);
    expect(s.width).toBe(750);
    expect(s.panels).toBe(1);
    expect(s.panelWidths).toEqual([750]);
    expect(s.openingPanels).toEqual([]);
    expect(s.id).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the test and confirm it fails**

Run: `npm test -- chain-model`
Expected: FAIL — `Failed to resolve import "./chain-model"`.

- [ ] **Step 4: Implement the module**

```ts
// src/components/product-editor/canvas/utils/chain-model.ts
// ---------------------------------------------------------------------------
// Pure data model for corner-window chains.
//
// Segment 0 is the legacy single-unit product: it round-trips through the
// top-level ProductData fields so existing saved templates and quotations are
// untouched. The chain fields are only emitted once a connector exists.
// ---------------------------------------------------------------------------

import type { Connector, ProductData, Segment } from '@/components/product-editor/types';
import { generateId } from './canvas-tools';

export const DEFAULT_CONNECTOR_ANGLE = 90;
export const DEFAULT_POST_WIDTH = 100;

export interface Chain {
  segments: Segment[];
  connectors: Connector[];
  /** Index of the segment the user created first. Anchors delete cascades. */
  rootIndex: number;
}

function cloneSegment(s: Segment): Segment {
  return {
    id: s.id,
    width: s.width,
    panels: s.panels,
    panelWidths: s.panelWidths.slice(),
    panelDivisions: s.panelDivisions?.map((d) => ({ ...d })),
    panelDivisionHeights: s.panelDivisionHeights?.map((h) => ({
      panelIndex: h.panelIndex,
      rowHeights: h.rowHeights.slice(),
    })),
    panelDivisionWidths: s.panelDivisionWidths?.map((w) => ({
      panelIndex: w.panelIndex,
      colWidths: w.colWidths.slice(),
    })),
    openingPanels: s.openingPanels?.slice(),
    openingDirections: s.openingDirections ? { ...s.openingDirections } : undefined,
    openingPanes: s.openingPanes?.map((p) => ({ ...p })),
    removedSections: s.removedSections?.map((r) => ({ ...r })),
  };
}

/** A fresh attached leg: one full-width rectangular panel, nothing else. */
export function makeSegment(width: number): Segment {
  return {
    id: generateId(),
    width,
    panels: 1,
    panelWidths: [width],
    panelDivisions: [{ panelIndex: 0, horizontalCount: 1, verticalCount: 1 }],
    openingPanels: [],
    openingDirections: {},
    openingPanes: [],
    removedSections: [],
  };
}

/** Build segment 0 out of the legacy top-level ProductData fields. */
function rootSegmentFromLegacy(d: ProductData): Segment {
  const width = d.width || 1000;
  return {
    id: d.segments?.[0]?.id ?? generateId(),
    width,
    panels: d.panels || 1,
    panelWidths: (d.panelWidths || [width]).slice(),
    panelDivisions: d.panelDivisions?.map((x) => ({ ...x })),
    panelDivisionHeights: d.panelDivisionHeights?.map((h) => ({
      panelIndex: h.panelIndex,
      rowHeights: h.rowHeights.slice(),
    })),
    panelDivisionWidths: d.panelDivisionWidths?.map((w) => ({
      panelIndex: w.panelIndex,
      colWidths: w.colWidths.slice(),
    })),
    openingPanels: (d.openingPanels || []).slice(),
    openingDirections: { ...(d.openingDirections || {}) },
    openingPanes: (d.openingPanes || []).map((p) => ({ ...p })),
    removedSections: (d.removedSections || []).map((r) => ({ ...r })),
  };
}

export function normalizeToChain(d: ProductData): Chain {
  const root = rootSegmentFromLegacy(d);
  const attached = (d.segments ?? []).slice(1).map(cloneSegment);
  return {
    segments: [root, ...attached],
    connectors: (d.connectors ?? []).map((c) => ({ ...c })),
    rootIndex: d.rootSegmentIndex ?? 0,
  };
}

/**
 * Flatten a chain back to ProductData fields. Segment 0 always writes to the
 * legacy top-level fields; the chain fields are omitted entirely when there is
 * only one segment, so single-unit products serialise exactly as before.
 */
export function chainToProductData(chain: Chain) {
  const root = chain.segments[0];
  const base = {
    width: root.width,
    panels: root.panels,
    panelWidths: root.panelWidths.slice(),
    panelDivisions: root.panelDivisions,
    panelDivisionHeights: root.panelDivisionHeights?.length ? root.panelDivisionHeights : undefined,
    panelDivisionWidths: root.panelDivisionWidths?.length ? root.panelDivisionWidths : undefined,
    openingPanels: root.openingPanels ?? [],
    openingDirections: root.openingDirections ?? {},
    openingPanes: root.openingPanes ?? [],
    removedSections: root.removedSections?.length ? root.removedSections : undefined,
  };

  if (chain.connectors.length === 0) return base;

  return {
    ...base,
    segments: chain.segments.map(cloneSegment),
    connectors: chain.connectors.map((c) => ({ ...c })),
    rootSegmentIndex: chain.rootIndex,
  };
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npm test -- chain-model`
Expected: PASS, 8 tests.

- [ ] **Step 6: Confirm the build compiles**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/product-editor/types.ts \
  src/components/product-editor/canvas/utils/chain-model.ts \
  src/components/product-editor/canvas/utils/chain-model.test.ts
git commit -m "feat(canvas): segment/connector data model with legacy round-trip"
```

---

## Task 3: Connector delete cascade maths

**Kind:** unit-tested (TDD).

**Files:**
- Modify: `src/components/product-editor/canvas/utils/chain-model.ts`
- Modify: `src/components/product-editor/canvas/utils/chain-model.test.ts`

**Interfaces:**
- Consumes: `Chain` from Task 2.
- Produces:
  - `interface RemovalRange { segmentIndices: number[]; connectorIndices: number[]; newRootIndex: number }`
  - `function connectorRemovalRange(chain: Chain, connectorIndex: number): RemovalRange`
  - `function applyConnectorRemoval(chain: Chain, connectorIndex: number): Chain`

**Why the root index matters:** connectors can be added on either end, so "everything after this connector" means everything on the side of the joint that does **not** contain the segment the user started from. `rootIndex` records which segment that is.

- [ ] **Step 1: Write the failing test**

Append to `chain-model.test.ts`:

```ts
import { connectorRemovalRange, applyConnectorRemoval } from './chain-model';
import type { Chain } from './chain-model';

function chainOf(segmentCount: number, rootIndex: number): Chain {
  return {
    segments: Array.from({ length: segmentCount }, (_, i) => makeSegment(1000 + i)),
    connectors: Array.from({ length: segmentCount - 1 }, (_, i) => ({
      id: `c${i}`, angle: 90, postWidth: 100,
    })),
    rootIndex,
  };
}

describe('connectorRemovalRange', () => {
  it('removes everything to the right when the root is leftmost', () => {
    const r = connectorRemovalRange(chainOf(4, 0), 1);
    expect(r.segmentIndices).toEqual([2, 3]);
    expect(r.connectorIndices).toEqual([1, 2]);
    expect(r.newRootIndex).toBe(0);
  });

  it('removes only the last leg for the last connector', () => {
    const r = connectorRemovalRange(chainOf(4, 0), 2);
    expect(r.segmentIndices).toEqual([3]);
    expect(r.connectorIndices).toEqual([2]);
  });

  it('removes everything to the left when the connector is left of the root', () => {
    const r = connectorRemovalRange(chainOf(4, 2), 1);
    expect(r.segmentIndices).toEqual([0, 1]);
    expect(r.connectorIndices).toEqual([0, 1]);
    expect(r.newRootIndex).toBe(0);
  });

  it('shifts the root by exactly the number of segments dropped on the left', () => {
    const r = connectorRemovalRange(chainOf(4, 2), 0);
    expect(r.segmentIndices).toEqual([0]);
    expect(r.connectorIndices).toEqual([0]);
    expect(r.newRootIndex).toBe(1);
  });

  it('treats a connector at the root index as a rightward removal', () => {
    const r = connectorRemovalRange(chainOf(4, 2), 2);
    expect(r.segmentIndices).toEqual([3]);
    expect(r.newRootIndex).toBe(2);
  });
});

describe('applyConnectorRemoval', () => {
  it('splices out the doomed segments and connectors', () => {
    const before = chainOf(4, 0);
    const keptId = before.segments[1].id;
    const after = applyConnectorRemoval(before, 1);
    expect(after.segments).toHaveLength(2);
    expect(after.connectors).toHaveLength(1);
    expect(after.segments[1].id).toBe(keptId);
    expect(after.rootIndex).toBe(0);
  });

  it('keeps the root segment when removing from the left', () => {
    const before = chainOf(4, 2);
    const rootId = before.segments[2].id;
    const after = applyConnectorRemoval(before, 1);
    expect(after.segments).toHaveLength(2);
    expect(after.segments[after.rootIndex].id).toBe(rootId);
    expect(after.rootIndex).toBe(0);
  });

  it('does not mutate the input chain', () => {
    const before = chainOf(3, 0);
    applyConnectorRemoval(before, 0);
    expect(before.segments).toHaveLength(3);
    expect(before.connectors).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- chain-model`
Expected: FAIL — `connectorRemovalRange is not a function`.

- [ ] **Step 3: Implement**

Append to `chain-model.ts`:

```ts
export interface RemovalRange {
  segmentIndices: number[];
  connectorIndices: number[];
  newRootIndex: number;
}

/**
 * Which segments and connectors die when connector `connectorIndex` is deleted.
 *
 * connectors[i] joins segments[i] to segments[i+1]. Everything on the far side
 * of the joint from the root segment goes.
 */
export function connectorRemovalRange(chain: Chain, connectorIndex: number): RemovalRange {
  const segCount = chain.segments.length;
  const connCount = chain.connectors.length;

  if (connectorIndex >= chain.rootIndex) {
    const segmentIndices: number[] = [];
    for (let i = connectorIndex + 1; i < segCount; i++) segmentIndices.push(i);
    const connectorIndices: number[] = [];
    for (let i = connectorIndex; i < connCount; i++) connectorIndices.push(i);
    return { segmentIndices, connectorIndices, newRootIndex: chain.rootIndex };
  }

  const segmentIndices: number[] = [];
  for (let i = 0; i <= connectorIndex; i++) segmentIndices.push(i);
  const connectorIndices: number[] = [];
  for (let i = 0; i <= connectorIndex; i++) connectorIndices.push(i);
  return {
    segmentIndices,
    connectorIndices,
    newRootIndex: chain.rootIndex - segmentIndices.length,
  };
}

/** Delete a connector and everything attached beyond it. Returns a new chain. */
export function applyConnectorRemoval(chain: Chain, connectorIndex: number): Chain {
  const { segmentIndices, connectorIndices, newRootIndex } = connectorRemovalRange(chain, connectorIndex);
  const deadSegments = new Set(segmentIndices);
  const deadConnectors = new Set(connectorIndices);
  return {
    segments: chain.segments.filter((_, i) => !deadSegments.has(i)).map(cloneSegment),
    connectors: chain.connectors.filter((_, i) => !deadConnectors.has(i)).map((c) => ({ ...c })),
    rootIndex: newRootIndex,
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- chain-model`
Expected: PASS, 16 tests total in the file.

- [ ] **Step 5: Commit**

```bash
git add src/components/product-editor/canvas/utils/chain-model.ts \
  src/components/product-editor/canvas/utils/chain-model.test.ts
git commit -m "feat(canvas): connector delete cascade range calculation"
```

---

## Task 4: useSegmentChain hook

**Kind:** manually verified (no component test harness exists).

**Files:**
- Create: `src/components/product-editor/useSegmentChain.ts`

**Interfaces:**
- Consumes: `Chain`, `normalizeToChain`, `chainToProductData`, `makeSegment`, `applyConnectorRemoval`, `DEFAULT_CONNECTOR_ANGLE`, `DEFAULT_POST_WIDTH` from `./canvas/utils/chain-model`.
- Produces `useSegmentChain()` returning:
  - `chain: Chain`
  - `activeSegmentIndex: number`
  - `activeConnectorIndex: number | null`
  - `setActiveSegmentIndex(i: number): void`
  - `setActiveConnectorIndex(i: number | null): void`
  - `activeSegment: Segment`
  - `updateSegment(index: number, updates: Partial<Segment>): void`
  - `updateActiveSegment(updates: Partial<Segment>): void`
  - `attachSegment(end: 'left' | 'right', width: number): void`
  - `setConnectorAngle(index: number, angle: number): void`
  - `setConnectorPostWidth(index: number, postWidth: number): void`
  - `removeConnector(index: number): void`
  - `loadChain(chain: Chain): void`
  - `resetChain(width: number): void`
  - `toProductData(): ReturnType<typeof chainToProductData>`

**Behaviour notes:** `attachSegment('right')` pushes a segment and pushes a connector. `attachSegment('left')` unshifts a segment, unshifts a connector, and increments `rootIndex`; the new segment becomes active. `setConnectorAngle` clamps to 1–359 and rounds to an integer.

- [ ] **Step 1: Create the hook**

```ts
// src/components/product-editor/useSegmentChain.ts
import { useCallback, useState } from 'react';
import type { Segment } from '@/components/product-editor/types';
import {
  applyConnectorRemoval,
  chainToProductData,
  makeSegment,
  normalizeToChain,
  DEFAULT_CONNECTOR_ANGLE,
  DEFAULT_POST_WIDTH,
} from '@/components/product-editor/canvas/utils/chain-model';
import type { Chain } from '@/components/product-editor/canvas/utils/chain-model';

const MIN_ANGLE = 1;
const MAX_ANGLE = 359;

export function clampAngle(angle: number): number {
  if (!Number.isFinite(angle)) return DEFAULT_CONNECTOR_ANGLE;
  return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, Math.round(angle)));
}

function singleSegmentChain(width: number): Chain {
  return { segments: [makeSegment(width)], connectors: [], rootIndex: 0 };
}

export function useSegmentChain(initialWidth = 1000) {
  const [chain, setChain] = useState<Chain>(() => singleSegmentChain(initialWidth));
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeConnectorIndex, setActiveConnectorIndex] = useState<number | null>(null);

  const updateSegment = useCallback((index: number, updates: Partial<Segment>) => {
    setChain((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  }, []);

  const updateActiveSegment = useCallback((updates: Partial<Segment>) => {
    setChain((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) => (i === activeSegmentIndex ? { ...s, ...updates } : s)),
    }));
  }, [activeSegmentIndex]);

  const attachSegment = useCallback((end: 'left' | 'right', width: number) => {
    const segment = makeSegment(width);
    const connector = {
      id: `conn-${segment.id}`,
      angle: DEFAULT_CONNECTOR_ANGLE,
      postWidth: DEFAULT_POST_WIDTH,
    };
    setChain((prev) => {
      if (end === 'right') {
        return {
          segments: [...prev.segments, segment],
          connectors: [...prev.connectors, connector],
          rootIndex: prev.rootIndex,
        };
      }
      return {
        segments: [segment, ...prev.segments],
        connectors: [connector, ...prev.connectors],
        rootIndex: prev.rootIndex + 1,
      };
    });
    setActiveSegmentIndex((prevActive) => (end === 'right' ? chain.segments.length : 0));
    setActiveConnectorIndex(end === 'right' ? chain.connectors.length : 0);
  }, [chain.segments.length, chain.connectors.length]);

  const setConnectorAngle = useCallback((index: number, angle: number) => {
    setChain((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c, i) => (i === index ? { ...c, angle: clampAngle(angle) } : c)),
    }));
  }, []);

  const setConnectorPostWidth = useCallback((index: number, postWidth: number) => {
    const safe = Number.isFinite(postWidth) && postWidth >= 0 ? postWidth : DEFAULT_POST_WIDTH;
    setChain((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c, i) => (i === index ? { ...c, postWidth: safe } : c)),
    }));
  }, []);

  const removeConnector = useCallback((index: number) => {
    setChain((prev) => {
      const next = applyConnectorRemoval(prev, index);
      setActiveSegmentIndex(Math.min(next.rootIndex, next.segments.length - 1));
      setActiveConnectorIndex(null);
      return next;
    });
  }, []);

  const loadChain = useCallback((next: Chain) => {
    setChain(next);
    setActiveSegmentIndex(Math.min(next.rootIndex, next.segments.length - 1));
    setActiveConnectorIndex(null);
  }, []);

  const resetChain = useCallback((width: number) => {
    setChain(singleSegmentChain(width));
    setActiveSegmentIndex(0);
    setActiveConnectorIndex(null);
  }, []);

  const toProductData = useCallback(() => chainToProductData(chain), [chain]);

  const activeSegment = chain.segments[activeSegmentIndex] ?? chain.segments[0];

  return {
    chain,
    activeSegment,
    activeSegmentIndex,
    activeConnectorIndex,
    setActiveSegmentIndex,
    setActiveConnectorIndex,
    updateSegment,
    updateActiveSegment,
    attachSegment,
    setConnectorAngle,
    setConnectorPostWidth,
    removeConnector,
    loadChain,
    resetChain,
    toProductData,
  };
}

export { normalizeToChain };
export type { Chain };
export type SegmentChainState = ReturnType<typeof useSegmentChain>;
```

- [ ] **Step 2: Confirm the build compiles**

Run: `npm run build`
Expected: exit 0. The hook is not consumed yet, so nothing else changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/product-editor/useSegmentChain.ts
git commit -m "feat(canvas): useSegmentChain state hook"
```

---

## Task 5: Render the chain geometry

**Kind:** manually verified. **This is the first visible milestone.**

**Files:**
- Create: `src/components/product-editor/canvas/layers/SegmentLayers.tsx`
- Modify: `src/components/product-editor/canvas/ShapeCanvas.tsx`

**Interfaces:**
- Consumes: `layoutChain`, `ChainLayout` (Task 1); `Chain` (Task 2); existing `getRealVertices`, `scaleVertices`, `getShapePath` from `../utils/shape-path`; `getPanelDividers`, `getPanelPolygonPoints`, `getPanelCenter` from `../utils/panels`; `renderPaneGlass`, `renderSubdivisionLines`, `renderPaneOpenings`, `PaneLayersProps` from `./PaneLayers`; `getOpeningIndicator` from `../utils/opening-indicators`.
- Produces: `renderSegment(props: SegmentRenderProps): React.ReactNode` and `interface SegmentRenderProps`.

**Key idea:** a segment renders as if it were a standalone flat product with its own local draw space (`drawW = layout.segments[i].drawW`, `drawH = layout.drawH`, same `MARGIN`), wrapped in `<g transform="matrix(...)">`. Every existing renderer therefore works unchanged. Attached segments are always `{ type: 'rectangle' }`; only the root segment uses the product's real `shape`.

- [ ] **Step 1: Create the segment renderer**

```tsx
// src/components/product-editor/canvas/layers/SegmentLayers.tsx
import React from 'react';
import type { ShapeConfig, Segment } from '@/components/product-editor/types';
import type { Matrix6 } from '../utils/chain-projection';
import { DIVIDER_STROKE, FRAME_STROKE } from '../utils/types';
import { getRealVertices, scaleVertices, getShapePath } from '../utils/shape-path';
import { getPanelDividers, getPanelPolygonPoints, getPanelCenter } from '../utils/panels';
import { getOpeningIndicator } from '../utils/opening-indicators';
import { renderPaneGlass, renderSubdivisionLines, renderPaneOpenings } from './PaneLayers';
import type { PaneLayersProps } from './PaneLayers';

export interface SegmentRenderProps {
  segment: Segment;
  segmentIndex: number;
  matrix: Matrix6;
  /** Local draw-space width for this segment. */
  drawW: number;
  drawH: number;
  heightMm: number;
  shape: ShapeConfig;
  frameColor: string;
  frameStroke: number;
  dividerStroke: number;
  glassFill: string;
  glassFilter?: string;
  glassHighlight?: string;
  isSliding: boolean;
  render3D: boolean;
  printMode: boolean;
  /** Unique per segment, for the clipPath id. */
  uid: string;
  /** Selection outline, drawn when this segment is the active one. */
  selected: boolean;
}

export function renderSegment(props: SegmentRenderProps): React.ReactNode {
  const {
    segment, segmentIndex, matrix, drawW, drawH, heightMm, shape,
    frameColor, frameStroke, dividerStroke, glassFill, glassFilter, glassHighlight,
    isSliding, render3D, printMode, uid, selected,
  } = props;

  const widthMm = segment.width;
  const panels = segment.panels;
  const panelWidths = segment.panelWidths;
  const openingPanels = segment.openingPanels ?? [];
  const openingDirections = segment.openingDirections ?? {};

  const realVerts = getRealVertices(shape, widthMm, heightMm);
  const svgVerts = scaleVertices(realVerts, widthMm, heightMm, drawW, drawH);
  const path = getShapePath(shape, svgVerts, drawW, drawH, widthMm, heightMm);
  const dividers = getPanelDividers(shape, panels, panelWidths, svgVerts, drawW, drawH, widthMm, heightMm);
  const clipId = `seg-clip-${uid}-${segmentIndex}`;

  const paneProps: PaneLayersProps = {
    shape, panels, panelWidths, svgVerts, drawW, drawH,
    width: widthMm, height: heightMm,
    frameColor,
    panelDivisions: segment.panelDivisions,
    panelDivisionHeights: segment.panelDivisionHeights,
    panelDivisionWidths: segment.panelDivisionWidths,
    openingPanes: segment.openingPanes,
    removedSections: segment.removedSections,
    render3D, glassFill, printMode,
  };

  return (
    <g key={`segment-${segmentIndex}`} transform={`matrix(${matrix.join(' ')})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>

      {/* Glass */}
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: panels }).map((_, i) => {
          const pts = getPanelPolygonPoints(shape, i, panels, panelWidths, svgVerts, drawW, drawH, widthMm, heightMm);
          if (!pts) return null;
          if (openingPanels.includes(i) && render3D) return null;
          return (
            <React.Fragment key={`glass-${i}`}>
              <polygon points={pts} fill={glassFill} filter={glassFilter} stroke="none" />
              {glassHighlight && <polygon points={pts} fill={glassHighlight} stroke="none" />}
            </React.Fragment>
          );
        })}
        {renderPaneGlass(paneProps)}
      </g>

      {/* Panel dividers */}
      {dividers.map((d, i) => (
        <line key={`div-${i}`} x1={d.x} y1={d.topY} x2={d.x} y2={d.bottomY}
          stroke={frameColor} strokeWidth={dividerStroke} />
      ))}
      {renderSubdivisionLines(paneProps)}

      {/* Frame */}
      <path d={path} fill="none" stroke={frameColor} strokeWidth={frameStroke} strokeLinejoin="miter" />

      {/* Openings */}
      <g clipPath={`url(#${clipId})`}>
        {openingPanels.map((panelIdx) => {
          const dir = openingDirections[panelIdx];
          if (!dir) return null;
          const { cx, cy, w: pw, h: ph } = getPanelCenter(
            shape, panelIdx, panels, panelWidths, svgVerts, drawW, drawH, widthMm, heightMm,
          );
          return getOpeningIndicator(dir, isSliding, cx, cy, pw, ph, `seg-${segmentIndex}-opening-${panelIdx}`, printMode);
        })}
        {renderPaneOpenings(paneProps)}
      </g>

      {/* Selection outline */}
      {selected && (
        <path d={path} fill="none" stroke="#7c3aed" strokeWidth={2} strokeDasharray="6 4" opacity={0.9} />
      )}
    </g>
  );
}

export const SEGMENT_DEFAULT_STROKES = { FRAME_STROKE, DIVIDER_STROKE };
```

- [ ] **Step 2: Add the chain props to ShapeCanvas**

Add to `ShapeCanvasProps` in `ShapeCanvas.tsx`, after `printMode`:

```ts
  /** Corner-window chain. When absent or single-segment, the flat path is used. */
  chain?: Chain;
  activeSegmentIndex?: number;
  activeConnectorIndex?: number | null;
  onSegmentSelect?: (index: number) => void;
  onConnectorSelect?: (index: number | null) => void;
  onConnectorAngleChange?: (index: number, angle: number) => void;
  onConnectorRemove?: (index: number) => void;
  onSegmentAttach?: (end: 'left' | 'right', width: number) => void;
```

And these imports:

```ts
import type { Chain } from './utils/chain-model';
import { layoutChain } from './utils/chain-projection';
import { renderSegment } from './layers/SegmentLayers';
```

- [ ] **Step 3: Add the chain render branch**

Immediately before the existing `return (` in `ShapeCanvas`, insert the chain branch. It must come after `glassFill` / `effectiveFrameColor` and friends are computed so it can reuse them.

```tsx
  // --- Chain render path -----------------------------------------------------
  // Only taken once a connector exists. A single-segment product falls through
  // to the original flat renderer below, unchanged.
  const isChain = !!chain && chain.connectors.length > 0;

  if (isChain && chain) {
    const layout = layoutChain(
      chain.segments.map((s) => s.width),
      height,
      chain.connectors.map((c) => ({ angle: c.angle, postWidth: c.postWidth })),
    );

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.totalW} ${layout.totalH}`}
        style={{ ...(svgStyle ?? { width: '100%', height: '88vh' }), cursor: svgCursor }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>{getGlassSvgDefs(glassType, uid, frameColor, customGlassTint)}</defs>

        {/* Corner posts, drawn behind the legs */}
        {layout.posts.map((post) => (
          <polygon
            key={`post-${post.index}`}
            points={post.corners.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={effectiveFrameColor}
            stroke={effectiveFrameColor}
            strokeWidth={effectiveDividerStroke}
          />
        ))}

        {/* Legs */}
        {chain.segments.map((segment, i) => renderSegment({
          segment,
          segmentIndex: i,
          matrix: layout.segments[i].matrix,
          drawW: layout.segments[i].drawW,
          drawH: layout.drawH,
          heightMm: height,
          shape: i === chain.rootIndex ? shape : { type: 'rectangle' },
          frameColor: effectiveFrameColor,
          frameStroke: effectiveFrameStroke,
          dividerStroke: effectiveDividerStroke,
          glassFill,
          glassFilter,
          glassHighlight,
          isSliding,
          render3D,
          printMode,
          uid,
          selected: i === activeSegmentIndex,
        }))}
      </svg>
    );
  }
```

Note `svgCursor` is declared with `const` above the return, so it is already in scope. Move the `const svgCursor = (() => {...})()` block above this branch if TypeScript complains about use-before-declaration.

- [ ] **Step 4: Temporarily hard-wire a two-segment chain to see it**

In `ProductEditor.tsx`, add a throwaway constant just above the `return`, and pass `chain={DEBUG_CHAIN}` to `<ShapeCanvas>`:

```tsx
  // TEMPORARY — removed in Task 7 once the connector tool can create these.
  const DEBUG_CHAIN = {
    segments: [
      { id: 'a', width: 1000, panels: 1, panelWidths: [1000], panelDivisions: [{ panelIndex: 0, horizontalCount: 1, verticalCount: 1 }] },
      { id: 'b', width: 800, panels: 2, panelWidths: [400, 400], panelDivisions: [{ panelIndex: 0, horizontalCount: 1, verticalCount: 1 }, { panelIndex: 1, horizontalCount: 1, verticalCount: 1 }] },
    ],
    connectors: [{ id: 'c', angle: 90, postWidth: 100 }],
    rootIndex: 0,
  };
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/templates/create`.

Expected, precisely:
1. Two window units are visible, not one.
2. The left unit is drawn square-on, exactly as before.
3. The right unit is drawn as a parallelogram receding **up and to the right**, roughly half as wide on screen as its 800 mm would be head-on.
4. Vertical frame edges on **both** units are perfectly vertical — no leaning.
5. A solid frame-coloured post fills the joint between them.
6. The right unit shows its two panels with a divider between them.
7. Nothing is clipped at the edges of the SVG.

If verticals lean, the matrix `c`/`d` terms are wrong — they must be exactly `0` and `1`.

- [ ] **Step 6: Remove the debug chain**

Delete `DEBUG_CHAIN` and the `chain={DEBUG_CHAIN}` prop. Confirm the canvas returns to a single unit rendered exactly as before.

- [ ] **Step 7: Build and commit**

```bash
npm run build
git add src/components/product-editor/canvas/layers/SegmentLayers.tsx \
  src/components/product-editor/canvas/ShapeCanvas.tsx
git commit -m "feat(canvas): render corner-window chain segments and posts"
```

---

## Task 6: Chain dimensions and angle badges

**Kind:** manually verified.

**Files:**
- Create: `src/components/product-editor/canvas/layers/ChainDimensionLayer.tsx`
- Modify: `src/components/product-editor/canvas/ShapeCanvas.tsx`

**Interfaces:**
- Consumes: `ChainLayout` (Task 1), `Chain` (Task 2), `DIM_COLOR`, `DIM_FONT`, `DIM_OFFSET`, `MARKER_SIZE` from `../utils/types`.
- Produces: `renderChainDimensions(props: ChainDimensionProps): React.ReactNode` and `interface ChainDimensionProps`.

**Why this is separate from the transform group:** text inside a sheared group is sheared, which stretches the glyphs. Dimensions are therefore drawn in root SVG coordinates from the already-projected corners, and each label is placed with a `rotate(...)` transform — a rotation, never a shear, so the type stays clean.

- [ ] **Step 1: Create the layer**

```tsx
// src/components/product-editor/canvas/layers/ChainDimensionLayer.tsx
import React from 'react';
import type { Point } from '../utils/types';
import { DIM_COLOR, DIM_FONT, DIM_LABEL_GAP, DIM_OFFSET } from '../utils/types';
import type { ChainLayout } from '../utils/chain-projection';
import type { Chain } from '../utils/chain-model';

export interface ChainDimensionProps {
  chain: Chain;
  layout: ChainLayout;
  heightMm: number;
  arrowLId: string;
  arrowRId: string;
}

/** Angle of a segment on screen, in degrees, normalised so text is never upside down. */
function labelAngle(a: Point, b: Point): number {
  let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  return deg;
}

/** Unit normal pointing away from the shape, for offsetting the dimension line. */
function outwardNormal(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Rotate the direction 90 degrees; positive y is down in SVG, so this points below.
  return { x: -dy / len, y: dx / len };
}

export function renderChainDimensions(props: ChainDimensionProps): React.ReactNode {
  const { chain, layout, heightMm, arrowLId, arrowRId } = props;

  return (
    <g className="chain-dimensions">
      {/* Per-leg width, drawn along that leg's own slanted sill */}
      {chain.segments.map((segment, i) => {
        const corners = layout.segments[i].corners;
        const bl = corners[3];
        const br = corners[2];
        const n = outwardNormal(bl, br);
        const a = { x: bl.x + n.x * DIM_OFFSET, y: bl.y + n.y * DIM_OFFSET };
        const b = { x: br.x + n.x * DIM_OFFSET, y: br.y + n.y * DIM_OFFSET };
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const deg = labelAngle(a, b);
        return (
          <g key={`chain-dim-w-${i}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={DIM_COLOR} strokeWidth={1}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            <text
              x={mid.x} y={mid.y - DIM_LABEL_GAP}
              transform={`rotate(${deg}, ${mid.x}, ${mid.y - DIM_LABEL_GAP})`}
              fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle"
            >
              {Math.round(segment.width)}
            </text>
          </g>
        );
      })}

      {/* Shared height, once, at the far left of the whole chain */}
      {(() => {
        const allCorners = layout.segments.flatMap((s) => s.corners);
        const leftMost = allCorners.reduce((best, p) => (p.x < best.x ? p : best), allCorners[0]);
        const topY = Math.min(...allCorners.filter((p) => Math.abs(p.x - leftMost.x) < 0.5).map((p) => p.y));
        const bottomY = Math.max(...allCorners.filter((p) => Math.abs(p.x - leftMost.x) < 0.5).map((p) => p.y));
        const x = leftMost.x - DIM_OFFSET;
        const midY = (topY + bottomY) / 2;
        return (
          <g key="chain-dim-h">
            <line x1={x} y1={topY} x2={x} y2={bottomY}
              stroke={DIM_COLOR} strokeWidth={1}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            <text
              x={x - DIM_LABEL_GAP} y={midY}
              transform={`rotate(-90, ${x - DIM_LABEL_GAP}, ${midY})`}
              fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle"
            >
              {Math.round(heightMm)}
            </text>
          </g>
        );
      })()}

      {/* Angle badge at each joint */}
      {chain.connectors.map((connector, i) => {
        const post = layout.posts[i];
        if (!post) return null;
        const cx = post.corners.reduce((s, p) => s + p.x, 0) / 4;
        const topY = Math.min(...post.corners.map((p) => p.y));
        const y = topY - DIM_OFFSET * 0.6;
        return (
          <g key={`chain-angle-${i}`}>
            <rect x={cx - 20} y={y - 10} width={40} height={16} rx={8}
              fill="#ffffff" stroke={DIM_COLOR} strokeWidth={1} />
            <text x={cx} y={y + 2} fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle">
              {`${connector.angle}°`}
            </text>
          </g>
        );
      })}
    </g>
  );
}
```

- [ ] **Step 2: Render it from the chain branch**

In `ShapeCanvas.tsx`, import it and add the arrow markers plus the call inside the chain branch's `<svg>`, after the legs:

```tsx
import { renderChainDimensions } from './layers/ChainDimensionLayer';
```

Inside the chain branch `<defs>`, before `getGlassSvgDefs(...)`, add the same two markers the flat path uses:

```tsx
        <marker id={arrowLId} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE} refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M${MARKER_SIZE},0 L0,${MARKER_SIZE / 2} L${MARKER_SIZE},${MARKER_SIZE}`} fill={DIM_COLOR} />
        </marker>
        <marker id={arrowRId} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX="0" refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE}`} fill={DIM_COLOR} />
        </marker>
```

And after the legs map:

```tsx
        {renderChainDimensions({ chain, layout, heightMm: height, arrowLId, arrowRId })}
```

- [ ] **Step 3: Verify in the browser**

Re-add the `DEBUG_CHAIN` from Task 5 Step 4 temporarily.

Expected, precisely:
1. `1000` appears below the left leg, horizontal.
2. `800` appears below the right leg, **rotated to follow that leg's slanted sill**, and the glyphs are not stretched or skewed.
3. `1000` (the height) appears once, rotated −90°, to the left of the whole chain.
4. A white pill reading `90°` sits above the corner post.
5. No dimension text is clipped by the SVG edge.

Then remove `DEBUG_CHAIN` again.

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add src/components/product-editor/canvas/layers/ChainDimensionLayer.tsx \
  src/components/product-editor/canvas/ShapeCanvas.tsx
git commit -m "feat(canvas): chain dimensions and joint angle badges"
```

---

## Task 7: Connector tool — placement

**Kind:** manually verified.

**Files:**
- Modify: `src/components/product-editor/canvas/utils/canvas-tools.ts`
- Modify: `src/components/product-editor/canvas/ShapeSelector.tsx`
- Modify: `src/components/product-editor/canvas/ShapeCanvas.tsx`
- Modify: `src/components/product-editor/ProductEditor.tsx`
- Modify: `src/components/product-editor/useProductEditorState.ts`

**Interfaces:**
- Consumes: `useSegmentChain` (Task 4), `onSegmentAttach` prop (Task 5).
- Produces: `CanvasTool` now includes `'connector'`; `ShapeSelectorProps` gains `onConnectorTool: () => void` and `connectorActive: boolean`.

- [ ] **Step 1: Extend the tool union**

In `canvas-tools.ts`:

```ts
export type CanvasTool = 'handle' | 'line' | 'arc' | 'remove' | 'connector' | null;
```

- [ ] **Step 2: Add the Connector entry to the shape dropdown**

In `ShapeSelector.tsx`, extend the props and append a Tools section below the shape grid. Selecting Connector activates the tool and must **not** change `shape.type`.

```tsx
interface ShapeSelectorProps {
  selected: ShapeType;
  onSelect: (shape: ShapeType) => void;
  onConnectorTool: () => void;
  connectorActive: boolean;
}
```

Replace the component's returned JSX with:

```tsx
const ShapeSelector: React.FC<ShapeSelectorProps> = ({ selected, onSelect, onConnectorTool, connectorActive }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {shapes.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors ${
              selected === type
                ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="border-t pt-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tools</p>
        <button
          type="button"
          onClick={onConnectorTool}
          title="Connector — attach another unit at an angle to form a corner window"
          className={`flex w-full items-center gap-2 rounded-lg p-2 text-xs font-medium transition-colors ${
            connectorActive
              ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
              : 'bg-muted/50 hover:bg-muted text-muted-foreground'
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="12" width="14" height="18" stroke="currentColor" strokeWidth="2" />
            <path d="M21 14L35 9V27L21 32V14Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M17 12V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Connector</span>
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Hit-test the outer edges and preview the ghost leg**

In `ShapeCanvas.tsx`, add a helper above the component:

```tsx
/** Which end of the chain, if any, the cursor is near. Draw-space units. */
function edgeAtPoint(
  px: number,
  chainLeftX: number,
  chainRightX: number,
  topY: number,
  bottomY: number,
  py: number,
): 'left' | 'right' | null {
  const EDGE_TOLERANCE = 24;
  if (py < topY - EDGE_TOLERANCE || py > bottomY + EDGE_TOLERANCE) return null;
  if (Math.abs(px - chainLeftX) <= EDGE_TOLERANCE) return 'left';
  if (Math.abs(px - chainRightX) <= EDGE_TOLERANCE) return 'right';
  return null;
}
```

Add state next to the existing `removeTarget` state:

```tsx
  const [connectorEdge, setConnectorEdge] = useState<'left' | 'right' | null>(null);
```

In the **flat** path's `onMouseMove`, when `activeTool === 'connector'`, set `connectorEdge` from the shape's own extents:

```tsx
          if (activeTool === 'connector') {
            const xs = svgVerts.map((v) => v.x);
            const ys = svgVerts.map((v) => v.y);
            setConnectorEdge(edgeAtPoint(pt.x, Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), pt.y));
          }
```

In `handleToolClick`, add:

```tsx
    if (activeTool === 'connector' && connectorEdge && onSegmentAttach) {
      onSegmentAttach(connectorEdge, width);
      setConnectorEdge(null);
    }
```

Add a ghost preview just before the remove-highlight layer in the flat path:

```tsx
      {activeTool === 'connector' && connectorEdge && (() => {
        const xs = svgVerts.map((v) => v.x);
        const ys = svgVerts.map((v) => v.y);
        const topY = Math.min(...ys);
        const botY = Math.max(...ys);
        const postX = connectorEdge === 'left' ? Math.min(...xs) : Math.max(...xs);
        const dir = connectorEdge === 'left' ? -1 : 1;
        const postW = 8;
        const ghostW = drawW * 0.5;
        return (
          <g key="connector-ghost" opacity={0.4}>
            <rect x={dir > 0 ? postX : postX - postW} y={topY} width={postW} height={botY - topY} fill="#7c3aed" />
            <polygon
              points={[
                [postX + dir * postW, topY],
                [postX + dir * (postW + ghostW), topY - ghostW * 0.5],
                [postX + dir * (postW + ghostW), botY - ghostW * 0.5],
                [postX + dir * postW, botY],
              ].map(([x, y]) => `${x},${y}`).join(' ')}
              fill="#7c3aed" fillOpacity={0.15} stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5 3"
            />
          </g>
        );
      })()}
```

Mirror the same `onMouseMove` / `onClick` / ghost logic in the **chain** branch, using the chain's overall bounding box from `layout.segments.flatMap(s => s.corners)` instead of `svgVerts`, and passing the width of the leg nearest that edge to `onSegmentAttach`.

- [ ] **Step 4: Wire the chain into ProductEditor**

In `useProductEditorState.ts`, instantiate the chain hook and expose it:

```ts
import { useSegmentChain } from './useSegmentChain';
```

Inside `useProductEditorState`, after the other state:

```ts
  const chainState = useSegmentChain(DEFAULTS.width);
```

Return it from the hook by adding `chain: chainState,` to the returned object.

In `ProductEditor.tsx`, pass the new props to `<ShapeCanvas>`:

```tsx
            chain={state.chain.chain}
            activeSegmentIndex={state.chain.activeSegmentIndex}
            activeConnectorIndex={state.chain.activeConnectorIndex}
            onSegmentSelect={state.chain.setActiveSegmentIndex}
            onConnectorSelect={state.chain.setActiveConnectorIndex}
            onConnectorAngleChange={state.chain.setConnectorAngle}
            onConnectorRemove={state.chain.removeConnector}
            onSegmentAttach={(end, w) => state.chain.attachSegment(end, w)}
```

And wire the dropdown entry:

```tsx
              <ShapeSelector
                selected={state.shape.type}
                onSelect={state.setShapeType}
                onConnectorTool={() => setActiveTool(activeTool === 'connector' ? null : 'connector')}
                connectorActive={activeTool === 'connector'}
              />
```

Keep the root segment's width in sync with the editor's `width` state by adding to `ProductEditor`:

```tsx
  useEffect(() => {
    state.chain.updateSegment(state.chain.chain.rootIndex, {
      width: state.width,
      panels: state.panels,
      panelWidths: state.panelWidths,
      panelDivisions: state.panelDivisions,
      panelDivisionHeights: state.panelDivisionHeights,
      panelDivisionWidths: state.panelDivisionWidths,
      openingPanels: state.openingPanels,
      openingDirections: state.openingDirections,
      openingPanes: state.openingPanes,
      removedSections: state.removedSections,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.width, state.panels, state.panelWidths, state.panelDivisions,
      state.panelDivisionHeights, state.panelDivisionWidths, state.openingPanels,
      state.openingDirections, state.openingPanes, state.removedSections]);
```

- [ ] **Step 5: Verify in the browser**

Expected, precisely:
1. `Shape: Rectangle ▾` opens the popover; below the 8 shape tiles there is a `Tools` divider with a single `Connector` button.
2. Clicking `Connector` highlights it violet and leaves the shape reading `Rectangle`.
3. Moving the cursor near the **right** edge of the rectangle shows a violet post plus a dashed ghost leg receding up-right. Moving near the **left** edge mirrors it. Moving to the middle shows nothing.
4. Clicking on the right edge attaches a real second leg at 90°, with a `90°` badge and its own width dimension.
5. Repeating on the far right edge of the new chain attaches a third leg, with two badges.
6. Attaching on the left edge instead prepends a leg.
7. Pressing Escape clears the tool.

- [ ] **Step 6: Build and commit**

```bash
npm run build
git add -A src/components/product-editor
git commit -m "feat(canvas): connector tool places corner segments from the shapes menu"
```

---

## Task 8: On-canvas angle slider

**Kind:** manually verified.

**Files:**
- Create: `src/components/product-editor/canvas/ConnectorSlider.tsx`
- Modify: `src/components/product-editor/canvas/ShapeCanvas.tsx`

**Interfaces:**
- Consumes: `layout.posts[i].corners`, `onConnectorAngleChange`, `activeConnectorIndex`.
- Produces: `ConnectorSlider: React.FC<ConnectorSliderProps>` where

```ts
interface ConnectorSliderProps {
  x: number;            // draw-space anchor
  y: number;
  height: number;       // draw-space height of the slider track
  angle: number;
  onChange: (angle: number) => void;
}
```

**Note:** it is rendered inside a `foreignObject`, the same mechanism the existing inline dimension editor uses. The slider is `writing-mode: vertical-lr` with `direction: rtl` so dragging **up** increases the angle.

- [ ] **Step 1: Create the component**

```tsx
// src/components/product-editor/canvas/ConnectorSlider.tsx
import React from 'react';

export interface ConnectorSliderProps {
  x: number;
  y: number;
  height: number;
  angle: number;
  onChange: (angle: number) => void;
}

const PANEL_W = 54;

/**
 * Vertical angle slider anchored to a corner post. Rendered in a foreignObject
 * so it can be a native range input — the same trick the inline dimension
 * editor uses.
 */
const ConnectorSlider: React.FC<ConnectorSliderProps> = ({ x, y, height, angle, onChange }) => {
  const h = Math.max(height, 90);
  return (
    <foreignObject x={x - PANEL_W / 2} y={y} width={PANEL_W} height={h + 26}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.94)', border: '1px solid #7E88C3',
          borderRadius: 8, padding: '6px 2px', boxSizing: 'border-box',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={1}
          max={359}
          step={1}
          value={angle}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            writingMode: 'vertical-lr' as const,
            direction: 'rtl',
            height: h,
            width: 20,
            accentColor: '#7c3aed',
          }}
          aria-label="Corner angle in degrees"
        />
        <span style={{ fontSize: 10, fontWeight: 600, color: '#4c1d95' }}>{angle}&deg;</span>
      </div>
    </foreignObject>
  );
};

export default ConnectorSlider;
```

- [ ] **Step 2: Render it when a connector is selected**

In `ShapeCanvas.tsx`, import it and add to the chain branch, after the dimensions:

```tsx
import ConnectorSlider from './ConnectorSlider';
```

```tsx
        {activeConnectorIndex != null && layout.posts[activeConnectorIndex] && onConnectorAngleChange && (() => {
          const post = layout.posts[activeConnectorIndex];
          const cx = post.corners.reduce((s, p) => s + p.x, 0) / 4;
          const topY = Math.min(...post.corners.map((p) => p.y));
          const botY = Math.max(...post.corners.map((p) => p.y));
          return (
            <ConnectorSlider
              x={cx}
              y={topY}
              height={botY - topY}
              angle={chain.connectors[activeConnectorIndex].angle}
              onChange={(a) => onConnectorAngleChange(activeConnectorIndex, a)}
            />
          );
        })()}
```

- [ ] **Step 3: Select a connector by clicking its post**

In the chain branch's `onClick`, before the tool dispatch, hit-test the posts and call `onConnectorSelect`:

```tsx
          const hitPost = layout.posts.findIndex((post) => {
            const xs = post.corners.map((p) => p.x);
            const ys = post.corners.map((p) => p.y);
            return pt.x >= Math.min(...xs) - 4 && pt.x <= Math.max(...xs) + 4
              && pt.y >= Math.min(...ys) && pt.y <= Math.max(...ys);
          });
          if (hitPost >= 0) {
            onConnectorSelect?.(hitPost);
            return;
          }
```

- [ ] **Step 4: Add keyboard nudging**

In `ProductEditor.tsx`, extend the existing Escape `keydown` handler:

```tsx
      if (e.key === 'Escape') {
        setActiveTool(null);
        state.chain.setActiveConnectorIndex(null);
        return;
      }
      const idx = state.chain.activeConnectorIndex;
      if (idx == null) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowUp' ? 1 : -1;
        state.chain.setConnectorAngle(idx, state.chain.chain.connectors[idx].angle + delta);
      }
```

Update that `useEffect`'s dependency array to `[state.chain]`.

- [ ] **Step 5: Verify in the browser**

Attach a segment first, then:
1. Clicking the corner post shows a vertical slider panel on the post reading `90°`.
2. Dragging the slider **up** increases the angle; the attached leg re-projects live, flattening out toward inline as the number approaches 180.
3. At exactly `180°` the second leg is drawn flat and inline with the first, unsheared.
4. Above `180°` the leg folds toward the viewer — it now recedes **down**-right instead of up-right.
5. The readout only ever shows whole numbers, and cannot go below 1 or above 359.
6. ↑ and ↓ change the angle by exactly 1 each press.
7. Escape hides the slider.

- [ ] **Step 6: Build and commit**

```bash
npm run build
git add src/components/product-editor/canvas/ConnectorSlider.tsx \
  src/components/product-editor/canvas/ShapeCanvas.tsx \
  src/components/product-editor/ProductEditor.tsx
git commit -m "feat(canvas): on-canvas corner angle slider with 1-degree snapping"
```

---

## Task 9: Segment selection drives the tabs

**Kind:** manually verified.

**Files:**
- Modify: `src/components/product-editor/canvas/ShapeCanvas.tsx`
- Modify: `src/components/product-editor/ProductEditor.tsx`
- Modify: `src/components/product-editor/productEditorHandlers.ts`

**Interfaces:**
- Consumes: `onSegmentSelect`, `activeSegmentIndex` (Task 5); `updateActiveSegment` (Task 4).
- Produces: no new exports. `buildShapeCanvasHandlers` gains a second responsibility — when the active segment is not the root, its callbacks write through `chain.updateActiveSegment` instead of the flat top-level setters.

- [ ] **Step 1: Select a segment on click**

In the chain branch's `onClick`, after the post hit test, add a point-in-polygon test over each segment's projected corners:

```tsx
          const inPolygon = (p: { x: number; y: number }, poly: Array<{ x: number; y: number }>) => {
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
              const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
              if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
            }
            return inside;
          };
          const hitSeg = layout.segments.findIndex((s) => inPolygon(pt, s.corners));
          if (hitSeg >= 0 && !activeTool) {
            onSegmentSelect?.(hitSeg);
            onConnectorSelect?.(null);
            return;
          }
```

- [ ] **Step 2: Route the editor state to the active segment**

In `ProductEditor.tsx`, replace the direct `state.*` reads passed to `<ShapeCanvas>` and to the tabs with active-segment reads. Add above the return:

```tsx
  const chain = state.chain;
  const isRootActive = chain.activeSegmentIndex === chain.chain.rootIndex;
  const activeSeg = chain.activeSegment;

  // Tabs and the Panels input read the active leg; when the root leg is active
  // that is the existing flat state, so single-unit behaviour is unchanged.
  const viewPanels = isRootActive ? state.panels : activeSeg.panels;
  const viewPanelWidths = isRootActive ? state.panelWidths : activeSeg.panelWidths;
  const viewPanelDivisions = isRootActive ? state.panelDivisions : (activeSeg.panelDivisions ?? []);
  const viewOpeningPanels = isRootActive ? state.openingPanels : (activeSeg.openingPanels ?? []);
  const viewOpeningDirections = isRootActive ? state.openingDirections : (activeSeg.openingDirections ?? {});
  const viewOpeningPanes = isRootActive ? state.openingPanes : (activeSeg.openingPanes ?? []);
  const viewWidth = isRootActive ? state.width : activeSeg.width;
```

Use these `view*` values for the `Panels:` input and for `PanelsTab` / `OpeningsTab` / `DimensionsTab` props.

Write-back helpers, also above the return:

```tsx
  const setActivePanels = (n: number) => {
    if (isRootActive) { state.handlePanelCountChange(n); return; }
    const avg = Math.round(activeSeg.width / n);
    const widths = Array(n).fill(avg);
    widths[n - 1] = activeSeg.width - avg * (n - 1);
    chain.updateActiveSegment({
      panels: n,
      panelWidths: widths,
      panelDivisions: Array.from({ length: n }, (_, i) => ({ panelIndex: i, horizontalCount: 1, verticalCount: 1 })),
    });
  };

  const setActiveWidth = (w: number) => {
    if (isRootActive) { state.setWidth(w); return; }
    const n = activeSeg.panels;
    const avg = Math.round(w / n);
    const widths = Array(n).fill(avg);
    widths[n - 1] = w - avg * (n - 1);
    chain.updateActiveSegment({ width: w, panelWidths: widths });
  };
```

Wire `setActivePanels` to the `Panels:` input's `onChange` and `setActiveWidth` to `DimensionsTab`'s `setWidth`.

- [ ] **Step 3: Route the canvas handlers**

In `productEditorHandlers.ts`, `buildShapeCanvasHandlers(state, arcs)` currently closes over the flat setters. Add a third argument and branch at the top of each handler:

```ts
export function buildShapeCanvasHandlers(
  state: ProductEditorState,
  arcs: { customArcs: PlacedArc[]; setCustomArcs: (a: PlacedArc[]) => void },
) {
  const chain = state.chain;
  const isRoot = chain.activeSegmentIndex === chain.chain.rootIndex;
  // ... each existing handler gains a leading:
  //   if (!isRoot) { chain.updateActiveSegment({ ... }); return; }
  // computing the same update against chain.activeSegment instead of state.*
```

Apply that pattern to `onPanelWidthChange`, `onPanelSplit`, `onPaneRowAdd`, `onPaneColAdd`, `onHandlePlaced`, `onPanelDividerRemove`, `onPaneRowRemove`, `onPaneColRemove`, `onPanelOpeningRemove`, `onPaneOpeningRemove`, and `onSectionRemove`. `onWidthChange` and `onHeightChange` stay on the flat state — height is shared, and width goes through `setActiveWidth`.

- [ ] **Step 4: Verify in the browser**

Attach a second leg, then:
1. Clicking the second leg draws a dashed violet outline around it; the first leg loses its outline.
2. The `Panels:` input now shows the second leg's panel count. Setting it to 3 splits **only** the second leg into three; the first leg is untouched.
3. The Dims tab's Width field edits only the selected leg, and that leg's own dimension label updates.
4. The Open tab's opening toggles apply only to the selected leg.
5. Clicking back on the first leg restores its own values in every tab.
6. With a single-segment product and no connectors, every tab behaves exactly as before.

- [ ] **Step 5: Build and commit**

```bash
npm run build
git add -A src/components/product-editor
git commit -m "feat(canvas): segment selection routes tabs to the active leg"
```

---

## Task 10: Delete cascade in the remove tool

**Kind:** manually verified (the maths behind it is already unit-tested in Task 3).

**Files:**
- Modify: `src/components/product-editor/canvas/utils/remove-tools.ts`
- Modify: `src/components/product-editor/canvas/ShapeCanvas.tsx`

**Interfaces:**
- Consumes: `connectorRemovalRange` (Task 3), `ChainLayout` (Task 1).
- Produces:
  - `RemovableItem` gains `| { type: 'connector'; connectorIndex: number }`
  - `function findConnectorAtPoint(layout: ChainLayout, px: number, py: number): number | null`
  - `function getConnectorCascadeHighlight(chain: Chain, layout: ChainLayout, connectorIndex: number): React.ReactNode`

- [ ] **Step 1: Extend the removable union and add the chain helpers**

In `remove-tools.ts`, add to the union:

```ts
  | { type: 'connector'; connectorIndex: number };
```

Then append these two functions and their imports:

```ts
import type { ChainLayout } from './chain-projection';
import type { Chain } from './chain-model';
import { connectorRemovalRange } from './chain-model';

/** Index of the corner post under the cursor, or null. Draw-space coords. */
export function findConnectorAtPoint(layout: ChainLayout, px: number, py: number): number | null {
  for (let i = 0; i < layout.posts.length; i++) {
    const xs = layout.posts[i].corners.map((p) => p.x);
    const ys = layout.posts[i].corners.map((p) => p.y);
    if (px >= Math.min(...xs) - HIT_TOLERANCE && px <= Math.max(...xs) + HIT_TOLERANCE
      && py >= Math.min(...ys) && py <= Math.max(...ys)) {
      return i;
    }
  }
  return null;
}

/**
 * Red overlay covering the post plus every segment and post that would go with
 * it, so the whole doomed set shades before the click lands.
 */
export function getConnectorCascadeHighlight(
  chain: Chain,
  layout: ChainLayout,
  connectorIndex: number,
): React.ReactNode {
  const range = connectorRemovalRange(chain, connectorIndex);
  const poly = (corners: Array<{ x: number; y: number }>, key: string) =>
    React.createElement('polygon', {
      key,
      points: corners.map((p) => `${p.x},${p.y}`).join(' '),
      fill: '#ef4444', opacity: 0.25, stroke: '#ef4444', strokeWidth: 2, strokeOpacity: 0.6,
    });

  return React.createElement(
    React.Fragment,
    null,
    ...range.segmentIndices
      .filter((i) => layout.segments[i])
      .map((i) => poly(layout.segments[i].corners, `doomed-seg-${i}`)),
    ...range.connectorIndices
      .filter((i) => layout.posts[i])
      .map((i) => poly(layout.posts[i].corners, `doomed-post-${i}`)),
  );
}
```

- [ ] **Step 2: Hook it into the chain branch**

In `ShapeCanvas.tsx`, add state next to `removeTarget`:

```tsx
  const [removeConnectorTarget, setRemoveConnectorTarget] = useState<number | null>(null);
```

In the chain branch's `onMouseMove`:

```tsx
          if (activeTool === 'remove') {
            setRemoveConnectorTarget(findConnectorAtPoint(layout, pt.x, pt.y));
          }
```

In the chain branch's `onClick`, before the selection handling:

```tsx
          if (activeTool === 'remove' && removeConnectorTarget != null) {
            onConnectorRemove?.(removeConnectorTarget);
            setRemoveConnectorTarget(null);
            return;
          }
```

And render the overlay last, so it sits on top of everything:

```tsx
        {activeTool === 'remove' && removeConnectorTarget != null &&
          getConnectorCascadeHighlight(chain, layout, removeConnectorTarget)}
```

Also clear it in `onMouseLeave`.

- [ ] **Step 3: Verify in the browser**

Build a three-leg chain: attach right, then attach right again.

Expected, precisely:
1. Activate `Remove`. Hover the **first** post: that post, the second leg, the second post, and the third leg **all** shade red at once. The first leg does not.
2. Hover the **second** post: only that post and the third leg shade red.
3. Click the second post: the third leg and that post disappear; two legs remain.
4. Click the remaining post: back to a single leg, and the canvas returns to the flat render path with the original single-unit dimensions.
5. Now build a chain by attaching to the **left** twice, so the root is the rightmost leg. Hovering the leftmost post shades only the leftmost leg; hovering the inner post shades both left-hand legs. Deleting either keeps the original leg alive.

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add src/components/product-editor/canvas/utils/remove-tools.ts \
  src/components/product-editor/canvas/ShapeCanvas.tsx
git commit -m "feat(canvas): erase tool cascades connector deletion with red preview"
```

---

## Task 11: Cost and description for chained products

**Kind:** unit-tested (TDD).

**Files:**
- Modify: `src/utils/costCalculator.ts`
- Create: `src/utils/costCalculator.test.ts`
- Modify: `src/utils/productDescription.ts`

**Interfaces:**
- Consumes: `ProductData` with the Task 2 fields; the existing private `calculateFrameItems` / `calculateGlassItems` / `calculateHardwareItems` / `calculateAccessoryItems`.
- Produces: `calculateProductCost` keeps its exact signature `(product: ProductData, materials: Material[]) => CostBreakdown`. `buildSketchDescription` keeps its signature.

**Approach:** for each segment, synthesise a single-segment `ProductData` and run the existing calculation against it, then sum. Corner posts become frame line items of `postWidth × height`. Because a one-segment product produces exactly one pass with the original inputs, existing costs are unchanged.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/costCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProductCost } from './costCalculator';
import type { ProductData } from '@/components/product-editor/types';
import type { Material } from '@/services/materialService';

const materials = [
  { id: 1, name: 'Frame 40x40', category: 'frame', unit: 'm', costPerUnit: 10, isDefault: true, properties: {} },
  { id: 2, name: 'Clear 4mm', category: 'glass', unit: 'm2', costPerUnit: 20, isDefault: true, properties: {} },
] as unknown as Material[];

const oneSegment: ProductData = {
  type: 'window', windowType: 'hinged',
  width: 1000, height: 1000, panels: 1, panelWidths: [1000],
  openingPanels: [], openingDirections: {}, unit: 'mm',
  shape: { type: 'rectangle' },
};

describe('calculateProductCost with chains', () => {
  it('leaves a single-segment product unchanged when chain fields are absent', () => {
    const withChain = { ...oneSegment, segments: [
      { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
    ], connectors: [], rootSegmentIndex: 0 };
    expect(calculateProductCost(withChain, materials).totalCost)
      .toBeCloseTo(calculateProductCost(oneSegment, materials).totalCost, 2);
  });

  it('costs more with a second segment than with one', () => {
    const two: ProductData = {
      ...oneSegment,
      segments: [
        { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
        { id: 'b', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    };
    const single = calculateProductCost(oneSegment, materials).totalCost;
    const chained = calculateProductCost(two, materials).totalCost;
    expect(chained).toBeGreaterThan(single);
  });

  it('adds one frame line item per corner post', () => {
    const two: ProductData = {
      ...oneSegment,
      segments: [
        { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
        { id: 'b', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    };
    const breakdown = calculateProductCost(two, materials);
    const posts = breakdown.frameItems.filter((i) => i.material.toLowerCase().includes('corner post'));
    expect(posts).toHaveLength(1);
    expect(posts[0].total).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- costCalculator`
Expected: FAIL — the corner-post assertion finds zero items and the chained total equals the single total.

- [ ] **Step 3: Implement**

Rename the existing `calculateProductCost` body to a private `calculateSegmentCost`, then add the new public entry point:

```ts
/** Cost of one flat unit. This is the original calculation, unchanged. */
function calculateSegmentCost(product: ProductData, materials: Material[]): CostBreakdown {
  const frameItems = calculateFrameItems(product, materials);
  const glassItems = calculateGlassItems(product, materials);
  const hardwareItems = calculateHardwareItems(product, materials);
  const accessoryItems = calculateAccessoryItems(product, materials);
  const totalCost =
    sumTotals(frameItems) + sumTotals(glassItems) +
    sumTotals(hardwareItems) + sumTotals(accessoryItems);
  return { frameItems, glassItems, hardwareItems, accessoryItems, totalCost: round(totalCost) };
}

/** Flatten one segment into a standalone single-unit ProductData. */
function segmentAsProduct(product: ProductData, index: number): ProductData {
  const s = product.segments?.[index];
  if (!s) return product;
  return {
    ...product,
    width: s.width,
    panels: s.panels,
    panelWidths: s.panelWidths,
    panelDivisions: s.panelDivisions,
    panelDivisionHeights: s.panelDivisionHeights,
    panelDivisionWidths: s.panelDivisionWidths,
    openingPanels: s.openingPanels ?? [],
    openingDirections: s.openingDirections ?? {},
    openingPanes: s.openingPanes ?? [],
    removedSections: s.removedSections,
    segments: undefined,
    connectors: undefined,
    rootSegmentIndex: undefined,
  };
}

/** Corner posts, priced as vertical frame extrusion. */
function calculatePostItems(product: ProductData, materials: Material[]): CostLineItem[] {
  const connectors = product.connectors ?? [];
  if (connectors.length === 0) return [];
  const frames = byCategory(materials, 'frame');
  const material = frames.find((m) => m.isDefault) ?? frames[0];
  if (!material) return [];

  const heightM = toMeters(product.height, product.unit || 'mm');
  return connectors.map((c, i) => {
    const quantity = round(heightM);
    return {
      material: `Corner post ${i + 1} (${c.postWidth}mm @ ${c.angle}°) — ${material.name}`,
      category: 'frame',
      quantity,
      unit: material.unit,
      unitCost: material.costPerUnit,
      total: round(quantity * material.costPerUnit),
    };
  });
}

export function calculateProductCost(product: ProductData, materials: Material[]): CostBreakdown {
  const segments = product.segments;
  if (!segments || segments.length <= 1) {
    return calculateSegmentCost(product, materials);
  }

  const perSegment = segments.map((_, i) => calculateSegmentCost(segmentAsProduct(product, i), materials));
  const postItems = calculatePostItems(product, materials);

  const frameItems = [...perSegment.flatMap((b) => b.frameItems), ...postItems];
  const glassItems = perSegment.flatMap((b) => b.glassItems);
  const hardwareItems = perSegment.flatMap((b) => b.hardwareItems);
  const accessoryItems = perSegment.flatMap((b) => b.accessoryItems);

  const totalCost =
    sumTotals(frameItems) + sumTotals(glassItems) +
    sumTotals(hardwareItems) + sumTotals(accessoryItems);

  return { frameItems, glassItems, hardwareItems, accessoryItems, totalCost: round(totalCost) };
}
```

`sumTotals` and `round` are declared below `calculateProductCost` today; function declarations hoist, so no reordering is needed.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- costCalculator`
Expected: PASS, 3 tests.

- [ ] **Step 5: Update the description**

In `productDescription.ts`, at the top of `buildSketchDescription`, add:

```ts
  const connectors = data.connectors ?? [];
  const segments = data.segments ?? [];
  if (connectors.length > 0 && segments.length > 1) {
    const widths = segments.map((s) => Math.round(s.width)).join('+');
    const angles = connectors.map((c) => `${c.angle}°`).join(', ');
    const kind = data.type === 'door' ? 'door' : 'window';
    return `Corner ${kind} ${widths}mm x ${Math.round(data.height)}mm @ ${angles}`;
  }
```

- [ ] **Step 6: Run the whole suite and build**

Run: `npm test && npm run build`
Expected: all tests pass, build exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/utils/costCalculator.ts src/utils/costCalculator.test.ts src/utils/productDescription.ts
git commit -m "feat(cost): price corner-window chains as one line item with posts"
```

---

## Task 12: Persistence, templates and PDF

**Kind:** manually verified.

**Files:**
- Modify: `src/utils/templateSketchProps.ts`
- Modify: `src/components/product-editor/useProductEditorState.ts`
- Modify: `src/components/product-editor/ProductEditor.tsx`

**Interfaces:**
- Consumes: `chainToProductData`, `normalizeToChain` (Task 2); `loadChain` (Task 4).
- Produces: `extractShapeCanvasProps` now also returns `chain`, so every read-only render site (Templates list, TemplateDetailModal, PDF preview) draws chains too.

- [ ] **Step 1: Forward the chain from saved data**

In `templateSketchProps.ts`, import and add one field to the returned object:

```ts
import { normalizeToChain } from '@/components/product-editor/canvas/utils/chain-model';
```

```ts
    chain: normalizeToChain(sketchData),
```

- [ ] **Step 2: Save the chain**

In `useProductEditorState.ts`, inside `buildProductData`, spread the chain fields over the legacy ones:

```ts
    const chainFields = chainState.toProductData();
    return {
      type,
      doorType: type === 'door' ? doorType : undefined,
      windowType: type === 'window' ? windowType : undefined,
      height,
      frameColor,
      glassType,
      customGlassTint: glassType === 'custom-tint' ? customGlassTint : undefined,
      unit,
      shape,
      render3D,
      ...chainFields,
    };
```

Add `chainState` to that `useCallback`'s dependency array. Remove the now-duplicated `width`, `panels`, `panelWidths`, `panelDivisions`, `panelDivisionHeights`, `panelDivisionWidths`, `openingPanels`, `openingDirections`, `openingPanes` and `removedSections` keys — `chainFields` supplies all of them.

- [ ] **Step 3: Load the chain**

In `populateFromData`, after the existing setters, add:

```ts
    chainState.loadChain(normalizeToChain(d));
```

Add `chainState` to its dependency array, and import `normalizeToChain`.

In `resetToDefaults` and in `ProductEditor`'s `handleReset`, add `state.chain.resetChain(1000)`.

- [ ] **Step 4: Verify persistence end to end**

Run the backend and the frontend. Then:
1. Build a two-leg corner at 120° with three panels on the second leg. Save it as a template.
2. Reload the page and open Templates. The card thumbnail shows the corner, not a flat rectangle.
3. Open the template detail modal — the corner renders with both dimensions and the `120°` badge.
4. Re-open the template in the editor. The chain, angle, post and per-leg panel counts all come back.
5. Open an **existing** template saved before this change. It renders exactly as it did, with no console errors.
6. Create a quotation line item from the corner template, then export the PDF. The sketch in the PDF shows the corner with its angle badge and both leg dimensions.
7. Confirm the quotation shows **one** line item for the corner product, with a cost greater than a single leg's.

- [ ] **Step 5: Confirm the zero-regression rule**

1. Create a plain single rectangle with no connectors. Save it.
2. Inspect the saved `sketchData` JSON (in the network tab or the DB). It must contain **no** `segments`, `connectors`, or `rootSegmentIndex` keys.

- [ ] **Step 6: Run everything and commit**

```bash
npm test && npm run build && npm run lint
git add -A src
git commit -m "feat(canvas): persist corner-window chains through templates and PDF"
```

---

## Self-Review Notes

Checked against the spec:

- Spec §1 geometry → Task 1. §2 data model and back-compat → Task 2. §3.1 placement → Task 7. §3.2 slider → Task 8. §3.3 segment selection → Task 9. §4 rendering → Tasks 5 and 6. §5 delete cascade → Tasks 3 and 10. §6 cost, description and PDF → Tasks 11 and 12.
- Acceptance criteria 1–2 → Task 7 Step 5. 3 → Task 8 Step 5. 4 → Task 7 Step 5. 5 → Task 9 Step 4. 6 → Task 10 Step 3. 7 → Task 12 Step 5. 8 → Task 12 Step 4 item 5. 9 → Task 11 and Task 12 Step 4 item 7. 10 → Task 12 Step 4 item 6.
- Spec §4's note that custom arcs stay on the root segment is honoured by omission: `SegmentLayers` does not render arcs, and the flat path still owns them. Arcs are not persisted today, so nothing is lost.
- Naming is consistent across tasks: `layoutChain`, `walkChain`, `projectPlanPoint`, `normalizeToChain`, `chainToProductData`, `makeSegment`, `connectorRemovalRange`, `applyConnectorRemoval`, `useSegmentChain`, `renderSegment`, `renderChainDimensions`, `findConnectorAtPoint`, `getConnectorCascadeHighlight`.
