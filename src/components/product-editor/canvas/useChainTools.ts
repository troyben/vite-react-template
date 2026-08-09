// ---------------------------------------------------------------------------
// The canvas tools, per leg of a chain.
//
// The flat path runs handle/line/arc/erase against one shape in one local draw
// space. A chain has several, each behind its own transform. Rather than grow a
// second set of tools, this hook finds the leg under the pointer, converts the
// point into that leg's local space, and calls exactly the same helpers the
// flat path calls -- so a chained leg behaves like an unchained window.
//
// Tools act on the leg that was clicked, not the leg that happens to be
// selected. Selecting first would not work: the new selection is not readable
// until the next render, so the edit would still land on the previous leg.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from 'react';
import type { ShapeConfig } from '@/components/product-editor/types';
import type { Point } from './utils/types';
import type { Chain } from './utils/chain-model';
import type { ChainLayout } from './utils/chain-projection';
import type { CanvasTool, PlacedArc } from './utils/canvas-tools';
import type { CanvasGeometry } from './utils/tool-interactions';
import type { RemoveContext, RemovableItem } from './utils/remove-tools';
import {
  findPanelAtPoint,
  getDirectionFromPosition,
  computeLinePreview,
  computeArcPlacement,
} from './utils/tool-interactions';
import { findRemovableAtPoint, findSameKindAtPoint } from './utils/remove-tools';
import { screenToLegLocal, legAtPoint, legGeometry, legRemoveContext, legShape } from './utils/chain-interaction';

/** The canvas-facing callbacks, already bound to one leg by the caller. */
export interface SegmentToolHandlers {
  onHandlePlaced?: (panelIndex: number, direction: 'left' | 'right' | 'top' | 'bottom', paneInfo?: { rowIndex: number; colIndex: number }) => void;
  onPanelSplit?: (splitPositionMm: number) => void;
  onPaneRowAdd?: (panelIndex: number, splitPositionMm: number) => void;
  onPaneColAdd?: (panelIndex: number, splitPositionMm: number) => void;
  onArcPlaced?: (arc: PlacedArc) => void;
  onPanelDividerRemove?: (dividerIndex: number) => void;
  onPaneRowRemove?: (panelIndex: number, rowDividerIndex: number) => void;
  onPaneColRemove?: (panelIndex: number, colDividerIndex: number) => void;
  onPanelOpeningRemove?: (panelIndex: number) => void;
  onPaneOpeningRemove?: (panelIndex: number, rowIndex: number, colIndex: number) => void;
  onArcRemove?: (arcId: string) => void;
  onSectionRemove?: (panelIndex: number, rowIndex: number, colIndex: number) => void;
  onWidthChange?: (newWidth: number) => void;
  onPanelWidthChange?: (panelIndex: number, newWidth: number) => void;
  onRowHeightChange?: (panelIndex: number, rowIndex: number, newHeight: number) => void;
}

/** A pointer position resolved to one leg and that leg's own coordinates. */
export interface LegPoint {
  legIndex: number;
  local: Point;
}

export interface ChainToolsInput {
  chain: Chain;
  shape: ShapeConfig;
  layout: ChainLayout;
  heightMm: number;
  activeTool?: CanvasTool;
  lineOrientation: 'horizontal' | 'vertical';
  lineTarget: 'panel' | 'pane';
  customArcs?: PlacedArc[];
  /** Callbacks bound to a given leg. Omitted on read-only canvases. */
  segmentTools?: (segmentIndex: number) => SegmentToolHandlers;
}

