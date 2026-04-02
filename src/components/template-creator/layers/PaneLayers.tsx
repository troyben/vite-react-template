// ---------------------------------------------------------------------------
// PaneLayers: Layers 1b, 2b, 4b — pane-level glass fills, subdivision lines,
// and pane-level opening indicators within subdivided panels.
// ---------------------------------------------------------------------------

import React from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';
import type { Point } from '../utils/types';
import { MARGIN } from '../utils/types';
import { getPanelCenter } from '../utils/panels';
import { getTopYAtX, getBottomYAtX, getLeftXAtY, getRightXAtY } from '../utils/boundaries';
import { getOpeningIndicator } from '../utils/opening-indicators';
import { getRowTopFrac, getRowBottomFrac, getColLeftFrac, getColRightFrac } from '../utils/pane-fractions';
import type { SectionId } from '../utils/section-outline';
import { isSectionRemoved } from '../utils/section-outline';

export interface PaneLayersProps {
  shape: ShapeConfig;
  panels: number;
  panelWidths: number[];
  svgVerts: Point[];
  drawW: number;
  drawH: number;
  width: number;
  height: number;
  frameColor: string;
  panelDivisions?: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: string;
    openingType?: 'hinged' | 'sliding';
  }>;
  removedSections?: SectionId[];
}

/** Layer 1b: Pane-level glass fill for opening panes */
export function renderPaneGlass(props: PaneLayersProps): React.ReactNode {
  const {
    shape, panels, panelWidths, svgVerts, drawW, drawH, width, height,
    panelDivisions, panelDivisionHeights, panelDivisionWidths, openingPanes,
    removedSections,
  } = props;

  if (!openingPanes || openingPanes.length === 0 || !panelDivisions) return null;

  return openingPanes.map((pane, pIdx) => {
    // Skip removed sections
    if (removedSections && isSectionRemoved(removedSections, pane.panelIndex, pane.rowIndex, pane.colIndex)) return null;
    const div = panelDivisions.find((d) => d.panelIndex === pane.panelIndex);
    if (!div || (div.horizontalCount <= 1 && div.verticalCount <= 1)) return null;

    const { cx, cy, w: pw, h: ph } = getPanelCenter(
      shape, pane.panelIndex, panels, panelWidths, svgVerts,
      drawW, drawH, width, height,
    );
    const panelLeft = cx - pw / 2;
    const panelTop = cy - ph / 2;
    const colLFrac = getColLeftFrac(panelDivisionWidths, pane.panelIndex, pane.colIndex, div.verticalCount);
    const colRFrac = getColRightFrac(panelDivisionWidths, pane.panelIndex, pane.colIndex, div.verticalCount);
    const paneX = panelLeft + colLFrac * pw;
    const paneW = (colRFrac - colLFrac) * pw;
    const rowTFrac = getRowTopFrac(panelDivisionHeights, pane.panelIndex, pane.rowIndex, div.horizontalCount);
    const rowBFrac = getRowBottomFrac(panelDivisionHeights, pane.panelIndex, pane.rowIndex, div.horizontalCount);
    const paneY = panelTop + rowTFrac * ph;
    const paneH = (rowBFrac - rowTFrac) * ph;

    return (
      <rect
        key={`pane-glass-${pIdx}`}
        x={paneX}
        y={paneY}
        width={paneW}
        height={paneH}
        fill="#44D5B880"
        stroke="none"
      />
    );
  });
}

