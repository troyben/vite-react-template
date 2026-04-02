// ---------------------------------------------------------------------------
// Removal hit detection and highlight geometry for the remove tool
// and right-click same-kind removal.
// ---------------------------------------------------------------------------

import React from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';
import type { Point, DividerLine } from './types';
import { MARGIN } from './types';
import { getPanelCenter } from './panels';
import { getTopYAtX, getBottomYAtX } from './boundaries';
import { getRowTopFrac, getRowBottomFrac, getColLeftFrac, getColRightFrac } from './pane-fractions';
import type { CanvasTool, PlacedArc } from './canvas-tools';
import type { SectionId } from './section-outline';
import { isSectionRemoved } from './section-outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RemovableItem =
  | { type: 'panel-divider'; dividerIndex: number }
  | { type: 'pane-row-divider'; panelIndex: number; rowDividerIndex: number }
  | { type: 'pane-col-divider'; panelIndex: number; colDividerIndex: number }
  | { type: 'panel-opening'; panelIndex: number }
  | { type: 'pane-opening'; panelIndex: number; rowIndex: number; colIndex: number }
  | { type: 'arc'; arcId: string }
  | { type: 'section'; panelIndex: number; rowIndex: number; colIndex: number };

// ---------------------------------------------------------------------------
// Context for hit detection
// ---------------------------------------------------------------------------

export interface RemoveContext {
  shape: ShapeConfig;
  panels: number;
  panelWidths: number[];
  svgVerts: Point[];
  drawW: number;
  drawH: number;
  width: number;
  height: number;
  dividers: DividerLine[];
  panelDivisions?: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  openingPanels: number[];
  openingDirections: Record<number, string>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: string;
    openingType?: 'hinged' | 'sliding';
  }>;
  customArcs?: PlacedArc[];
  removedSections?: SectionId[];
}

const HIT_TOLERANCE = 5; // SVG units (~px in viewBox space)

// ---------------------------------------------------------------------------
// Hit detection
// ---------------------------------------------------------------------------

