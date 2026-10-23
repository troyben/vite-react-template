// ---------------------------------------------------------------------------
// Edge-to-commit-function mapper: determines the correct editing callback
// for a given edge based on the shape type and the edge's real-world vertices.
// ---------------------------------------------------------------------------

import type { ShapeConfig } from '@/components/product-editor/types';
import type { Point } from './types';
import { realEdgeLength } from './geometry';
import { getGableRise } from './shape-path';

export interface EdgeCommitContext {
  shape: ShapeConfig;
  width: number;
  height: number;
  onWidthChange?: (v: number) => void;
  onHeightChange?: (v: number) => void;
  onShapeConfigChange?: (updates: Partial<ShapeConfig>) => void;
}

/**
 * For simple shapes (rectangle), horizontal => width, vertical => height.
 * For complex shapes (l-shape, trapezoid), edges may control cutoutWidth,
 * cutoutHeight, topWidth, or partial dimensions.
 * Returns null if the edge is not directly editable (e.g. diagonals).
 */
export function getEdgeCommitFn(
  ctx: EdgeCommitContext,
  rv1: Point,
  rv2: Point,
): ((newLen: number) => void) | null {
  const { shape, width, height, onWidthChange, onHeightChange, onShapeConfigChange } = ctx;
  const len = Math.round(realEdgeLength(rv1, rv2));
  const isHoriz = Math.abs(rv1.y - rv2.y) < 0.5;
  const isVert = Math.abs(rv1.x - rv2.x) < 0.5;

  switch (shape.type) {
    case 'rectangle':
      if (isHoriz && onWidthChange) return onWidthChange;
      if (isVert && onHeightChange) return onHeightChange;
      return null;

    case 'l-shape': {
      const cutW = shape.cutoutWidth ?? width * 0.4;
      const cutH = shape.cutoutHeight ?? height * 0.4;

      // Full height edge (length === h)
      if (isVert && Math.abs(len - height) < 1 && onHeightChange) return onHeightChange;
      // Full width edge (length === w)
      if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;

      // cutoutHeight edge (length === cutH)
      if (isVert && Math.abs(len - Math.round(cutH)) < 1 && onShapeConfigChange) {
        return (v) => onShapeConfigChange({ cutoutHeight: v });
      }
      // cutoutWidth edge (length === cutW)
      if (isHoriz && Math.abs(len - Math.round(cutW)) < 1 && onShapeConfigChange) {
        return (v) => onShapeConfigChange({ cutoutWidth: v });
      }
      // Partial height edge (length === h - cutH)
      if (isVert && Math.abs(len - Math.round(height - cutH)) < 1 && onShapeConfigChange) {
        return (v) => onShapeConfigChange({ cutoutHeight: height - v });
      }
      // Partial width edge (length === w - cutW)
      if (isHoriz && Math.abs(len - Math.round(width - cutW)) < 1 && onShapeConfigChange) {
        return (v) => onShapeConfigChange({ cutoutWidth: width - v });
      }
      return null;
    }

    case 'trapezoid': {
      const topW = shape.topWidth ?? width * 0.6;
      // Top edge = topWidth
      if (isHoriz && Math.abs(len - Math.round(topW)) < 1 && onShapeConfigChange) {
        return (v) => onShapeConfigChange({ topWidth: v });
      }
      // Bottom edge = full width
      if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;
      // Diagonal edges -- too complex (function of topWidth + height), skip
      return null;
    }

    case 'slope-left':
    case 'slope-right': {
      if (isHoriz && onWidthChange) return onWidthChange;
      if (!isVert) return null;
      const tallX = shape.type === 'slope-left' ? 0 : width;
      if (Math.abs(rv1.x - tallX) < 0.5) return onHeightChange ?? null;
      if (onShapeConfigChange) return (v) => onShapeConfigChange({ shortSideHeight: v });
      return null;
    }

    case 'arch':
      // Arch dimensions are handled separately in Layer 5b
      if (isHoriz && onWidthChange) return onWidthChange;
      if (isVert && onHeightChange) return onHeightChange;
      return null;

    case 'triangle':
      // Bottom edge = full width
      if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;
      // Diagonal edges are complex -- skip
      return null;

    case 'gable': {
      // Bottom edge = full width
      if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;
      // Vertical side = side-wall height (total height minus apex rise). Editing it
      // pins the current rise and grows/shrinks the overall height to match.
      const rise = Math.round(getGableRise(shape, height));
      if (isVert && Math.abs(len - (height - rise)) < 1 && onHeightChange) {
        return (v) => {
          onShapeConfigChange?.({ gableHeight: rise });
          onHeightChange(v + rise);
        };
      }
      // Rafters (diagonals) are derived from width/rise/apex position -- skip
      return null;
    }

    case 'pentagon':
    case 'hexagon':
      // Edges are proportional to w/h -- too complex for simple inline editing, skip
      return null;

    default:
      if (isHoriz && onWidthChange) return onWidthChange;
      if (isVert && onHeightChange) return onHeightChange;
      return null;
  }
}
