// ---------------------------------------------------------------------------
// Tool interaction helpers: panel/pane hit detection, direction computation,
// line preview, and arc placement for the canvas drawing tools.
// ---------------------------------------------------------------------------

import type { ShapeConfig } from '@/components/product-sketch/types';
import type { Point } from './types';
import { MARGIN } from './types';
import { getPanelCenter } from './panels';
import { getRowTopFrac, getRowBottomFrac, getColLeftFrac, getColRightFrac } from './pane-fractions';
import type { PlacedArc } from './canvas-tools';
import { svgToReal, realToSvg, snapToGrid, generateId } from './canvas-tools';

// ---------------------------------------------------------------------------
// Geometry context shared by tool interaction functions
// ---------------------------------------------------------------------------

export interface CanvasGeometry {
  panels: number;
  panelWidths: number[];
  svgVerts: Point[];
  drawW: number;
  drawH: number;
  width: number;
  height: number;
  shape: ShapeConfig;
  panelDivisions?: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
}

// ---------------------------------------------------------------------------
// Panel / pane hit detection
// ---------------------------------------------------------------------------

export interface PanelHitResult {
  panelIndex: number;
  panelCx: number;
  panelCy: number;
  panelW: number;
  panelH: number;
  paneInfo?: {
    rowIndex: number;
    colIndex: number;
    paneCx: number;
    paneCy: number;
    paneW: number;
    paneH: number;
  };
}

