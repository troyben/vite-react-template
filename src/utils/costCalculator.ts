import type { ProductData } from '@/components/product-editor/types';
import type { Material } from '@/services/materialService';
import type { CostBreakdown } from './costCalculatorCore';
import { calculateSegmentCost, calculateChainCost } from './chainCostCalculator';

export type { CostLineItem, CostBreakdown } from './costCalculatorCore';

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Calculate the full cost breakdown for a product based on its configuration
 * and the available materials catalog.
 *
 * Handles missing materials gracefully by skipping categories with no matches.
 *
 * A corner-window chain (2+ segments joined by at least one connector) prices
 * as a single line item: every leg's cost plus one frame item per corner
 * post — see chainCostCalculator.ts. A single-segment product — or a
 * `segments` array with no connectors (the app never emits that combination,
 * see chain-model.ts, but this guards against it defensively) — takes
 * exactly one pass through calculateSegmentCost with the original inputs, so
 * existing costs are unchanged.
 */
export function calculateProductCost(
  product: ProductData,
  materials: Material[]
): CostBreakdown {
  const segments = product.segments;
  const connectors = product.connectors ?? [];
  if (!segments || segments.length <= 1 || connectors.length === 0) {
    return calculateSegmentCost(product, materials);
  }

  return calculateChainCost(product, materials);
}
