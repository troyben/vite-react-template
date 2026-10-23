import type { ProductData, Unit } from '@/components/product-editor/types';
import { GABLE_RISE_RATIO, getShortSideHeight } from '@/components/product-editor/canvas/utils/shape-path';
import type { Material, MaterialCategory } from '@/services/materialService';

export interface CostLineItem {
  material: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export interface CostBreakdown {
  frameItems: CostLineItem[];
  glassItems: CostLineItem[];
  hardwareItems: CostLineItem[];
  accessoryItems: CostLineItem[];
  totalCost: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a dimension from the product's unit to meters.
 */
export function toMeters(value: number, unit: Unit): number {
  switch (unit) {
    case 'mm': return value / 1000;
    case 'cm': return value / 100;
    case 'm': return value;
    default: return value / 1000; // default to mm
  }
}

/**
 * Get materials filtered by category.
 */
export function byCategory(materials: Material[], category: MaterialCategory): Material[] {
  return materials.filter(m => m.category === category);
}

/**
 * Find a material whose properties match a predicate.
 * Among matches, prefer one with isDefault=true.
 * Falls back to first match, then first material in the list.
 */
export function findMaterial(
  materials: Material[],
  predicate: (props: Record<string, any>) => boolean
): Material | undefined {
  const matches = materials.filter(m => m.properties && predicate(m.properties));
  if (matches.length === 0) return materials[0];
  return matches.find(m => m.isDefault) ?? matches[0];
}

// ---------------------------------------------------------------------------
// Frame calculation
// ---------------------------------------------------------------------------

function getOuterPerimeter(product: ProductData): number {
  const w = toMeters(product.width, product.unit);
  const h = toMeters(product.height, product.unit);
  if (product.shape?.type === 'slope-left' || product.shape?.type === 'slope-right') {
    const shortH = toMeters(getShortSideHeight(product.shape, product.height), product.unit);
    return w + h + shortH + Math.hypot(w, h - shortH);
  }
  return 2 * (w + h);
}

export function calculateFrameItems(product: ProductData, materials: Material[]): CostLineItem[] {
  const items: CostLineItem[] = [];
  const frameProfiles = byCategory(materials, 'frame_profile');
  if (frameProfiles.length === 0) return items;

  const wMeters = toMeters(product.width, product.unit);
  const hMeters = toMeters(product.height, product.unit);
  const panels = product.panels || 1;

  // --- Outer frame ---
  const outerFrame = findMaterial(frameProfiles, p => p.profileType === 'outer_frame');
  if (outerFrame) {
    const perimeter = getOuterPerimeter(product);
    items.push({
      material: outerFrame.name,
      category: 'Frame Profile',
      quantity: round(perimeter),
      unit: 'meters',
      unitCost: outerFrame.costPrice,
      total: round(perimeter * outerFrame.costPrice),
    });
  }

  // --- Mullions (vertical panel dividers) ---
  if (panels > 1) {
    const mullion = findMaterial(frameProfiles, p => p.profileType === 'mullion');
    if (mullion) {
      const mullionCount = panels - 1;
      const totalLength = mullionCount * hMeters;
      items.push({
        material: mullion.name,
        category: 'Frame Profile',
        quantity: round(totalLength),
        unit: 'meters',
        unitCost: mullion.costPrice,
        total: round(totalLength * mullion.costPrice),
      });
    }
  }

  // --- Pane dividers (transoms / sub-dividers within panels) ---
  if (product.panelDivisions && product.panelDivisions.length > 0) {
    const transom = findMaterial(frameProfiles, p => p.profileType === 'transom');
    if (transom) {
      let totalTransomLength = 0;

      for (const div of product.panelDivisions) {
        // Each panel's width
        const panelWidth = product.panelWidths && product.panelWidths[div.panelIndex]
          ? toMeters(product.panelWidths[div.panelIndex], product.unit)
          : wMeters / panels;
        const panelHeight = hMeters;

        // Horizontal dividers: (verticalCount - 1) horizontal bars across the panel width
        if (div.verticalCount > 1) {
          totalTransomLength += (div.verticalCount - 1) * panelWidth;
        }
        // Vertical dividers: (horizontalCount - 1) vertical bars across the panel height
        if (div.horizontalCount > 1) {
          totalTransomLength += (div.horizontalCount - 1) * panelHeight;
        }
      }

      if (totalTransomLength > 0) {
        items.push({
          material: transom.name,
          category: 'Frame Profile',
          quantity: round(totalTransomLength),
          unit: 'meters',
          unitCost: transom.costPrice,
          total: round(totalTransomLength * transom.costPrice),
        });
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Glass calculation
// ---------------------------------------------------------------------------

export function calculateGlassItems(product: ProductData, materials: Material[]): CostLineItem[] {
  const items: CostLineItem[] = [];
  const glassMaterials = byCategory(materials, 'glass');
  if (glassMaterials.length === 0) return items;

  const wMeters = toMeters(product.width, product.unit);
  const hMeters = toMeters(product.height, product.unit);

  // Match by glassType from ProductData
  const glassType = product.glassType || 'clear';
  const glass = findMaterial(glassMaterials, p => p.glassType === glassType);
  if (!glass) return items;

  // Simplified: total glass area = width * height (for rectangle)
  // For other shapes this is an approximation.
  let area: number;
  const shape = product.shape?.type || 'rectangle';
  switch (shape) {
    case 'slope-left':
    case 'slope-right': {
      const shortHeight = toMeters(getShortSideHeight(product.shape!, product.height), product.unit);
      area = wMeters * (hMeters + shortHeight) / 2;
      break;
    }
    case 'triangle':
      area = 0.5 * wMeters * hMeters;
      break;
    case 'arch': {
      const archH = product.shape?.archHeight
        ? toMeters(product.shape.archHeight, product.unit)
        : 0;
      // Rectangle + semi-ellipse arch
      area = wMeters * (hMeters - archH) + (Math.PI * (wMeters / 2) * archH) / 2;
      break;
    }
    case 'trapezoid': {
      const topW = product.shape?.topWidth
        ? toMeters(product.shape.topWidth, product.unit)
        : wMeters;
      area = ((wMeters + topW) / 2) * hMeters;
      break;
    }
    case 'gable': {
      // Rectangular walls below the shoulders + triangular apex above them
      const rise = Math.min(
        product.shape?.gableHeight
          ? toMeters(product.shape.gableHeight, product.unit)
          : hMeters * GABLE_RISE_RATIO,
        hMeters,
      );
      area = wMeters * (hMeters - rise) + 0.5 * wMeters * rise;
      break;
    }
    default:
      area = wMeters * hMeters;
  }

  items.push({
    material: glass.name,
    category: 'Glass',
    quantity: round(area),
    unit: 'm\u00B2',
    unitCost: glass.costPrice,
    total: round(area * glass.costPrice),
  });

  return items;
}

// ---------------------------------------------------------------------------
// Hardware calculation
// ---------------------------------------------------------------------------

export function calculateHardwareItems(product: ProductData, materials: Material[]): CostLineItem[] {
  const items: CostLineItem[] = [];
  const hardwareMaterials = byCategory(materials, 'hardware');
  if (hardwareMaterials.length === 0) return items;

  const productType = product.type; // 'door' | 'window'
  const operationType = productType === 'door'
    ? (product.doorType || 'hinged')
    : (product.windowType || 'hinged');
  const isSliding = operationType === 'sliding';
  const isDoor = productType === 'door';

  // Count panel-level openings (use global isSliding for these)
  const openingPanelCount = product.openingPanels?.length ?? 0;

  // Count pane-level openings, separated by type
  let paneHingedCount = 0;
  let paneSlidingCount = 0;
  for (const pane of (product.openingPanes ?? [])) {
    if (pane.openingType === 'sliding') {
      paneSlidingCount++;
    } else {
      paneHingedCount++;
    }
  }

  const totalOpenings = openingPanelCount + paneHingedCount + paneSlidingCount;
  if (totalOpenings === 0) return items;

  // Filter hardware applicable to this product type
  const applicable = hardwareMaterials.filter(m => {
    const applicableTo = m.properties?.applicableTo;
    return !applicableTo || applicableTo === 'both' || applicableTo === productType;
  });

  // Handles: 1 per opening (all types)
  const handleMat = findMaterial(
    applicable.filter(m => m.properties?.hardwareType === 'handle'),
    () => true
  );
  if (handleMat) {
    items.push({
      material: handleMat.name,
      category: 'Hardware',
      quantity: totalOpenings,
      unit: 'pcs',
      unitCost: handleMat.costPrice,
      total: round(totalOpenings * handleMat.costPrice),
    });
  }

  // Hinges: 2 per hinged opening (panel-level hinged + pane-level hinged)
  const hingedCount = (isSliding ? 0 : openingPanelCount) + paneHingedCount;
  if (hingedCount > 0) {
    const hingeMat = findMaterial(
      applicable.filter(m => m.properties?.hardwareType === 'hinge'),
      () => true
    );
    if (hingeMat) {
      const qty = hingedCount * 2;
      items.push({
        material: hingeMat.name,
        category: 'Hardware',
        quantity: qty,
        unit: 'pcs',
        unitCost: hingeMat.costPrice,
        total: round(qty * hingeMat.costPrice),
      });
    }
  }

  // Rollers: 2 per sliding opening (panel-level sliding + pane-level sliding)
  const slidingCount = (isSliding ? openingPanelCount : 0) + paneSlidingCount;
  if (slidingCount > 0) {
    const rollerMat = findMaterial(
      applicable.filter(m => m.properties?.hardwareType === 'roller'),
      () => true
    );
    if (rollerMat) {
      const qty = slidingCount * 2;
      items.push({
        material: rollerMat.name,
        category: 'Hardware',
        quantity: qty,
        unit: 'pcs',
        unitCost: rollerMat.costPrice,
        total: round(qty * rollerMat.costPrice),
      });
    }
  }

  // Lock: 1 per opening panel for doors
  if (isDoor && openingPanelCount > 0) {
    const lockMat = findMaterial(
      applicable.filter(m => m.properties?.hardwareType === 'lock'),
      () => true
    );
    if (lockMat) {
      items.push({
        material: lockMat.name,
        category: 'Hardware',
        quantity: openingPanelCount,
        unit: 'pcs',
        unitCost: lockMat.costPrice,
        total: round(openingPanelCount * lockMat.costPrice),
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Accessory calculation
// ---------------------------------------------------------------------------

export function calculateAccessoryItems(product: ProductData, materials: Material[]): CostLineItem[] {
  const items: CostLineItem[] = [];
  const accessories = byCategory(materials, 'accessory');
  if (accessories.length === 0) return items;

  const productType = product.type;
  const perimeter = getOuterPerimeter(product);

  for (const mat of accessories) {
    // Filter by applicableTo
    const applicableTo = mat.properties?.applicableTo;
    if (applicableTo && applicableTo !== 'both' && applicableTo !== productType) continue;

    if (mat.unit === 'per_meter') {
      // Rubber seals, weatherstrips etc: quantity = perimeter
      items.push({
        material: mat.name,
        category: 'Accessory',
        quantity: round(perimeter),
        unit: 'meters',
        unitCost: mat.costPrice,
        total: round(perimeter * mat.costPrice),
      });
    } else if (mat.unit === 'per_piece') {
      // Fixed-quantity accessories: 1 per product
      items.push({
        material: mat.name,
        category: 'Accessory',
        quantity: 1,
        unit: 'pcs',
        unitCost: mat.costPrice,
        total: round(mat.costPrice),
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Shared arithmetic
// ---------------------------------------------------------------------------

export function sumTotals(items: CostLineItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}
