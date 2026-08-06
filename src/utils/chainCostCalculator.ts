// ---------------------------------------------------------------------------
// Corner-window chains
//
// A chain is several window/door "legs" (segments) joined at angles by
// aluminium corner posts (connectors). It prices as ONE quotation line item:
// each leg is costed independently, as if it were its own single-unit
// product, then summed — plus one frame line item per corner post.
//
// This module only handles the chain case. costCalculator.ts's
// calculateProductCost decides whether a product is a chain at all and
// calls in here only once that's established.
// ---------------------------------------------------------------------------

import type { ProductData } from '@/components/product-editor/types';
import type { Material } from '@/services/materialService';
import {
  type CostBreakdown,
  type CostLineItem,
  calculateFrameItems,
  calculateGlassItems,
  calculateHardwareItems,
  calculateAccessoryItems,
  byCategory,
  findMaterial,
  toMeters,
  sumTotals,
  round,
} from './costCalculatorCore';

/**
 * Cost of one flat unit. This is the original calculation, unchanged, run
 * once per leg of a chain (and once, directly, for single-unit products —
 * see costCalculator.ts).
 */
export function calculateSegmentCost(product: ProductData, materials: Material[]): CostBreakdown {
  const frameItems = calculateFrameItems(product, materials);
  const glassItems = calculateGlassItems(product, materials);
  const hardwareItems = calculateHardwareItems(product, materials);
  const accessoryItems = calculateAccessoryItems(product, materials);

  const totalCost =
    sumTotals(frameItems) +
    sumTotals(glassItems) +
    sumTotals(hardwareItems) +
    sumTotals(accessoryItems);

  return {
    frameItems,
    glassItems,
    hardwareItems,
    accessoryItems,
    totalCost: round(totalCost),
  };
}

/**
 * Flatten one segment into a standalone single-unit ProductData so it can be
 * run through the original per-unit calculation.
 *
 * Every per-leg field comes from the segment itself, defaulting to "none"
 * rather than falling back to the root product's fields — a leg with no
 * panelDivisions of its own must not inherit the root's and inflate its
 * glass or hardware count.
 *
 * `shape` is the one field that needs special handling: ChainCanvas only
 * ever draws the root segment (product.rootSegmentIndex, default 0) with the
 * product's real shape — every attached leg renders as a plain rectangle.
 * Costing mirrors that, or a non-rectangular root (e.g. an arch) would leak
 * its glass-area formula into legs that are drawn as rectangles.
 */
function segmentAsProduct(product: ProductData, index: number): ProductData {
  const s = product.segments?.[index];
  if (!s) return product;
  const isRoot = index === (product.rootSegmentIndex ?? 0);
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
    shape: isRoot ? product.shape : { type: 'rectangle' },
    segments: undefined,
    connectors: undefined,
    rootSegmentIndex: undefined,
  };
}

/**
 * Corner posts, priced as vertical frame extrusion — the same profile
 * material used for the outer frame (byCategory 'frame_profile').
 */
function calculatePostItems(product: ProductData, materials: Material[]): CostLineItem[] {
  const connectors = product.connectors ?? [];
  if (connectors.length === 0) return [];

  const frameProfiles = byCategory(materials, 'frame_profile');
  if (frameProfiles.length === 0) return [];
  const material = findMaterial(frameProfiles, p => p.profileType === 'outer_frame');
  if (!material) return [];

  const heightM = toMeters(product.height, product.unit || 'mm');
  return connectors.map((c, i) => {
    const quantity = round(heightM);
    return {
      material: `Corner Post ${i + 1} (${c.postWidth}mm @ ${c.angle}°) — ${material.name}`,
      category: 'Frame Profile',
      quantity,
      unit: 'meters',
      unitCost: material.costPrice,
      total: round(quantity * material.costPrice),
    };
  });
}

/**
 * Cost of a corner-window chain: every leg's cost (each run through
 * calculateSegmentCost as its own standalone single-unit product) plus one
 * frame line item per corner post.
 *
 * Callers must have already established this product IS a chain — see the
 * guard in costCalculator.ts's calculateProductCost. This function assumes
 * `product.segments` has at least 2 entries.
 */
export function calculateChainCost(product: ProductData, materials: Material[]): CostBreakdown {
  const segments = product.segments ?? [];
  const perSegment = segments.map((_, i) => calculateSegmentCost(segmentAsProduct(product, i), materials));
  const postItems = calculatePostItems(product, materials);

  const frameItems = [...perSegment.flatMap(b => b.frameItems), ...postItems];
  const glassItems = perSegment.flatMap(b => b.glassItems);
  const hardwareItems = perSegment.flatMap(b => b.hardwareItems);
  const accessoryItems = perSegment.flatMap(b => b.accessoryItems);

  const totalCost =
    sumTotals(frameItems) +
    sumTotals(glassItems) +
    sumTotals(hardwareItems) +
    sumTotals(accessoryItems);

  return {
    frameItems,
    glassItems,
    hardwareItems,
    accessoryItems,
    totalCost: round(totalCost),
  };
}
