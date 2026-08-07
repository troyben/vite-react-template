import type { ProductEditorState } from './useProductEditorState';
import type { PlacedArc } from '@/components/product-editor/canvas/utils/canvas-tools';
import type { OpeningDirection, Segment } from '@/components/product-editor/types';
import type { SectionId } from '@/components/product-editor/canvas/utils/section-outline';
import {
  computeEffectiveBounds,
  validateRemoval,
} from '@/components/product-editor/canvas/utils/section-outline';

/**
 * Pure callback factories used by <ProductEditor>.
 *
 * These mirror behaviour previously inlined in TemplateCreator.tsx (lines ~540-803)
 * and ProductEditorDialog.tsx (lines ~481-688). The TemplateCreator path is the
 * superset — it handles section removal (H-shapes etc.). Section-aware paths are
 * the default here; when removedSections is empty they fall back to the simple path.
 */

interface ArcsState {
  customArcs: PlacedArc[];
  setCustomArcs: React.Dispatch<React.SetStateAction<PlacedArc[]>>;
}

/** Either a plain value or a React-style updater over the previous value. */
type SetLike<T> = T | ((prev: T) => T);

function resolveSetLike<T>(updater: SetLike<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
}

/** `syncPanelWidths` from useProductEditorState, duplicated here (3 lines, not worth exporting):
 *  keep every panel width except the last unchanged, and let the last one absorb
 *  whatever total-width delta is left over. */
function syncWidths(widths: number[], total: number): number[] {
  const sumExceptLast = widths.slice(0, -1).reduce((a, b) => a + b, 0);
  const lastWidth = Math.max(total - sumExceptLast, 1);
  return [...widths.slice(0, -1), lastWidth];
}

/**
 * Read/write view over "whichever leg is currently selected" — the root leg's
 * data when the root is active (in which case every field/setter here is a
 * thin pass-through to the flat `ProductEditorState`, so single-unit behaviour
 * is byte-for-byte unchanged), or the active segment's data via
 * `chain.updateActiveSegment` otherwise.
 *
 * `handleDimensionChange` / `handlePanelWidthChange` / `handlePanelCountChange`
 * mirror the exact recompute logic of their flat `state.*` namesakes (same
 * neighbor-adjust / last-panel-absorbs-delta / average-split rules) so a leg's
 * behaviour doesn't change depending on whether it happens to be the root —
 * only *where* the result is written differs.
 *
 * `setPanels` / `setPanelWidths` are the raw, no-recompute counterparts the
 * canvas handlers need (they do their own math and just want a plain replace).
 */
export interface ActiveSegmentView {
  isRootActive: boolean;
  width: number;
  panels: number;
  panelWidths: number[];
  panelDivisions: NonNullable<Segment['panelDivisions']>;
  panelDivisionHeights: NonNullable<Segment['panelDivisionHeights']>;
  panelDivisionWidths: NonNullable<Segment['panelDivisionWidths']>;
  openingPanels: number[];
  openingDirections: Record<number, OpeningDirection>;
  openingPanes: NonNullable<Segment['openingPanes']>;
  removedSections: SectionId[];

  // Tab-facing setters: recompute derived fields exactly like the flat state does.
  setWidth: (w: number) => void;
  handleDimensionChange: (value: string, dimension: 'width' | 'height') => void;
  handlePanelWidthChange: (panelIndex: number, value: string) => void;
  handlePanelCountChange: (n: number) => void;
  setOpeningPanels: (p: number[]) => void;
  setOpeningDirections: (d: Record<number, OpeningDirection>) => void;
  setPanelDivisions: (d: NonNullable<Segment['panelDivisions']>) => void;
  setPanelDivisionHeights: (h: NonNullable<Segment['panelDivisionHeights']>) => void;
  setPanelDivisionWidths: (w: NonNullable<Segment['panelDivisionWidths']>) => void;

  // Canvas-facing raw setters: plain replace, no recompute.
  setPanels: (n: number) => void;
  setPanelWidths: (w: number[]) => void;
  setOpeningPanes: (updater: SetLike<NonNullable<Segment['openingPanes']>>) => void;
  setRemovedSections: (updater: SetLike<SectionId[]>) => void;
}

/**
 * The same view over an explicitly chosen leg.
 *
 * Canvas tools need this: a click lands on whichever leg is under the pointer,
 * which is not always the selected one, and selecting first would not help --
 * the selection state would still be stale for the rest of that same event.
 */
