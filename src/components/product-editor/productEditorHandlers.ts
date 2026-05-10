import type { ProductEditorState } from './useProductEditorState';
import type { PlacedArc } from '@/components/product-editor/canvas/utils/canvas-tools';
import type { OpeningDirection } from '@/components/product-editor/types';
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

export function buildShapeCanvasHandlers(state: ProductEditorState, arcs: ArcsState) {
  const { customArcs, setCustomArcs } = arcs;

  const onWidthChange = (v: number) => {
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

  const onPanelWidthChange = (i: number, v: number) => {
    const newWidths = [...state.panelWidths];
    const delta = v - newWidths[i];
    newWidths[i] = v;
    const neighborIdx = i < newWidths.length - 1 ? i + 1 : i - 1;
    if (neighborIdx >= 0) {
      newWidths[neighborIdx] = Math.max(newWidths[neighborIdx] - delta, 1);
    }
    state.setPanelWidths(newWidths);
  };

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

  const onHandlePlaced = (
    panelIdx: number,
    dir: string,
    paneInfo: { rowIndex: number; colIndex: number } | undefined,
  ) => {
    const openingType = state.isSliding ? 'sliding' : 'hinged';
    if (paneInfo) {
      state.setOpeningPanes((prev) => [
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
      state.setOpeningPanels([...state.openingPanels, panelIdx]);
      state.setOpeningDirections({
        ...state.openingDirections,
        [panelIdx]: dir as OpeningDirection,
      });
    }
  };

  const onPanelSplit = (splitMm: number) => {
    const newWidths = [...state.panelWidths];
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
    state.setPanels(newWidths.length);
    state.setPanelWidths(newWidths);
    state.setRemovedSections([]);
  };

  const onPaneRowAdd = (panelIndex: number, splitMm: number) => {
    const existing = state.panelDivisions.find((d) => d.panelIndex === panelIndex);
    const currentRows = existing?.horizontalCount ?? 1;
    if (currentRows >= 4) return;
    const newDivisions = state.panelDivisions.filter((d) => d.panelIndex !== panelIndex);
    newDivisions.push({
      panelIndex,
      horizontalCount: currentRows + 1,
      verticalCount: existing?.verticalCount ?? 1,
    });
    state.setPanelDivisions(newDivisions);
    const existingHeights = state.panelDivisionHeights.find((h) => h.panelIndex === panelIndex);
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
    const newHeights = state.panelDivisionHeights.filter((h) => h.panelIndex !== panelIndex);
    newHeights.push({ panelIndex, rowHeights: newRowHeights });
    state.setPanelDivisionHeights(newHeights);
    state.setRemovedSections([]);
  };

  const onPaneColAdd = (panelIndex: number, splitMm: number) => {
    const existing = state.panelDivisions.find((d) => d.panelIndex === panelIndex);
    const currentCols = existing?.verticalCount ?? 1;
    if (currentCols >= 4) return;
    const newDivisions = state.panelDivisions.filter((d) => d.panelIndex !== panelIndex);
    newDivisions.push({
      panelIndex,
      horizontalCount: existing?.horizontalCount ?? 1,
      verticalCount: currentCols + 1,
    });
    state.setPanelDivisions(newDivisions);
    const panelW = state.panelWidths[panelIndex];
    const existingWidths = state.panelDivisionWidths.find((w) => w.panelIndex === panelIndex);
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
    const newWidthsArr = state.panelDivisionWidths.filter((w) => w.panelIndex !== panelIndex);
    newWidthsArr.push({ panelIndex, colWidths: newColWidths });
    state.setPanelDivisionWidths(newWidthsArr);
    state.setRemovedSections([]);
  };

  const onArcPlaced = (arc: PlacedArc) => setCustomArcs((prev) => [...prev, arc]);

  const onPanelDividerRemove = (idx: number) => {
    const nw = [...state.panelWidths];
    nw.splice(idx, 2, nw[idx] + nw[idx + 1]);
    state.setPanels(nw.length);
    state.setPanelWidths(nw);
    state.setRemovedSections([]);
  };

  const onPaneRowRemove = (pi: number, ri: number) => {
    const ex = state.panelDivisions.find((d) => d.panelIndex === pi);
    if (!ex || ex.horizontalCount <= 1) return;
    const nd = state.panelDivisions.filter((d) => d.panelIndex !== pi);
    nd.push({ panelIndex: pi, horizontalCount: ex.horizontalCount - 1, verticalCount: ex.verticalCount });
    state.setPanelDivisions(nd);
    const eh = state.panelDivisionHeights.find((h) => h.panelIndex === pi);
    if (eh) {
      const rh = [...eh.rowHeights];
      rh.splice(ri, 2, rh[ri] + rh[ri + 1]);
      const nh = state.panelDivisionHeights.filter((h) => h.panelIndex !== pi);
      if (rh.length > 1) nh.push({ panelIndex: pi, rowHeights: rh });
      state.setPanelDivisionHeights(nh);
    }
    state.setRemovedSections([]);
  };

  const onPaneColRemove = (pi: number, ci: number) => {
    const ex = state.panelDivisions.find((d) => d.panelIndex === pi);
    if (!ex || ex.verticalCount <= 1) return;
    const nd = state.panelDivisions.filter((d) => d.panelIndex !== pi);
    nd.push({ panelIndex: pi, horizontalCount: ex.horizontalCount, verticalCount: ex.verticalCount - 1 });
    state.setPanelDivisions(nd);
    const ew = state.panelDivisionWidths.find((w) => w.panelIndex === pi);
    if (ew) {
      const cw = [...ew.colWidths];
      cw.splice(ci, 2, cw[ci] + cw[ci + 1]);
      const nw = state.panelDivisionWidths.filter((w) => w.panelIndex !== pi);
      if (cw.length > 1) nw.push({ panelIndex: pi, colWidths: cw });
      state.setPanelDivisionWidths(nw);
    }
    state.setRemovedSections([]);
  };

  const onPanelOpeningRemove = (pi: number) => {
    state.setOpeningPanels(state.openingPanels.filter((p) => p !== pi));
    const d = { ...state.openingDirections };
    delete d[pi];
    state.setOpeningDirections(d);
  };

  const onPaneOpeningRemove = (pi: number, ri: number, ci: number) => {
    state.setOpeningPanes((prev) =>
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
        state.panels,
        state.panelDivisions,
        state.removedSections,
        proposed,
        state.openingPanels,
        state.openingPanes,
      )
    ) {
      return;
    }
    state.setRemovedSections((prev) => [...prev, proposed]);
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