/** Find the closest removable item at the given SVG point */
export function findRemovableAtPoint(ctx: RemoveContext, px: number, py: number): RemovableItem | null {
  const {
    shape, panels, panelWidths, svgVerts, drawW, drawH, width, height,
    dividers, panelDivisions, panelDivisionHeights, panelDivisionWidths,
    openingPanels, openingDirections, openingPanes, customArcs,
  } = ctx;

  // --- 1. Panel dividers (vertical lines between panels) ---
  for (let d = 0; d < dividers.length; d++) {
    const div = dividers[d];
    if (Math.abs(px - div.x) <= HIT_TOLERANCE && py >= div.topY - HIT_TOLERANCE && py <= div.bottomY + HIT_TOLERANCE) {
      return { type: 'panel-divider', dividerIndex: d };
    }
  }

  // --- 2. Pane subdivision dividers (rows and columns within panels) ---
  if (panelDivisions) {
    const total = panelWidths.reduce((a, b) => a + b, 0);
    for (const div of panelDivisions) {
      const { panelIndex, horizontalCount, verticalCount } = div;
      if (horizontalCount <= 1 && verticalCount <= 1) continue;

      let leftFrac = 0;
      for (let i = 0; i < panelIndex; i++) {
        leftFrac += (panelWidths[i] ?? 0) / total;
      }
      const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
      const panelLeft = MARGIN + leftFrac * drawW;
      const panelRight = MARGIN + rightFrac * drawW;
      const panelW = panelRight - panelLeft;
      const panelCenterX = (panelLeft + panelRight) / 2;
      const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
      const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
      const panelH = panelBottomY - panelTopY;

      // Row dividers (horizontal lines)
      for (let r = 1; r < horizontalCount; r++) {
        const frac = getRowTopFrac(panelDivisionHeights, panelIndex, r, horizontalCount);
        const y = panelTopY + frac * panelH;
        if (Math.abs(py - y) <= HIT_TOLERANCE && px >= panelLeft - HIT_TOLERANCE && px <= panelRight + HIT_TOLERANCE) {
          return { type: 'pane-row-divider', panelIndex, rowDividerIndex: r - 1 };
        }
      }

      // Column dividers (vertical lines)
      for (let c = 1; c < verticalCount; c++) {
        const frac = getColLeftFrac(panelDivisionWidths, panelIndex, c, verticalCount);
        const x = panelLeft + frac * panelW;
        if (Math.abs(px - x) <= HIT_TOLERANCE && py >= panelTopY - HIT_TOLERANCE && py <= panelBottomY + HIT_TOLERANCE) {
          return { type: 'pane-col-divider', panelIndex, colDividerIndex: c - 1 };
        }
      }
    }
  }

  // --- 3. Custom arcs ---
  if (customArcs) {
    for (const arc of customArcs) {
      const dx = (px - arc.cx) / arc.rx;
      const dy = (py - arc.cy) / arc.ry;
      const ellipseDist = Math.abs(Math.sqrt(dx * dx + dy * dy) - 1);
      const svgDist = ellipseDist * Math.max(arc.rx, arc.ry);
      if (svgDist <= HIT_TOLERANCE && py <= arc.cy + HIT_TOLERANCE) {
        return { type: 'arc', arcId: arc.id };
      }
    }
  }

  // --- 4. Opening indicators (panel-level) ---
  for (const panelIdx of openingPanels) {
    const dir = openingDirections[panelIdx];
    if (!dir) continue;
    const { cx, cy, w: pw, h: ph } = getPanelCenter(
      shape, panelIdx, panels, panelWidths, svgVerts,
      drawW, drawH, width, height,
    );
    const panelLeft = cx - pw / 2;
    const panelRight = cx + pw / 2;
    const panelTop = cy - ph / 2;
    const panelBottom = cy + ph / 2;
    if (px >= panelLeft && px <= panelRight && py >= panelTop && py <= panelBottom) {
      return { type: 'panel-opening', panelIndex: panelIdx };
    }
  }

  // --- 5. Opening indicators (pane-level) ---
  if (openingPanes && panelDivisions) {
    for (const pane of openingPanes) {
      if (!pane.openingDirection) continue;
      const div = panelDivisions.find((d) => d.panelIndex === pane.panelIndex);
      if (!div) continue;
      const { cx, cy, w: pw, h: ph } = getPanelCenter(
        shape, pane.panelIndex, panels, panelWidths, svgVerts,
        drawW, drawH, width, height,
      );
      const panelLeft = cx - pw / 2;
      const panelTop = cy - ph / 2;
      const colLeftFrac = getColLeftFrac(panelDivisionWidths, pane.panelIndex, pane.colIndex, div.verticalCount);
      const colRightFrac = getColRightFrac(panelDivisionWidths, pane.panelIndex, pane.colIndex, div.verticalCount);
      const rowTopFrac = getRowTopFrac(panelDivisionHeights, pane.panelIndex, pane.rowIndex, div.horizontalCount);
      const rowBottomFrac = getRowBottomFrac(panelDivisionHeights, pane.panelIndex, pane.rowIndex, div.horizontalCount);
      const paneLeft = panelLeft + colLeftFrac * pw;
      const paneRight = panelLeft + colRightFrac * pw;
      const paneTop = panelTop + rowTopFrac * ph;
      const paneBottom = panelTop + rowBottomFrac * ph;
      if (px >= paneLeft && px <= paneRight && py >= paneTop && py <= paneBottom) {
        return { type: 'pane-opening', panelIndex: pane.panelIndex, rowIndex: pane.rowIndex, colIndex: pane.colIndex };
      }
    }
  }

  // --- 6. Section (empty pane area, lowest priority) ---
  {
    const removedSections = ctx.removedSections ?? [];
    const total = panelWidths.reduce((a, b) => a + b, 0);
    for (let pi = 0; pi < panels; pi++) {
      const div = panelDivisions?.find((d) => d.panelIndex === pi);
      const rows = div?.horizontalCount ?? 1;
      const cols = div?.verticalCount ?? 1;
      const { cx, cy, w: pw, h: ph } = getPanelCenter(
        shape, pi, panels, panelWidths, svgVerts,
        drawW, drawH, width, height,
      );
      const panelLeft = cx - pw / 2;
      const panelTop = cy - ph / 2;

      for (let ri = 0; ri < rows; ri++) {
        for (let ci = 0; ci < cols; ci++) {
          if (isSectionRemoved(removedSections, pi, ri, ci)) continue;
          // Check if this section has an opening
          const hasOpening =
            openingPanels.includes(pi) ||
            openingPanes?.some(
              (p) => p.panelIndex === pi && p.rowIndex === ri && p.colIndex === ci && p.openingDirection,
            );
          if (hasOpening) continue;

          const colLFrac = getColLeftFrac(panelDivisionWidths, pi, ci, cols);
          const colRFrac = getColRightFrac(panelDivisionWidths, pi, ci, cols);
          const rowTFrac = getRowTopFrac(panelDivisionHeights, pi, ri, rows);
          const rowBFrac = getRowBottomFrac(panelDivisionHeights, pi, ri, rows);
          const paneLeft = panelLeft + colLFrac * pw;
          const paneRight = panelLeft + colRFrac * pw;
          const paneTop = panelTop + rowTFrac * ph;
          const paneBottom = panelTop + rowBFrac * ph;

          if (px >= paneLeft && px <= paneRight && py >= paneTop && py <= paneBottom) {
            return { type: 'section', panelIndex: pi, rowIndex: ri, colIndex: ci };
          }
        }
      }
    }
  }

  return null;
}