export function buildSegmentView(state: ProductEditorState, segmentIndex: number): ActiveSegmentView {
  const chain = state.chain;
  const isRootActive = segmentIndex === chain.chain.rootIndex;
  const seg = chain.chain.segments[segmentIndex] ?? chain.chain.segments[0];
  const updateSeg = (updates: Partial<Segment>) => chain.updateSegment(segmentIndex, updates);

  const setWidth = (w: number) => {
    if (isRootActive) {
      state.setWidth(w);
      return;
    }
    updateSeg({ width: w, panelWidths: syncWidths(seg.panelWidths, w) });
  };

  const handleDimensionChange = (value: string, dimension: 'width' | 'height') => {
    // Height is shared across the whole chain and always flat, regardless of
    // which leg is active.
    if (dimension === 'height' || isRootActive) {
      state.handleDimensionChange(value, dimension);
      return;
    }
    if (value === '' || value === '-') {
      setWidth(0);
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    setWidth(numValue);
  };

  const handlePanelWidthChange = (panelIndex: number, value: string) => {
    if (isRootActive) {
      state.handlePanelWidthChange(panelIndex, value);
      return;
    }
    if (value === '') {
      const newWidths = [...seg.panelWidths];
      newWidths[panelIndex] = 0;
      updateSeg({ panelWidths: newWidths });
      return;
    }
    let num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    let newWidths = [...seg.panelWidths];
    if (panelIndex === seg.panels - 1) {
      const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
      num = Math.max(seg.width - sumExceptLast, 0);
      newWidths[panelIndex] = num;
    } else {
      newWidths[panelIndex] = num;
      newWidths = syncWidths(newWidths, seg.width);
    }
    updateSeg({ panelWidths: newWidths });
  };

  const handlePanelCountChange = (newCount: number) => {
    if (isRootActive) {
      state.handlePanelCountChange(newCount);
      return;
    }
    const existingDivisions = [...(seg.panelDivisions ?? [])];
    for (let i = 0; i < newCount; i++) {
      if (!existingDivisions.find((d) => d.panelIndex === i)) {
        existingDivisions.push({ panelIndex: i, horizontalCount: 1, verticalCount: 1 });
      }
    }
    const avg = Math.round(seg.width / newCount);
    const widths = Array(newCount).fill(avg);
    if (newCount > 0) widths[newCount - 1] = seg.width - avg * (newCount - 1);
    updateSeg({ panels: newCount, panelDivisions: existingDivisions, panelWidths: widths });
  };

  const setOpeningPanels = (p: number[]) => {
    if (isRootActive) {
      state.setOpeningPanels(p);
      return;
    }
    updateSeg({ openingPanels: p });
  };

  const setOpeningDirections = (d: Record<number, OpeningDirection>) => {
    if (isRootActive) {
      state.setOpeningDirections(d);
      return;
    }
    updateSeg({ openingDirections: d });
  };

  const setPanelDivisions = (d: NonNullable<Segment['panelDivisions']>) => {
    if (isRootActive) {
      state.setPanelDivisions(d);
      return;
    }
    updateSeg({ panelDivisions: d });
  };

  const setPanelDivisionHeights = (h: NonNullable<Segment['panelDivisionHeights']>) => {
    if (isRootActive) {
      state.setPanelDivisionHeights(h);
      return;
    }
    updateSeg({ panelDivisionHeights: h });
  };

  const setPanelDivisionWidths = (w: NonNullable<Segment['panelDivisionWidths']>) => {
    if (isRootActive) {
      state.setPanelDivisionWidths(w);
      return;
    }
    updateSeg({ panelDivisionWidths: w });
  };

  const setPanels = (n: number) => {
    if (isRootActive) {
      state.setPanels(n);
      return;
    }
    updateSeg({ panels: n });
  };

  const setPanelWidths = (w: number[]) => {
    if (isRootActive) {
      state.setPanelWidths(w);
      return;
    }
    updateSeg({ panelWidths: w });
  };

  const setOpeningPanes = (updater: SetLike<NonNullable<Segment['openingPanes']>>) => {
    if (isRootActive) {
      state.setOpeningPanes(updater as SetLike<typeof state.openingPanes>);
      return;
    }
    const next = resolveSetLike(updater, seg.openingPanes ?? []);
    updateSeg({ openingPanes: next });
  };

  const setRemovedSections = (updater: SetLike<SectionId[]>) => {
    if (isRootActive) {
      state.setRemovedSections(updater as SetLike<typeof state.removedSections>);
      return;
    }
    const next = resolveSetLike(updater, seg.removedSections ?? []);
    updateSeg({ removedSections: next });
  };

  return {
    isRootActive,
    width: isRootActive ? state.width : seg.width,
    panels: isRootActive ? state.panels : seg.panels,
    panelWidths: isRootActive ? state.panelWidths : seg.panelWidths,
    panelDivisions: isRootActive ? state.panelDivisions : (seg.panelDivisions ?? []),
    panelDivisionHeights: isRootActive ? state.panelDivisionHeights : (seg.panelDivisionHeights ?? []),
    panelDivisionWidths: isRootActive ? state.panelDivisionWidths : (seg.panelDivisionWidths ?? []),
    openingPanels: isRootActive ? state.openingPanels : (seg.openingPanels ?? []),
    openingDirections: isRootActive ? state.openingDirections : (seg.openingDirections ?? {}),
    openingPanes: isRootActive ? state.openingPanes : (seg.openingPanes ?? []),
    removedSections: isRootActive ? state.removedSections : (seg.removedSections ?? []),
    setWidth,
    handleDimensionChange,
    handlePanelWidthChange,
    handlePanelCountChange,
    setOpeningPanels,
    setOpeningDirections,
    setPanelDivisions,
    setPanelDivisionHeights,
    setPanelDivisionWidths,
    setPanels,
    setPanelWidths,
    setOpeningPanes,
    setRemovedSections,
  };
}

/** The view over whichever leg is currently selected. */
export function buildActiveSegmentView(state: ProductEditorState): ActiveSegmentView {
  return buildSegmentView(state, state.chain.activeSegmentIndex);
}

/**
 * Canvas callbacks bound to one leg.
 *
 * `segmentIndex` defaults to the selected leg, which is what the flat path and
 * the tabs want. The chain canvas passes the leg the pointer actually landed
 * on, so a tool edits what was clicked rather than what happened to be
 * selected.
 */
export function buildShapeCanvasHandlers(
  state: ProductEditorState,
  arcs: ArcsState,
  segmentIndex: number = state.chain.activeSegmentIndex,
) {
  const { customArcs, setCustomArcs } = arcs;
  const view = buildSegmentView(state, segmentIndex);

  // onWidthChange is the outer width dimension's inline editor. It now fires on
  // the chain path too -- each leg's width label is editable -- so it writes
  // through `view` to reach the right leg. onHeightChange stays on flat state:
  // height is shared by every leg in a chain by design.
  const onWidthChange = (v: number) => {
    if (!view.isRootActive) {
      view.setWidth(v);
      return;
    }
    if (state.removedSections.length > 0) {
      const eff = computeEffectiveBounds(
        state.panels, state.panelWidths, state.panelDivisions,
        state.panelDivisionHeights, state.panelDivisionWidths,
        state.height, state.removedSections,
      );
      if (eff.width > 0) {
        const scale = v / eff.width;
        const newWidths = state.panelWidths.map((w) => Math.round(w * scale));
        state.setPanelWidths(newWidths);
        state.setWidth(newWidths.reduce((a, b) => a + b, 0));
      }
    } else {
      state.setWidth(v);
    }
  };

  const onHeightChange = (v: number) => {
    if (state.removedSections.length > 0) {
      const eff = computeEffectiveBounds(
        state.panels, state.panelWidths, state.panelDivisions,
        state.panelDivisionHeights, state.panelDivisionWidths,
        state.height, state.removedSections,
      );
      if (eff.height > 0) {
        const scale = v / eff.height;
        state.setHeight(Math.round(state.height * scale));
        if (state.panelDivisionHeights.length > 0) {
          state.setPanelDivisionHeights(
            state.panelDivisionHeights.map((h) => ({
              ...h,
              rowHeights: h.rowHeights.map((rh) => Math.round(rh * scale)),
            })),
          );
        }
      }
    } else {
      state.setHeight(v);
    }
  };

  // onRowHeightChange: same reasoning as onWidthChange/onHeightChange above —
  // it's the flat canvas's inline row-height editor, unreachable once a chain
  // exists (SegmentLayers renders legs statically, with no inline editing).
  // Left on flat state.
  const onRowHeightChange = (panelIndex: number, rowIndex: number, v: number) => {
    const heights = [...state.panelDivisionHeights];
    const entry = heights.find((h) => h.panelIndex === panelIndex);
    if (entry) {
      const newRowHeights = [...entry.rowHeights];
      const delta = v - newRowHeights[rowIndex];
      newRowHeights[rowIndex] = v;
      const neighborRow = rowIndex < newRowHeights.length - 1 ? rowIndex + 1 : rowIndex - 1;
      if (neighborRow >= 0) {
        newRowHeights[neighborRow] = Math.max(newRowHeights[neighborRow] - delta, 1);
      }
      heights[heights.indexOf(entry)] = { ...entry, rowHeights: newRowHeights };
      state.setPanelDivisionHeights(heights);
    }
  };

  const onPanelWidthChange = (i: number, v: number) => {
    const newWidths = [...view.panelWidths];
    const delta = v - newWidths[i];
    newWidths[i] = v;
    const neighborIdx = i < newWidths.length - 1 ? i + 1 : i - 1;
    if (neighborIdx >= 0) {
      newWidths[neighborIdx] = Math.max(newWidths[neighborIdx] - delta, 1);
    }
    view.setPanelWidths(newWidths);
  };

  const onHandlePlaced = (
    panelIdx: number,
    dir: string,
    paneInfo: { rowIndex: number; colIndex: number } | undefined,
  ) => {
    const openingType = state.isSliding ? 'sliding' : 'hinged';
    if (paneInfo) {
      view.setOpeningPanes((prev) => [
        ...prev,
        {
          panelIndex: panelIdx,
          rowIndex: paneInfo.rowIndex,
          colIndex: paneInfo.colIndex,
          openingDirection: dir as OpeningDirection,
          openingType,
        },
      ]);
    } else {
      view.setOpeningPanels([...view.openingPanels, panelIdx]);
      view.setOpeningDirections({
        ...view.openingDirections,
        [panelIdx]: dir as OpeningDirection,
      });
    }
  };

  const onPanelSplit = (splitMm: number) => {
    const newWidths = [...view.panelWidths];
    let accumulated = 0;
    for (let i = 0; i < newWidths.length; i++) {
      if (accumulated + newWidths[i] >= splitMm) {
        const leftWidth = Math.round(splitMm - accumulated);
        const rightWidth = Math.round(newWidths[i] - leftWidth);
        if (leftWidth < 10 || rightWidth < 10) return;
        newWidths.splice(i, 1, leftWidth, rightWidth);
        break;
      }
      accumulated += newWidths[i];
    }
    view.setPanels(newWidths.length);
    view.setPanelWidths(newWidths);
    view.setRemovedSections([]);
  };

  const onPaneRowAdd = (panelIndex: number, splitMm: number) => {
    const existing = view.panelDivisions.find((d) => d.panelIndex === panelIndex);
    const currentRows = existing?.horizontalCount ?? 1;
    if (currentRows >= 4) return;
    const newDivisions = view.panelDivisions.filter((d) => d.panelIndex !== panelIndex);
    newDivisions.push({
      panelIndex,
      horizontalCount: currentRows + 1,
      verticalCount: existing?.verticalCount ?? 1,
    });
    view.setPanelDivisions(newDivisions);
    const existingHeights = view.panelDivisionHeights.find((h) => h.panelIndex === panelIndex);
    const oldRowHeights = existingHeights?.rowHeights ?? [state.height];
    const newRowHeights: number[] = [];
    let accumulated = 0;
    let inserted = false;
    for (let i = 0; i < oldRowHeights.length; i++) {
      if (!inserted && accumulated + oldRowHeights[i] >= splitMm) {
        const topPart = Math.round(splitMm - accumulated);
        const bottomPart = Math.round(oldRowHeights[i] - topPart);
        if (topPart >= 1 && bottomPart >= 1) newRowHeights.push(topPart, bottomPart);
        else newRowHeights.push(oldRowHeights[i]);
        inserted = true;
      } else {
        newRowHeights.push(oldRowHeights[i]);
      }
      accumulated += oldRowHeights[i];
    }
    const newHeights = view.panelDivisionHeights.filter((h) => h.panelIndex !== panelIndex);
    newHeights.push({ panelIndex, rowHeights: newRowHeights });
    view.setPanelDivisionHeights(newHeights);
    view.setRemovedSections([]);
  };

  const onPaneColAdd = (panelIndex: number, splitMm: number) => {
    const existing = view.panelDivisions.find((d) => d.panelIndex === panelIndex);
    const currentCols = existing?.verticalCount ?? 1;
    if (currentCols >= 4) return;
    const newDivisions = view.panelDivisions.filter((d) => d.panelIndex !== panelIndex);
    newDivisions.push({
      panelIndex,
      horizontalCount: existing?.horizontalCount ?? 1,
      verticalCount: currentCols + 1,
    });
    view.setPanelDivisions(newDivisions);
    const panelW = view.panelWidths[panelIndex];
    const existingWidths = view.panelDivisionWidths.find((w) => w.panelIndex === panelIndex);
    const oldColWidths = existingWidths?.colWidths ?? [panelW];
    const newColWidths: number[] = [];
    let accumulated = 0;
    let inserted = false;
    for (let i = 0; i < oldColWidths.length; i++) {
      if (!inserted && accumulated + oldColWidths[i] >= splitMm) {
        const leftPart = Math.round(splitMm - accumulated);
        const rightPart = Math.round(oldColWidths[i] - leftPart);
        if (leftPart >= 1 && rightPart >= 1) newColWidths.push(leftPart, rightPart);
        else newColWidths.push(oldColWidths[i]);
        inserted = true;
      } else {
        newColWidths.push(oldColWidths[i]);
      }
      accumulated += oldColWidths[i];
    }
    const newWidthsArr = view.panelDivisionWidths.filter((w) => w.panelIndex !== panelIndex);
    newWidthsArr.push({ panelIndex, colWidths: newColWidths });
    view.setPanelDivisionWidths(newWidthsArr);
    view.setRemovedSections([]);
  };

  const onArcPlaced = (arc: PlacedArc) => setCustomArcs((prev) => [...prev, arc]);

  const onPanelDividerRemove = (idx: number) => {
    const nw = [...view.panelWidths];
    nw.splice(idx, 2, nw[idx] + nw[idx + 1]);
    view.setPanels(nw.length);
    view.setPanelWidths(nw);
    view.setRemovedSections([]);
  };

  const onPaneRowRemove = (pi: number, ri: number) => {
    const ex = view.panelDivisions.find((d) => d.panelIndex === pi);
    if (!ex || ex.horizontalCount <= 1) return;
    const nd = view.panelDivisions.filter((d) => d.panelIndex !== pi);
    nd.push({ panelIndex: pi, horizontalCount: ex.horizontalCount - 1, verticalCount: ex.verticalCount });
    view.setPanelDivisions(nd);
    const eh = view.panelDivisionHeights.find((h) => h.panelIndex === pi);
    if (eh) {
      const rh = [...eh.rowHeights];
      rh.splice(ri, 2, rh[ri] + rh[ri + 1]);
      const nh = view.panelDivisionHeights.filter((h) => h.panelIndex !== pi);
      if (rh.length > 1) nh.push({ panelIndex: pi, rowHeights: rh });
      view.setPanelDivisionHeights(nh);
    }
    view.setRemovedSections([]);
  };

  const onPaneColRemove = (pi: number, ci: number) => {
    const ex = view.panelDivisions.find((d) => d.panelIndex === pi);
    if (!ex || ex.verticalCount <= 1) return;
    const nd = view.panelDivisions.filter((d) => d.panelIndex !== pi);
    nd.push({ panelIndex: pi, horizontalCount: ex.horizontalCount, verticalCount: ex.verticalCount - 1 });
    view.setPanelDivisions(nd);
    const ew = view.panelDivisionWidths.find((w) => w.panelIndex === pi);
    if (ew) {
      const cw = [...ew.colWidths];
      cw.splice(ci, 2, cw[ci] + cw[ci + 1]);
      const nw = view.panelDivisionWidths.filter((w) => w.panelIndex !== pi);
      if (cw.length > 1) nw.push({ panelIndex: pi, colWidths: cw });
      view.setPanelDivisionWidths(nw);
    }
    view.setRemovedSections([]);
  };

  const onPanelOpeningRemove = (pi: number) => {
    view.setOpeningPanels(view.openingPanels.filter((p) => p !== pi));
    const d = { ...view.openingDirections };
    delete d[pi];
    view.setOpeningDirections(d);
  };

  const onPaneOpeningRemove = (pi: number, ri: number, ci: number) => {
    view.setOpeningPanes((prev) =>
      prev.filter((p) => !(p.panelIndex === pi && p.rowIndex === ri && p.colIndex === ci)),
    );
  };

  const onArcRemove = (id: string) => {
    setCustomArcs((prev) => prev.filter((a) => a.id !== id));
    // suppress unused warning if customArcs only flows through setter
    void customArcs;
  };

  const onSectionRemove = (pi: number, ri: number, ci: number) => {
    const proposed = { panelIndex: pi, rowIndex: ri, colIndex: ci };
    if (
      !validateRemoval(
        view.panels,
        view.panelDivisions,
        view.removedSections,
        proposed,
        view.openingPanels,
        view.openingPanes,
      )
    ) {
      return;
    }
    view.setRemovedSections((prev) => [...prev, proposed]);
  };

  return {
    onWidthChange,
    onHeightChange,
    onPanelWidthChange,
    onRowHeightChange,
    onHandlePlaced,
    onPanelSplit,
    onPaneRowAdd,
    onPaneColAdd,
    onArcPlaced,
    onPanelDividerRemove,
    onPaneRowRemove,
    onPaneColRemove,
    onPanelOpeningRemove,
    onPaneOpeningRemove,
    onArcRemove,
    onSectionRemove,
  };
}
