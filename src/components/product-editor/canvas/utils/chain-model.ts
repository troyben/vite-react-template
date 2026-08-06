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
export function chainToProductData(
  chain: Chain
): Pick<
  ProductData,
  | 'width'
  | 'panels'
  | 'panelWidths'
  | 'panelDivisions'
  | 'panelDivisionHeights'
  | 'panelDivisionWidths'
  | 'openingPanels'
  | 'openingDirections'
  | 'openingPanes'
  | 'removedSections'
  | 'segments'
  | 'connectors'
  | 'rootSegmentIndex'
> {
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

// ---------------------------------------------------------------------------
// Connector deletion cascade logic
//
// When a connector is deleted, everything attached beyond it (away from the
// root segment) is also deleted. This function calculates which segments and
// connectors die.
// ---------------------------------------------------------------------------

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
    // Connector is at or to the right of root: remove everything to the right
    const segmentIndices: number[] = [];
    for (let i = connectorIndex + 1; i < segCount; i++) segmentIndices.push(i);
    const connectorIndices: number[] = [];
    for (let i = connectorIndex; i < connCount; i++) connectorIndices.push(i);
    return { segmentIndices, connectorIndices, newRootIndex: chain.rootIndex };
  }

  // Connector is to the left of root: remove everything to the left
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
