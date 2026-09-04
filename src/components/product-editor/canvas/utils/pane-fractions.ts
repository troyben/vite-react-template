// ---------------------------------------------------------------------------
// Pane fraction helpers: compute fractional positions and real-world
// dimensions for rows and columns within subdivided panels.
// ---------------------------------------------------------------------------

/**
 * Treats a missing/non-finite entry as 0. Guards against `undefined` being
 * summed into `NaN` when a `rowHeights`/`colWidths` array is shorter than
 * `horizontalCount`/`verticalCount` claims (a symptom of the divisions and
 * heights/widths falling out of sync — see `normalizePanelDivisions`).
 */
function safe(n: number | undefined): number {
  return Number.isFinite(n) ? (n as number) : 0;
}

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
  const totalH = divH.rowHeights.reduce((a, b) => a + safe(b), 0);
  if (totalH <= 0) return r / horizontalCount;
  let sum = 0;
  for (let i = 0; i < r; i++) sum += safe(divH.rowHeights[i]);
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
  const totalH = divH.rowHeights.reduce((a, b) => a + safe(b), 0);
  if (totalH <= 0) return (r + 1) / horizontalCount;
  let sum = 0;
  for (let i = 0; i <= r; i++) sum += safe(divH.rowHeights[i]);
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
  const totalW = divW.colWidths.reduce((a, b) => a + safe(b), 0);
  if (totalW <= 0) return c / verticalCount;
  let sum = 0;
  for (let i = 0; i < c; i++) sum += safe(divW.colWidths[i]);
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
  const totalW = divW.colWidths.reduce((a, b) => a + safe(b), 0);
  if (totalW <= 0) return (c + 1) / verticalCount;
  let sum = 0;
  for (let i = 0; i <= c; i++) sum += safe(divW.colWidths[i]);
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

type PanelDivision = { panelIndex: number; horizontalCount: number; verticalCount: number };
type PanelDivisionHeights = { panelIndex: number; rowHeights: number[] };
type PanelDivisionWidths = { panelIndex: number; colWidths: number[] };

/**
 * Clamps each division's `horizontalCount`/`verticalCount` to the length of
 * its matching `rowHeights`/`colWidths` entry, when that entry has at least
 * 2 rows/columns of real data. Guards against a division count that was
 * bumped without a matching split being recorded (e.g. a stale save from
 * before the `onPaneRowAdd` early-return fix), which otherwise makes
 * `getRowTopFrac`/`getRowBottomFrac` sum past the end of the heights array
 * and produce `NaN` — the root cause of PDF sketch rendering crashes.
 * The stored heights/widths are treated as the source of truth since they
 * already sum to the panel's real dimensions.
 */
export function normalizePanelDivisions(
  panelDivisions: PanelDivision[] | undefined,
  panelDivisionHeights: PanelDivisionHeights[] | undefined,
  panelDivisionWidths: PanelDivisionWidths[] | undefined,
): PanelDivision[] | undefined {
  if (!panelDivisions) return undefined;
  return panelDivisions.map((division) => {
    let { horizontalCount, verticalCount } = division;

    const rowHeights = panelDivisionHeights?.find(
      (h) => h.panelIndex === division.panelIndex,
    )?.rowHeights;
    if (rowHeights && rowHeights.length >= 1) {
      horizontalCount = Math.min(horizontalCount, rowHeights.length);
    }

    const colWidths = panelDivisionWidths?.find(
      (w) => w.panelIndex === division.panelIndex,
    )?.colWidths;
    if (colWidths && colWidths.length >= 1) {
      verticalCount = Math.min(verticalCount, colWidths.length);
    }

    return { ...division, horizontalCount, verticalCount };
  });
}