/** Find which panel (and optionally pane) the hover position falls within */
export function findPanelAtPoint(geo: CanvasGeometry, px: number, py: number): PanelHitResult | null {
  const { panels, panelWidths, svgVerts, drawW, drawH, width, height, shape, panelDivisions, panelDivisionHeights, panelDivisionWidths } = geo;

  for (let i = 0; i < panels; i++) {
    const { cx, cy, w: pw, h: ph } = getPanelCenter(
      shape, i, panels, panelWidths, svgVerts,
      drawW, drawH, width, height,
    );
    const panelLeft = cx - pw / 2;
    const panelRight = cx + pw / 2;
    const panelTop = cy - ph / 2;
    const panelBottom = cy + ph / 2;

    if (px >= panelLeft && px <= panelRight && py >= panelTop && py <= panelBottom) {
      // Check if within a subdivided pane
      const div = panelDivisions?.find((d) => d.panelIndex === i);
      if (div && (div.horizontalCount > 1 || div.verticalCount > 1)) {
        for (let r = 0; r < div.horizontalCount; r++) {
          const rowTopFrac = getRowTopFrac(panelDivisionHeights, i, r, div.horizontalCount);
          const rowBottomFrac = getRowBottomFrac(panelDivisionHeights, i, r, div.horizontalCount);
          const paneTop = panelTop + rowTopFrac * ph;
          const paneBottom = panelTop + rowBottomFrac * ph;
          const paneH = paneBottom - paneTop;
          for (let c = 0; c < div.verticalCount; c++) {
            const colLeftFrac = getColLeftFrac(panelDivisionWidths, i, c, div.verticalCount);
            const colRightFrac = getColRightFrac(panelDivisionWidths, i, c, div.verticalCount);
            const paneLeft = panelLeft + colLeftFrac * pw;
            const paneRight = panelLeft + colRightFrac * pw;
            const paneW = paneRight - paneLeft;
            if (px >= paneLeft && px <= paneRight && py >= paneTop && py <= paneBottom) {
              return {
                panelIndex: i,
                panelCx: cx, panelCy: cy, panelW: pw, panelH: ph,
                paneInfo: {
                  rowIndex: r,
                  colIndex: c,
                  paneCx: paneLeft + paneW / 2,
                  paneCy: paneTop + paneH / 2,
                  paneW,
                  paneH,
                },
              };
            }
          }
        }
      }
      return { panelIndex: i, panelCx: cx, panelCy: cy, panelW: pw, panelH: ph };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Direction from mouse position
// ---------------------------------------------------------------------------

/** Determine opening direction from mouse position within a bounding box */
export function getDirectionFromPosition(
  px: number, py: number,
  left: number, top: number, w: number, h: number,
): 'left' | 'right' | 'top' | 'bottom' {
  // The direction is the OPENING direction (where the window swings toward).
  // The handle knob is placed on the OPPOSITE side of the opening direction.
  // User expects: cursor on left -> handle on left -> opening direction = 'right'.
  const relX = (px - left) / w;
  const relY = (py - top) / h;
  const distFromCenterX = Math.abs(relX - 0.5);
  const distFromCenterY = Math.abs(relY - 0.5);
  if (distFromCenterX > distFromCenterY) {
    return relX > 0.5 ? 'left' : 'right';
  }
  return relY > 0.5 ? 'top' : 'bottom';
}

// ---------------------------------------------------------------------------
// Line preview computation
// ---------------------------------------------------------------------------

export interface LinePreview {
  x1: number; y1: number; x2: number; y2: number;
  realX: number; panelIndex: number;
  leftDim?: number; rightDim?: number;
  topDim?: number; bottomDim?: number;
}

/**
 * Compute preview line coordinates for the line tool.
 * Panel mode: vertical line spanning the full frame height at the snapped X.
 * Pane mode: line within the hovered panel bounds.
 */
export function computeLinePreview(
  geo: CanvasGeometry,
  hx: number,
  hy: number,
  lineOrientation: 'horizontal' | 'vertical',
  lineTarget: 'panel' | 'pane',
): LinePreview | null {
  const { drawW, drawH, width, height, panelWidths } = geo;
  const { realX } = svgToReal(hx, hy, MARGIN, drawW, drawH, width, height);

  if (lineTarget === 'panel') {
    // Panel mode: vertical only, full frame height
    const snappedRealX = snapToGrid(realX);
    const { svgX: snappedSvgX } = realToSvg(snappedRealX, 0, MARGIN, drawW, drawH, width, height);
    const frameLeft = MARGIN;
    const frameRight = MARGIN + drawW;
    const frameTop = MARGIN;
    const frameBottom = MARGIN + drawH;
    const clampedX = Math.max(frameLeft + 1, Math.min(frameRight - 1, snappedSvgX));
    const { realX: clampedRealX } = svgToReal(clampedX, frameTop, MARGIN, drawW, drawH, width, height);

    // Compute what the split dimensions would be
    let leftDim = 0, rightDim = 0;
    let accumulated = 0;
    for (let i = 0; i < panelWidths.length; i++) {
      if (accumulated + panelWidths[i] >= clampedRealX) {
        leftDim = Math.round(clampedRealX - accumulated);
        rightDim = Math.round(panelWidths[i] - leftDim);
        break;
      }
      accumulated += panelWidths[i];
    }

    return {
      x1: clampedX, y1: frameTop,
      x2: clampedX, y2: frameBottom,
      realX: clampedRealX,
      panelIndex: -1,
      leftDim, rightDim,
    };
  }

  // Pane mode: line within the hovered panel
  const hit = findPanelAtPoint(geo, hx, hy);
  if (!hit) return null;

  const { panelCx: cx, panelCy: cy, panelW: pw, panelH: ph } = hit;
  const panelLeft = cx - pw / 2;
  const panelRight = cx + pw / 2;
  const panelTop = cy - ph / 2;
  const panelBottom = cy + ph / 2;
  const { realX: realX2, realY } = svgToReal(hx, hy, MARGIN, drawW, drawH, width, height);

  if (lineOrientation === 'horizontal') {
    const snappedRealY = snapToGrid(realY);
    const { svgY: snappedSvgY } = realToSvg(0, snappedRealY, MARGIN, drawW, drawH, width, height);
    const clampedY = Math.max(panelTop + 1, Math.min(panelBottom - 1, snappedSvgY));
    const { realY: clampedRealY } = svgToReal(panelLeft, clampedY, MARGIN, drawW, drawH, width, height);
    const { realY: panelTopReal } = svgToReal(panelLeft, panelTop, MARGIN, drawW, drawH, width, height);
    const { realY: panelBottomReal } = svgToReal(panelLeft, panelBottom, MARGIN, drawW, drawH, width, height);
    return {
      x1: panelLeft, y1: clampedY,
      x2: panelRight, y2: clampedY,
      realX: realX2,
      panelIndex: hit.panelIndex,
      topDim: Math.round(clampedRealY - panelTopReal),
      bottomDim: Math.round(panelBottomReal - clampedRealY),
    };
  } else {
    const snappedRealX = snapToGrid(realX2);
    const { svgX: snappedSvgX } = realToSvg(snappedRealX, 0, MARGIN, drawW, drawH, width, height);
    const clampedX = Math.max(panelLeft + 1, Math.min(panelRight - 1, snappedSvgX));
    const { realX: clampedRealX } = svgToReal(clampedX, panelTop, MARGIN, drawW, drawH, width, height);
    const { realX: panelLeftReal } = svgToReal(panelLeft, panelTop, MARGIN, drawW, drawH, width, height);
    const { realX: panelRightReal } = svgToReal(panelRight, panelTop, MARGIN, drawW, drawH, width, height);
    return {
      x1: clampedX, y1: panelTop,
      x2: clampedX, y2: panelBottom,
      realX: snappedRealX,
      panelIndex: hit.panelIndex,
      leftDim: Math.round(clampedRealX - panelLeftReal),
      rightDim: Math.round(panelRightReal - clampedRealX),
    };
  }
}

// ---------------------------------------------------------------------------
// Arc placement computation
// ---------------------------------------------------------------------------

/** Compute preview arc for the arc tool */
export function computeArcPlacement(geo: CanvasGeometry, hx: number, hy: number): PlacedArc | null {
  const { drawW, drawH, width, height } = geo;
  const hit = findPanelAtPoint(geo, hx, hy);
  if (!hit) return null;

  const { panelCx: cx, panelCy: cy, panelW: pw, panelH: ph } = hit;
  const panelBottom = cy + ph / 2;

  // Arc spans panel width, sits at bottom of panel
  const arcCx = cx;
  const arcCy = panelBottom;
  const arcRx = pw / 2;
  const arcRy = ph / 2;

  const { realX: realCx, realY: realCy } = svgToReal(arcCx, arcCy, MARGIN, drawW, drawH, width, height);
  const realRx = (pw / drawW) * width / 2;
  const realRy = (ph / drawH) * height / 2;

  return {
    id: generateId(),
    cx: arcCx, cy: arcCy,
    rx: arcRx, ry: arcRy,
    startAngle: 180,
    endAngle: 0,
    realCx, realCy,
    realRx, realRy,
  };
}
