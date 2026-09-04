import { describe, it, expect } from 'vitest';
import { getRowTopFrac, getRowBottomFrac, normalizePanelDivisions } from './pane-fractions';

// Real production data that triggered the PDF export crash: panelIndex 1
// claims `horizontalCount: 3` rows but `rowHeights` only has 2 entries, so
// summing `rowHeights[2]` (undefined) used to produce NaN.
const panelDivisions = [
  { panelIndex: 0, horizontalCount: 2, verticalCount: 1 },
  { panelIndex: 1, horizontalCount: 3, verticalCount: 1 },
];
const panelDivisionHeights = [
  { panelIndex: 0, rowHeights: [645, 375] },
  { panelIndex: 1, rowHeights: [645, 375] },
];

describe('getRowTopFrac / getRowBottomFrac', () => {
  it('never returns NaN when horizontalCount outpaces rowHeights.length', () => {
    for (let r = 0; r < 3; r++) {
      const top = getRowTopFrac(panelDivisionHeights, 1, r, 3);
      const bottom = getRowBottomFrac(panelDivisionHeights, 1, r, 3);
      expect(Number.isFinite(top)).toBe(true);
      expect(Number.isFinite(bottom)).toBe(true);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(1);
      expect(bottom).toBeGreaterThanOrEqual(0);
      expect(bottom).toBeLessThanOrEqual(1);
    }
  });
});

describe('normalizePanelDivisions', () => {
  it('clamps horizontalCount to rowHeights.length for the inconsistent panel', () => {
    const normalized = normalizePanelDivisions(
      panelDivisions,
      panelDivisionHeights,
      undefined,
    );
    expect(normalized?.find((d) => d.panelIndex === 1)?.horizontalCount).toBe(2);
  });

  it('leaves a consistent panel untouched', () => {
    const normalized = normalizePanelDivisions(
      panelDivisions,
      panelDivisionHeights,
      undefined,
    );
    expect(normalized?.find((d) => d.panelIndex === 0)?.horizontalCount).toBe(2);
  });

  it('returns undefined when panelDivisions is undefined', () => {
    expect(normalizePanelDivisions(undefined, panelDivisionHeights, undefined)).toBeUndefined();
  });

  it('clamps a division with single-element heights/widths arrays to count 1', () => {
    const testDivisions = [{ panelIndex: 0, horizontalCount: 2, verticalCount: 2 }];
    const testHeights = [{ panelIndex: 0, rowHeights: [1000] }];
    const testWidths = [{ panelIndex: 0, colWidths: [800] }];
    const normalized = normalizePanelDivisions(testDivisions, testHeights, testWidths);
    const div = normalized?.find((d) => d.panelIndex === 0);
    expect(div?.horizontalCount).toBe(1);
    expect(div?.verticalCount).toBe(1);
  });

  it('returns a division unchanged when it has no matching heights/widths entry', () => {
    const testDivisions = [{ panelIndex: 0, horizontalCount: 2, verticalCount: 2 }];
    const normalized = normalizePanelDivisions(testDivisions, undefined, undefined);
    expect(normalized?.[0]).toEqual(testDivisions[0]);
  });
});