/** Layer 2b: Pane subdivision lines (double thin lines within each panel) */
export function renderSubdivisionLines(props: PaneLayersProps): React.ReactNode {
  const {
    shape, panelWidths, svgVerts, drawW, drawH, width, height,
    frameColor, panelDivisions, panelDivisionHeights, panelDivisionWidths,
    removedSections,
  } = props;

  if (!panelDivisions) return null;

  return panelDivisions.map((div) => {
    const { panelIndex, horizontalCount, verticalCount } = div;
    if (horizontalCount <= 1 && verticalCount <= 1) return null;

    // Get this panel's bounding region
    const total = panelWidths.reduce((a, b) => a + b, 0);
    let leftFrac = 0;
    for (let i = 0; i < panelIndex; i++) {
      leftFrac += (panelWidths[i] ?? 0) / total;
    }
    const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
    const panelLeft = MARGIN + leftFrac * drawW;
    const panelRight = MARGIN + rightFrac * drawW;
    const panelW = panelRight - panelLeft;

    // Find top and bottom Y at this panel's x range by sampling the center x
    const panelCenterX = (panelLeft + panelRight) / 2;
    const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
    const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
    const panelH = panelBottomY - panelTopY;

    const gap = 1; // gap between double lines
    const lines: React.ReactNode[] = [];
    const rs = removedSections ?? [];

    // Horizontal subdivision lines (rows)
    for (let r = 1; r < horizontalCount; r++) {
      // Skip if BOTH adjacent rows are removed at every column position
      if (rs.length > 0) {
        const allRemoved = Array.from({ length: verticalCount }, (_, ci) =>
          isSectionRemoved(rs, panelIndex, r - 1, ci) && isSectionRemoved(rs, panelIndex, r, ci),
        ).every(Boolean);
        if (allRemoved) continue;
      }
      const frac = getRowTopFrac(panelDivisionHeights, panelIndex, r, horizontalCount);
      const y = panelTopY + frac * panelH;
      const lx = getLeftXAtY(y, svgVerts, shape, drawW, drawH, width, height);
      const rx = getRightXAtY(y, svgVerts, shape, drawW, drawH, width, height);
      const clippedLeft = Math.max(panelLeft, lx);
      const clippedRight = Math.min(panelRight, rx);
      lines.push(
        <line key={`pane-h-${panelIndex}-${r}-a`}
          x1={clippedLeft} y1={y - gap / 2} x2={clippedRight} y2={y - gap / 2}
          stroke={frameColor} strokeWidth={0.8} />,
        <line key={`pane-h-${panelIndex}-${r}-b`}
          x1={clippedLeft} y1={y + gap / 2} x2={clippedRight} y2={y + gap / 2}
          stroke={frameColor} strokeWidth={0.8} />,
      );
    }

    // Vertical subdivision lines (columns)
    for (let c = 1; c < verticalCount; c++) {
      // Skip if BOTH adjacent columns are removed at every row position
      if (rs.length > 0) {
        const allRemoved = Array.from({ length: horizontalCount }, (_, ri) =>
          isSectionRemoved(rs, panelIndex, ri, c - 1) && isSectionRemoved(rs, panelIndex, ri, c),
        ).every(Boolean);
        if (allRemoved) continue;
      }
      const frac = getColLeftFrac(panelDivisionWidths, panelIndex, c, verticalCount);
      const x = panelLeft + frac * panelW;
      const topY = getTopYAtX(x, svgVerts, shape, drawW, drawH, width, height);
      const botY = getBottomYAtX(x, svgVerts);
      lines.push(
        <line key={`pane-v-${panelIndex}-${c}-a`}
          x1={x - gap / 2} y1={topY} x2={x - gap / 2} y2={botY}
          stroke={frameColor} strokeWidth={0.8} />,
        <line key={`pane-v-${panelIndex}-${c}-b`}
          x1={x + gap / 2} y1={topY} x2={x + gap / 2} y2={botY}
          stroke={frameColor} strokeWidth={0.8} />,
      );
    }

    return <g key={`panes-${panelIndex}`}>{lines}</g>;
  });
}

/** Layer 4b: Pane-level opening indicators */
export function renderPaneOpenings(props: PaneLayersProps): React.ReactNode {
  const {
    shape, panels, panelWidths, svgVerts, drawW, drawH, width, height,
    panelDivisions, panelDivisionHeights, panelDivisionWidths, openingPanes,
    removedSections,
  } = props;

  if (!openingPanes || !panelDivisions) return null;

  return openingPanes.map((pane, pIdx) => {
    if (!pane.openingDirection) return null;
    // Skip removed sections
    if (removedSections && isSectionRemoved(removedSections, pane.panelIndex, pane.rowIndex, pane.colIndex)) return null;
    const div = panelDivisions.find((d) => d.panelIndex === pane.panelIndex);
    if (!div || (div.horizontalCount <= 1 && div.verticalCount <= 1)) return null;

    const { cx, cy, w: pw, h: ph } = getPanelCenter(
      shape, pane.panelIndex, panels, panelWidths, svgVerts,
      drawW, drawH, width, height,
    );
    const panelLeft = cx - pw / 2;
    const panelTop = cy - ph / 2;
    const colLFrac = getColLeftFrac(panelDivisionWidths, pane.panelIndex, pane.colIndex, div.verticalCount);
    const colRFrac = getColRightFrac(panelDivisionWidths, pane.panelIndex, pane.colIndex, div.verticalCount);
    const paneW = (colRFrac - colLFrac) * pw;
    const rowTFrac = getRowTopFrac(panelDivisionHeights, pane.panelIndex, pane.rowIndex, div.horizontalCount);
    const rowBFrac = getRowBottomFrac(panelDivisionHeights, pane.panelIndex, pane.rowIndex, div.horizontalCount);
    const paneH = (rowBFrac - rowTFrac) * ph;
    const paneCx = panelLeft + colLFrac * pw + paneW / 2;
    const paneCy = panelTop + rowTFrac * ph + paneH / 2;
    const paneIsSliding = pane.openingType === 'sliding';

    return getOpeningIndicator(
      pane.openingDirection, paneIsSliding,
      paneCx, paneCy, paneW, paneH,
      `pane-opening-${pIdx}`,
    );
  });
}
