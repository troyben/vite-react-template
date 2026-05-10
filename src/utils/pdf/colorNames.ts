// ---------------------------------------------------------------------------
// Color-name resolution for product descriptions.
//
// In the on-screen canvas users pick colors (frame color, glass tint). Both
// the editable web description (utils/productDescription.ts) and the PDF
// (which simply prints whatever description text exists) need human-readable
// names for those choices. This module owns that mapping.
// ---------------------------------------------------------------------------

import type { GlassType } from '../../components/product-editor/types';

// -- Frame swatches shown in AppearanceTab ----------------------------------
//    Keep this list aligned with components/product-editor/tabs/AppearanceTab.tsx
const FRAME_COLOR_NAMES: Record<string, string> = {
  '#C0C0C0': 'Silver',
  '#4F4F4F': 'Charcoal',
  '#CD7F32': 'Bronze',
};

const GLASS_TYPE_NAMES: Record<GlassType, string> = {
  'clear': 'Clear',
  'frosted': 'Frosted',
  'custom-tint': 'Custom Tint',
};

/** Returns a human-readable name for a frame hex; falls back to the hex. */
export function getFrameColorName(hex?: string): string {
  if (!hex) return 'Silver';
  const key = hex.toUpperCase();
  return FRAME_COLOR_NAMES[key] ?? FRAME_COLOR_NAMES[hex] ?? approximateColorName(hex);
}

/** Human-readable glass type label. */
export function getGlassTypeName(glass?: GlassType): string {
  if (!glass) return 'Clear';
  return GLASS_TYPE_NAMES[glass] ?? glass;
}

// ---------------------------------------------------------------------------
// Nearest-name approximation for arbitrary hex inputs (custom tints).
// Small palette — enough to give the reader a sense of the chosen tint.
// ---------------------------------------------------------------------------

const NAMED_PALETTE: Array<{ name: string; rgb: [number, number, number] }> = [
  { name: 'Black',       rgb: [0, 0, 0] },
  { name: 'White',       rgb: [255, 255, 255] },
  { name: 'Grey',        rgb: [128, 128, 128] },
  { name: 'Light Grey',  rgb: [200, 200, 200] },
  { name: 'Dark Grey',   rgb: [70, 70, 70] },
  { name: 'Silver',      rgb: [192, 192, 192] },
  { name: 'Charcoal',    rgb: [79, 79, 79] },
  { name: 'Bronze',      rgb: [205, 127, 50] },
  { name: 'Red',         rgb: [220, 30, 30] },
  { name: 'Orange',      rgb: [240, 140, 30] },
  { name: 'Yellow',      rgb: [240, 210, 50] },
  { name: 'Green',       rgb: [50, 170, 80] },
  { name: 'Teal',        rgb: [60, 180, 175] },
  { name: 'Blue',        rgb: [50, 110, 220] },
  { name: 'Light Blue',  rgb: [170, 210, 240] },
  { name: 'Navy',        rgb: [25, 40, 95] },
  { name: 'Purple',      rgb: [130, 70, 180] },
  { name: 'Pink',        rgb: [240, 150, 180] },
  { name: 'Brown',       rgb: [120, 75, 40] },
  { name: 'Beige',       rgb: [225, 200, 165] },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').trim();
  if (m.length !== 6 && m.length !== 3) return null;
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Returns the closest named color for an arbitrary hex; fallback = the hex itself. */
export function approximateColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let best = NAMED_PALETTE[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const candidate of NAMED_PALETTE) {
    const [r, g, b] = candidate.rgb;
    const dr = r - rgb[0];
    const dg = g - rgb[1];
    const db = b - rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best.name;
}