/** Find removable item at point, filtered to match the given tool kind */
export function findSameKindAtPoint(
  ctx: RemoveContext,
  px: number,
  py: number,
  tool: CanvasTool,
  lineTarget: 'panel' | 'pane',
): RemovableItem | null {
  const item = findRemovableAtPoint(ctx, px, py);
  if (!item) return null;
  switch (tool) {
    case 'handle':
      return (item.type === 'panel-opening' || item.type === 'pane-opening') ? item : null;
    case 'line':
      if (lineTarget === 'panel' && item.type === 'panel-divider') return item;
      if (lineTarget === 'pane' && (item.type === 'pane-row-divider' || item.type === 'pane-col-divider')) return item;
      return null;
    case 'arc':
      return item.type === 'arc' ? item : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Highlight geometry for remove / right-click overlays
// ---------------------------------------------------------------------------

/** Get SVG geometry for rendering a red highlight on a RemovableItem */
export function getHighlightGeometry(
  item: RemovableItem,
  ctx: RemoveContext,
): React.ReactNode {
  const {
    shape, panels, panelWidths, svgVerts, drawW, drawH, width, height,
    dividers, panelDivisions, panelDivisionHeights, panelDivisionWidths, customArcs,
  } = ctx;

  switch (item.type) {
    case 'panel-divider': {
      const div = dividers[item.dividerIndex];
      if (!div) return null;
      return React.createElement('line', {
        x1: div.x, y1: div.topY, x2: div.x, y2: div.bottomY,
        stroke: '#ef4444', strokeWidth: 4, opacity: 0.3,
      });
    }
    case 'pane-row-divider': {
      const total = panelWidths.reduce((a, b) => a + b, 0);
      let leftFrac = 0;
      for (let i = 0; i < item.panelIndex; i++) leftFrac += (panelWidths[i] ?? 0) / total;
      const rightFrac = leftFrac + (panelWidths[item.panelIndex] ?? 0) / total;
      const panelLeft = MARGIN + leftFrac * drawW;
      const panelRight = MARGIN + rightFrac * drawW;
      const panelCenterX = (panelLeft + panelRight) / 2;
      const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
      const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
      const panelH = panelBottomY - panelTopY;
      const div = panelDivisions?.find(d => d.panelIndex === item.panelIndex);
      if (!div) return null;
      const frac = getRowTopFrac(panelDivisionHeights, item.panelIndex, item.rowDividerIndex + 1, div.horizontalCount);
      const y = panelTopY + frac * panelH;
      return React.createElement('line', {
        x1: panelLeft, y1: y, x2: panelRight, y2: y,
        stroke: '#ef4444', strokeWidth: 4, opacity: 0.3,
      });
    }
    case 'pane-col-divider': {
      const total = panelWidths.reduce((a, b) => a + b, 0);
      let leftFrac = 0;
      for (let i = 0; i < item.panelIndex; i++) leftFrac += (panelWidths[i] ?? 0) / total;
      const rightFrac = leftFrac + (panelWidths[item.panelIndex] ?? 0) / total;
      const panelLeft = MARGIN + leftFrac * drawW;
      const panelW = (rightFrac - leftFrac) * drawW;
      const panelCenterX = MARGIN + (leftFrac + rightFrac) / 2 * drawW;
      const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
      const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
      const div = panelDivisions?.find(d => d.panelIndex === item.panelIndex);
      if (!div) return null;
      const frac = getColLeftFrac(panelDivisionWidths, item.panelIndex, item.colDividerIndex + 1, div.verticalCount);
      const x = panelLeft + frac * panelW;
      return React.createElement('line', {
        x1: x, y1: panelTopY, x2: x, y2: panelBottomY,
        stroke: '#ef4444', strokeWidth: 4, opacity: 0.3,
      });
    }
    case 'panel-opening': {
      const { cx, cy, w: pw, h: ph } = getPanelCenter(
        shape, item.panelIndex, panels, panelWidths, svgVerts,
        drawW, drawH, width, height,
      );
      return React.createElement('rect', {
        x: cx - pw / 2, y: cy - ph / 2, width: pw, height: ph,
        fill: '#ef4444', opacity: 0.15, stroke: '#ef4444', strokeWidth: 1, strokeOpacity: 0.3,
      });
    }
    case 'pane-opening': {
      const div = panelDivisions?.find(d => d.panelIndex === item.panelIndex);
      if (!div) return null;
      const { cx, cy, w: pw, h: ph } = getPanelCenter(
        shape, item.panelIndex, panels, panelWidths, svgVerts,
        drawW, drawH, width, height,
      );
      const panelLeft = cx - pw / 2;
      const panelTop = cy - ph / 2;
      const colLFrac = getColLeftFrac(panelDivisionWidths, item.panelIndex, item.colIndex, div.verticalCount);
      const colRFrac = getColRightFrac(panelDivisionWidths, item.panelIndex, item.colIndex, div.verticalCount);
      const rowTFrac = getRowTopFrac(panelDivisionHeights, item.panelIndex, item.rowIndex, div.horizontalCount);
      const rowBFrac = getRowBottomFrac(panelDivisionHeights, item.panelIndex, item.rowIndex, div.horizontalCount);
      const paneX = panelLeft + colLFrac * pw;
      const paneY = panelTop + rowTFrac * ph;
      const paneW = (colRFrac - colLFrac) * pw;
      const paneH = (rowBFrac - rowTFrac) * ph;
      return React.createElement('rect', {
        x: paneX, y: paneY, width: paneW, height: paneH,
        fill: '#ef4444', opacity: 0.15, stroke: '#ef4444', strokeWidth: 1, strokeOpacity: 0.3,
      });
    }
    case 'arc': {
      const arc = customArcs?.find(a => a.id === item.arcId);
      if (!arc) return null;
      return React.createElement('path', {
        d: `M ${arc.cx - arc.rx} ${arc.cy} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.cx + arc.rx} ${arc.cy}`,
        fill: 'none', stroke: '#ef4444', strokeWidth: 4, opacity: 0.3,
      });
    }
    case 'section': {
      const div = panelDivisions?.find(d => d.panelIndex === item.panelIndex);
      if (!div) {
        // No subdivisions — highlight entire panel
        const { cx, cy, w: pw, h: ph } = getPanelCenter(
          shape, item.panelIndex, panels, panelWidths, svgVerts,
          drawW, drawH, width, height,
        );
        return React.createElement('rect', {
          x: cx - pw / 2, y: cy - ph / 2, width: pw, height: ph,
          fill: '#ef4444', opacity: 0.15, stroke: '#ef4444', strokeWidth: 1, strokeOpacity: 0.3,
        });
      }
      const { cx, cy, w: pw, h: ph } = getPanelCenter(
        shape, item.panelIndex, panels, panelWidths, svgVerts,
        drawW, drawH, width, height,
      );
      const panelLeft = cx - pw / 2;
      const panelTop = cy - ph / 2;
      const colLFrac = getColLeftFrac(panelDivisionWidths, item.panelIndex, item.colIndex, div.verticalCount);
      const colRFrac = getColRightFrac(panelDivisionWidths, item.panelIndex, item.colIndex, div.verticalCount);
      const rowTFrac = getRowTopFrac(panelDivisionHeights, item.panelIndex, item.rowIndex, div.horizontalCount);
      const rowBFrac = getRowBottomFrac(panelDivisionHeights, item.panelIndex, item.rowIndex, div.horizontalCount);
      const paneX = panelLeft + colLFrac * pw;
      const paneY = panelTop + rowTFrac * ph;
      const paneW = (colRFrac - colLFrac) * pw;
      const paneH = (rowBFrac - rowTFrac) * ph;
      return React.createElement('rect', {
        x: paneX, y: paneY, width: paneW, height: paneH,
        fill: '#ef4444', opacity: 0.15, stroke: '#ef4444', strokeWidth: 1, strokeOpacity: 0.3,
      });
    }
  }
}
