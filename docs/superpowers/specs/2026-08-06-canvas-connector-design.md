# Canvas Connector — Corner Window Chains

**Date:** 2026-08-06
**Status:** Approved
**Scope:** Frontend only (`vite-react-template/`). No backend changes.

## Problem

The product editor draws exactly one window unit: a single shape outline subdivided
into N panels, all in one flat SVG coordinate space. Fabricators need to quote
**corner windows** — two or more units joined at an angle around a building corner.

There is currently no way to express that. A user can only draw one flat elevation.

## Goal

Add a **Connector** tool. A connector attaches to the left or right outer edge of the
drawing and joins another rectangle to it at a user-set angle. The angle is set with
an on-canvas slider dragged up/down, snapping to 1°. Multiple connectors are allowed,
forming a chain. Deleting a connector deletes everything attached beyond it, and the
erase tool's red highlight shades the entire doomed set before the click lands.

## Non-goals

- Attached segments are **rectangles only**. The root segment keeps every existing
  shape type (arch, trapezoid, gable, …).
- No per-segment height. The chain shares one head line and one sill line.
- No plan-view drawing mode. One projected 3/4 view only.
- No backend schema work. Templates store `sketchData` as a JSON string and
  quotations store `items` as a JSON string, so the new optional fields ride along.

---

## 1. Geometry model

### 1.1 Plan walk

The chain is first laid out in a 2D **plan** space (looking down from above), then
projected to the screen.

```
heading:  φ₀   = 0                    segment 0 faces the viewer
          φₖ₊₁ = φₖ + (180° − θₖ)     θₖ = interior angle at connector k
```

θ = 180° means no turn (legs inline). θ = 90° turns the next leg 90° away.

The plan cursor starts at the origin. For each segment it advances `Wᵢ` along
`(cos φᵢ, sin φᵢ)`. For each connector it advances `postWidth` along the bisector of
`φₖ` and `φₖ₊₁`, so the corner post visually fills the joint.

### 1.2 Oblique (cabinet) projection

```
sx = x + D·y·cos 45°        D = 0.5   depth foreshortening
sy =    −D·y·sin 45°                  depth recedes up and to the right
```

Vertical lines are unaffected by the projection, so each segment maps to the screen
through a pure shear+scale:

```
SVG matrix(ux, uy, 0, 1, ex, ey)
```

where `(ux, uy)` is the projected unit heading vector scaled to drawing units and
`(ex, ey)` is the projected origin of that segment.

Because verticals stay vertical, **every existing per-panel renderer — glass fill,
panel dividers, pane subdivisions, frame border, opening indicators — works unchanged
inside the transform group.** No renderer needs to learn about angles.

At θ = 90° the second leg recedes up-right at 45°, horizontally compressed to half
scale: the classic 3/4 corner-window view.

### 1.3 Angle range

1°–359°, snapping to 1°, default 90°. 180° is flat. Values above 180° fold the leg
toward the viewer (bay/outside corner). The range is deliberately unrestricted; it
permits physically awkward folds that overlap a previous leg, and that is accepted.

---

## 2. Data model

Added to `ProductData` in `src/components/product-editor/types.ts`. All fields are
optional, so every existing saved template and quotation loads unchanged.

```ts
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
    panelIndex: number; rowIndex: number; colIndex: number;
    openingDirection?: OpeningDirection; openingType?: 'hinged' | 'sliding';
  }>;
  removedSections?: SectionId[];
}

export interface Connector {
  id: string;
  angle: number;      // interior angle, degrees, 1–359, integer
  postWidth: number;  // mm, default 100
}

// ProductData additions
segments?: Segment[];
connectors?: Connector[];
rootSegmentIndex?: number;
```

`connectors[i]` joins `segments[i]` to `segments[i+1]`. A chain of N segments has
N−1 connectors.

**Shared across the chain** (stay top-level on `ProductData`): `height`, `unit`,
`type`, `doorType`, `windowType`, `frameColor`, `glassType`, `customGlassTint`,
`shape`, `render3D`.

**`rootSegmentIndex`** is the array index of the segment the user created first.
Attaching on the right pushes; attaching on the left unshifts and increments
`rootSegmentIndex`. It exists so "delete everything after this connector" has a
well-defined direction — see §5.

### 2.1 Backward compatibility

Internally the editor normalises to a single `segments[]` array where `segments[0]`
holds what are today the top-level `width` / `panels` / `panelWidths` / openings /
divisions / removedSections fields.

- `populateFromData` builds `segments[0]` from the top-level fields, then appends
  `d.segments?.slice(1)` if present.
- `buildProductData` writes `segments[0]` back **out** to the legacy top-level fields
  and additionally emits `segments`, `connectors`, `rootSegmentIndex`.

So a single-segment product serialises byte-identically to today, and an old payload
deserialises to a one-segment chain.

---

## 3. Interaction

### 3.1 Placing a connector

The Shapes dropdown (`ShapeSelector`) gets a `Connector` entry below a divider
labelled **Tools**. Selecting it sets `activeTool = 'connector'` and does **not**
change `shape.type`.

With the tool active, hovering near the chain's left or right **outer** edge shows a
ghost post plus a ghost leg. Clicking commits a new connector and segment:

- `angle` = 90
- `postWidth` = 100 mm
- new segment `width` = the width of the leg that was clicked
- new segment `panels` = 1, single full-width panel, no openings

Escape deactivates the tool (existing global handler already does this).

### 3.2 The angle slider

Clicking a corner post selects that connector. A vertical slider appears anchored at
the post, rendered in a `foreignObject` — the same mechanism the inline dimension
editor already uses in `ShapeCanvas`. Drag up/down to change the angle, snapping to
1°, with a live `90°` readout. ↑/↓ keys nudge by 1°.

