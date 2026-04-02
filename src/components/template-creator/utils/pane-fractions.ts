// ---------------------------------------------------------------------------
// Pane fraction helpers: compute fractional positions and real-world
// dimensions for rows and columns within subdivided panels.
// ---------------------------------------------------------------------------

/**
 * Fractional Y position of the top edge of row `r` within a panel.
 * Uses custom row heights if provided, otherwise divides equally.
 */
export function getRowTopFrac(
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }> | undefined,
  panelIndex: number,
  r: number,
  horizontalCount: number,
): number {
  const divH = panelDivisionHeights?.find((h) => h.panelIndex === panelIndex);
  if (!divH?.rowHeights) return r / horizontalCount;
  const totalH = divH.rowHeights.reduce((a, b) => a + b, 0);
  if (totalH <= 0) return r / horizontalCount;
  let sum = 0;
  for (let i = 0; i < r; i++) sum += divH.rowHeights[i];
  return sum / totalH;
}

/**
 * Fractional Y position of the bottom edge of row `r` within a panel.
 */
export function getRowBottomFrac(
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }> | undefined,
  panelIndex: number,
  r: number,
  horizontalCount: number,
): number {
  const divH = panelDivisionHeights?.find((h) => h.panelIndex === panelIndex);
  if (!divH?.rowHeights) return (r + 1) / horizontalCount;
  const totalH = divH.rowHeights.reduce((a, b) => a + b, 0);
  if (totalH <= 0) return (r + 1) / horizontalCount;
  let sum = 0;
  for (let i = 0; i <= r; i++) sum += divH.rowHeights[i];
  return sum / totalH;
}

/**
 * Real-world height (mm) of a single row within a panel.
 */
export function getRowRealHeight(
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }> | undefined,
  panelIndex: number,
  r: number,
  horizontalCount: number,
  totalHeight: number,
): number {
  const divH = panelDivisionHeights?.find((h) => h.panelIndex === panelIndex);
  if (divH?.rowHeights?.[r] != null) return Math.round(divH.rowHeights[r]);
  return Math.round(totalHeight / horizontalCount);
}

/**
 * Fractional X position of the left edge of column `c` within a panel.
 */
export function getColLeftFrac(
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }> | undefined,
  panelIndex: number,
  c: number,
  verticalCount: number,
): number {
  const divW = panelDivisionWidths?.find((w) => w.panelIndex === panelIndex);
  if (!divW?.colWidths) return c / verticalCount;
  const totalW = divW.colWidths.reduce((a, b) => a + b, 0);
  if (totalW <= 0) return c / verticalCount;
  let sum = 0;
  for (let i = 0; i < c; i++) sum += divW.colWidths[i];
  return sum / totalW;
}

/**
 * Fractional X position of the right edge of column `c` within a panel.
 */
export function getColRightFrac(
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }> | undefined,
  panelIndex: number,
  c: number,
  verticalCount: number,
): number {
  const divW = panelDivisionWidths?.find((w) => w.panelIndex === panelIndex);
  if (!divW?.colWidths) return (c + 1) / verticalCount;
  const totalW = divW.colWidths.reduce((a, b) => a + b, 0);
  if (totalW <= 0) return (c + 1) / verticalCount;
  let sum = 0;
  for (let i = 0; i <= c; i++) sum += divW.colWidths[i];
  return sum / totalW;
}

/**
 * Real-world width (mm) of a single column within a panel.
 */
export function getColRealWidth(
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }> | undefined,
  panelWidths: number[],
  panelIndex: number,
  c: number,
  verticalCount: number,
): number {
  const divW = panelDivisionWidths?.find((w) => w.panelIndex === panelIndex);
  if (divW?.colWidths?.[c] != null) return Math.round(divW.colWidths[c]);
  return Math.round(panelWidths[panelIndex] / verticalCount);
}
