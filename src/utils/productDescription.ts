// ---------------------------------------------------------------------------
// Canonical description text for a product sketch.
//
// This single helper drives both:
//   - the auto-filled description shown in the quotation form's web UI, and
//   - (transitively) the description text rendered in the PDF.
//
// The PDF NEVER auto-generates its own text any more — it just prints whatever
// the user has in `item.description`. So whatever this helper produces is what
// the user sees on screen, can edit in the textarea, and what shows up in
// the exported PDF.
// ---------------------------------------------------------------------------

import type { OpeningDirection, ProductData } from '../components/product-editor/types';
import { getFrameColorName, getGlassTypeName, approximateColorName } from './pdf/colorNames';

/**
 * Build a deduped, human-readable list of opening kinds present in a sketch.
 *
 * Hinged sub-types (Casement In, Casement Out, Tilt & Turn) all share the
 * same dasharray when colors are stripped in the B&W PDF, so this text
 * label is what tells them apart.
 */
export function summarizeOpeningTypes(sketch: ProductData): string {
  const labels = new Set<string>();

  const directionLabel = (dir?: OpeningDirection): string | null => {
    switch (dir) {
      case 'left':   return 'Hinged (Left)';
      case 'right':  return 'Hinged (Right)';
      case 'top':    return 'Hinged (Top)';
      case 'bottom': return 'Hinged (Bottom)';
      default:       return null;
    }
  };

  const addOpening = (
    openingType: 'hinged' | 'sliding' | undefined,
    direction: OpeningDirection | undefined,
  ) => {
    if (openingType === 'sliding') {
      labels.add('Sliding');
      return;
    }
    const dirLabel = directionLabel(direction);
    if (dirLabel) {
      labels.add(dirLabel);
    } else if (openingType === 'hinged') {
      labels.add('Hinged');
    }
  };

  if (sketch.openingPanes && sketch.openingPanes.length > 0) {
    for (const pane of sketch.openingPanes) {
      addOpening(pane.openingType, pane.openingDirection);
    }
  } else if (sketch.openingPanels && sketch.openingPanels.length > 0) {
    const fallbackType = sketch.doorType ?? sketch.windowType;
    for (const panelIndex of sketch.openingPanels) {
      const dir = sketch.openingDirections?.[panelIndex];
      addOpening(fallbackType, dir);
    }
  }

  if (labels.size === 0) return '';
  return Array.from(labels).join(', ');
}

/**
 * Build the canonical description text for a product sketch. Lines are joined
 * with newlines so they wrap nicely both in the web textarea and in the PDF
 * description column.
 *
 * Lines (in order):
 *   1. {width} x {height} {unit}
 *   2. Glass: {type}
 *   3. Frame: {color name}
 *   4. Opens: {comma-separated opening kinds}   (omitted when there are none)
 */
export function buildSketchDescription(data: ProductData): string {
  const lines: string[] = [];

  lines.push(`${data.width} x ${data.height} ${data.unit}`);

  if (data.glassType) {
    if (data.glassType === 'custom-tint' && data.customGlassTint) {
      lines.push(`Glass: Custom Tint (${approximateColorName(data.customGlassTint)})`);
    } else {
      lines.push(`Glass: ${getGlassTypeName(data.glassType)}`);
    }
  }

  if (data.frameColor) {
    lines.push(`Frame: ${getFrameColorName(data.frameColor)}`);
  }

  const openings = summarizeOpeningTypes(data);
  if (openings) {
    lines.push(`Opens: ${openings}`);
  }

  return lines.join('\n');
}