The same value is mirrored as a numeric input in a new **Connector** section of the
right-hand panel, shown only while a connector is selected. Post width is editable
there too.

### 3.3 Selecting a segment

Clicking a leg selects it and draws a subtle highlight outline. The toolbar `Panels`
input and all five right-hand tabs (Shape / Dims / Look / Open / Panes) then operate
on the selected leg. With one segment and no connectors, behaviour is exactly as
today.

Shape-type editing stays bound to the root segment; attached segments are rectangles.

---

## 4. Rendering

`ShapeCanvas` branches on `connectors.length`:

- **`=== 0`** → today's existing code path, unmodified. This is the regression
  guarantee: single-unit products cannot change.
- **`> 0`** → chain path.

In the chain path:

- **Geometry** (glass fill, panel dividers, pane subdivisions, frame border, opening
  indicators) renders per segment inside its `<g transform="matrix(…)">`.
- **Custom arcs** stay on the root segment only. `customArcs` is component-local state
  holding raw SVG coordinates and is not persisted today; making it per-segment is out
  of scope. In chain mode arcs render inside the root segment's transform group.
- **Dimensions** render *outside* the matrix, in screen space, computed from the
  projected corner points. Label text is **rotated, never sheared**, so fonts stay
  undistorted.
  - one width dimension per leg, drawn along that leg's slanted base
  - one shared height dimension at the far-left edge of the chain
  - an `∠90°` badge at each joint
  - panel-width dimensions follow the same slant as their leg
- **viewBox** is fitted to the projected bounding box of the whole chain, replacing
  the current `totalW` / `totalH` calculation when the chain path is active.

Accepted cosmetic consequence: casement swing arcs and 3D opening geometry shear
along with their leg. This reads as perspective and is intentional.

---

## 5. Delete cascade

A new `RemovableItem` variant is added in `remove-tools.ts`:

```ts
{ type: 'connector'; connectorIndex: number }
```

Hit target is the corner post. `findRemovableAtPoint` returns it when the remove tool
is active and the cursor is over a post.

`getHighlightGeometry` for a connector returns red translucent fills covering the post
**and every segment and post downstream of the root**:

```
doomed = connectorIndex >= rootSegmentIndex
       ? segments[connectorIndex+1 .. end]  + connectors[connectorIndex .. end]
       : segments[0 .. connectorIndex]      + connectors[0 .. connectorIndex]
```

So the whole subtree shades red on hover, before the click lands, as required.

Committing the removal splices those ranges out and adjusts `rootSegmentIndex` when
the removal happened on the left side of the root.

---

## 6. Cost, description, PDF

- **`costCalculator.ts`** — `calculateCost` iterates segments, running the existing
  per-segment frame/glass/hardware calculation against a synthesised single-segment
  `ProductData`, and sums the results. Each corner post is then added as a frame
  extrusion line of `postWidth × height`. The product remains **one quotation line
  item**.
- **`productDescription.ts`** — a chained product describes as e.g.
  `Corner window 1000+800mm @ 90°`.
- **PDF** — `templateSketchProps.ts` and `utils/pdf/sketchRenderer.ts` forward the new
  fields; the chain renders through the same `ShapeCanvas`, so the exported sketch
  matches the canvas.

---

## 7. File plan

**New**

| File | Purpose |
|---|---|
| `canvas/utils/chain-projection.ts` | plan walk, oblique projection, per-segment matrices, chain bbox |
| `canvas/layers/SegmentLayers.tsx` | render one segment's geometry inside its transform group |
| `canvas/layers/ChainDimensionLayer.tsx` | screen-space per-leg dims, shared height dim, angle badges |
| `canvas/ConnectorSlider.tsx` | `foreignObject` vertical angle slider |
| `useSegmentChain.ts` | chain state: segments, connectors, rootSegmentIndex, selection |

**Edited**

`types.ts` · `canvas/utils/canvas-tools.ts` · `canvas/utils/remove-tools.ts` ·
`canvas/ShapeCanvas.tsx` · `canvas/ShapeSelector.tsx` · `canvas/CanvasToolbar.tsx` ·
`ProductEditor.tsx` · `useProductEditorState.ts` · `productEditorHandlers.ts` ·
`utils/costCalculator.ts` · `utils/productDescription.ts` ·
`utils/templateSketchProps.ts` · `utils/pdf/sketchRenderer.ts`

`useProductEditorState.ts` is already 282 lines. Chain state goes into the separate
`useSegmentChain.ts` hook rather than growing it further.

---

## 8. Acceptance criteria

1. Shapes dropdown lists **Connector** under a Tools divider; picking it activates the
   connector tool without altering the current shape type.
2. With the tool active, hovering the left or right outer edge previews a ghost post
   and ghost leg; clicking attaches a rectangle at 90° with a 100 mm post.
3. Dragging the on-canvas slider up/down changes the joint angle in 1° steps across
   1°–359°, and the attached leg's projected geometry updates live.
4. Two or more connectors can exist in one drawing, on either end.
5. Clicking a leg selects it; the Dims / Look / Open / Panes tabs and the Panels input
   then edit that leg only.
6. With the erase tool active, hovering a corner post shades that post and every
   segment and post beyond it in red; clicking removes exactly that set.
7. A drawing with zero connectors renders pixel-identically to the current build and
   serialises to the same JSON.
8. An existing saved template and an existing saved quotation both load without error
   after the change.
9. A chained product produces one quotation line item whose cost includes every
   segment plus every corner post.
10. PDF export of a chained product reproduces the canvas sketch, including the angle
    badges and per-leg dimensions.