export function useChainTools(input: ChainToolsInput) {
  const {
    chain, shape, layout, heightMm, activeTool,
    lineOrientation, lineTarget, customArcs, segmentTools,
  } = input;

  const [hover, setHover] = useState<LegPoint | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ legIndex: number; item: RemovableItem } | null>(null);
  const [sameKindTarget, setSameKindTarget] = useState<{ legIndex: number; item: RemovableItem } | null>(null);

  const geometryFor = useCallback((i: number): CanvasGeometry => legGeometry({
    segment: chain.segments[i],
    shape: legShape(shape, i, chain.rootIndex),
    drawW: layout.segments[i].drawW,
    drawH: layout.drawH,
    heightMm,
  }), [chain, shape, layout, heightMm]);

  const removeContextFor = useCallback((i: number): RemoveContext => legRemoveContext({
    segment: chain.segments[i],
    shape: legShape(shape, i, chain.rootIndex),
    drawW: layout.segments[i].drawW,
    drawH: layout.drawH,
    heightMm,
    // Arcs are a root-leg concept: they live in the editor's flat state, and
    // attached legs are always plain rectangles.
  }, i === chain.rootIndex ? (customArcs ?? []) : []), [chain, shape, layout, heightMm, customArcs]);

  /** Resolve a point in chain draw space to a leg and that leg's coordinates. */
  const resolve = useCallback((p: Point): LegPoint | null => {
    const legIndex = legAtPoint(layout, p);
    if (legIndex == null) return null;
    const local = screenToLegLocal(layout.segments[legIndex].matrix, p);
    return local ? { legIndex, local } : null;
  }, [layout]);

  const handlePointerMove = useCallback((p: Point) => {
    if (!activeTool || activeTool === 'connector') {
      setHover(null);
      setRemoveTarget(null);
      setSameKindTarget(null);
      return;
    }
    const at = resolve(p);
    setHover(at);
    if (!at) {
      setRemoveTarget(null);
      setSameKindTarget(null);
      return;
    }
    if (activeTool === 'remove') {
      const item = findRemovableAtPoint(removeContextFor(at.legIndex), at.local.x, at.local.y);
      setRemoveTarget(item ? { legIndex: at.legIndex, item } : null);
      setSameKindTarget(null);
      return;
    }
    const same = findSameKindAtPoint(removeContextFor(at.legIndex), at.local.x, at.local.y, activeTool, lineTarget);
    setSameKindTarget(same ? { legIndex: at.legIndex, item: same } : null);
    setRemoveTarget(null);
  }, [activeTool, resolve, removeContextFor, lineTarget]);

  const clearHover = useCallback(() => {
    setHover(null);
    setRemoveTarget(null);
    setSameKindTarget(null);
  }, []);

  const dispatchRemoval = useCallback((legIndex: number, item: RemovableItem) => {
    const t = segmentTools?.(legIndex);
    if (!t) return;
    switch (item.type) {
      case 'panel-divider': t.onPanelDividerRemove?.(item.dividerIndex); break;
      case 'pane-row-divider': t.onPaneRowRemove?.(item.panelIndex, item.rowDividerIndex); break;
      case 'pane-col-divider': t.onPaneColRemove?.(item.panelIndex, item.colDividerIndex); break;
      case 'panel-opening': t.onPanelOpeningRemove?.(item.panelIndex); break;
      case 'pane-opening': t.onPaneOpeningRemove?.(item.panelIndex, item.rowIndex, item.colIndex); break;
      case 'arc': t.onArcRemove?.(item.arcId); break;
      case 'section': t.onSectionRemove?.(item.panelIndex, item.rowIndex, item.colIndex); break;
    }
  }, [segmentTools]);

  /**
   * Run the active tool at a point. Returns true when the tool consumed the
   * click, so the caller knows not to also treat it as a selection.
   */
  const handleToolClick = useCallback((p: Point): boolean => {
    if (!activeTool || activeTool === 'connector') return false;
    const at = resolve(p);
    if (!at) return false;
    const { legIndex, local } = at;
    const t = segmentTools?.(legIndex);
    if (!t) return false;
    const geo = geometryFor(legIndex);

    if (activeTool === 'handle' && t.onHandlePlaced) {
      const hit = findPanelAtPoint(geo, local.x, local.y);
      if (!hit) return false;
      if (hit.paneInfo) {
        const { paneInfo } = hit;
        const dir = getDirectionFromPosition(
          local.x, local.y,
          paneInfo.paneCx - paneInfo.paneW / 2,
          paneInfo.paneCy - paneInfo.paneH / 2,
          paneInfo.paneW, paneInfo.paneH,
        );
        t.onHandlePlaced(hit.panelIndex, dir, { rowIndex: paneInfo.rowIndex, colIndex: paneInfo.colIndex });
      } else {
        const dir = getDirectionFromPosition(
          local.x, local.y,
          hit.panelCx - hit.panelW / 2,
          hit.panelCy - hit.panelH / 2,
          hit.panelW, hit.panelH,
        );
        t.onHandlePlaced(hit.panelIndex, dir);
      }
      return true;
    }

    if (activeTool === 'line') {
      const preview = computeLinePreview(geo, local.x, local.y, lineOrientation, lineTarget);
      if (!preview) return false;
      if (lineTarget === 'panel' && t.onPanelSplit) {
        t.onPanelSplit(preview.realX);
        return true;
      }
      if (lineTarget === 'pane' && preview.panelIndex >= 0) {
        if (lineOrientation === 'horizontal' && t.onPaneRowAdd && preview.topDim != null) {
          t.onPaneRowAdd(preview.panelIndex, preview.topDim);
          return true;
        }
        if (lineOrientation === 'vertical' && t.onPaneColAdd && preview.leftDim != null) {
          t.onPaneColAdd(preview.panelIndex, preview.leftDim);
          return true;
        }
      }
      return false;
    }

    if (activeTool === 'arc' && t.onArcPlaced) {
      const arc = computeArcPlacement(geo, local.x, local.y);
      if (arc) {
        t.onArcPlaced(arc);
        return true;
      }
      return false;
    }

    if (activeTool === 'remove' && removeTarget) {
      dispatchRemoval(removeTarget.legIndex, removeTarget.item);
      setRemoveTarget(null);
      return true;
    }

    return false;
  }, [activeTool, resolve, segmentTools, geometryFor, lineOrientation, lineTarget, removeTarget, dispatchRemoval]);

  /** Right-click removes every item of the same kind under the pointer. */
  const handleContextMenu = useCallback((p: Point): boolean => {
    if (!activeTool || activeTool === 'remove' || activeTool === 'connector') return false;
    const at = resolve(p);
    if (!at) return false;
    const item = findSameKindAtPoint(removeContextFor(at.legIndex), at.local.x, at.local.y, activeTool, lineTarget);
    if (!item) return false;
    dispatchRemoval(at.legIndex, item);
    setSameKindTarget(null);
    return true;
  }, [activeTool, resolve, removeContextFor, lineTarget, dispatchRemoval]);

  const cursor = useMemo(() => {
    if (!activeTool) return undefined;
    if (activeTool === 'remove') return removeTarget ? 'pointer' : 'crosshair';
    if (sameKindTarget) return 'pointer';
    return 'crosshair';
  }, [activeTool, removeTarget, sameKindTarget]);

  return {
    hover,
    removeTarget,
    sameKindTarget,
    cursor,
    geometryFor,
    removeContextFor,
    handlePointerMove,
    clearHover,
    handleToolClick,
    handleContextMenu,
  };
}
