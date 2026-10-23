// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import jsPDF from 'jspdf';
import type { ProductData } from '../../components/product-editor/types';
import { renderSketchToPdf } from './sketchRenderer';

// jsdom does not implement SVGElement.prototype.getBBox; svg2pdf needs it
// to measure text and shape bounds while rendering.
(SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
  ({ x: 0, y: 0, width: 10, height: 10 }) as DOMRect;

// Real production data that triggered the original bug: panelIndex 1 has
// `horizontalCount: 3` but only 2 `rowHeights` entries, which used to sum
// to NaN in getRowTopFrac/getRowBottomFrac and crash svg2pdf mid-render.
const fixture: ProductData = {
  type: 'window',
  windowType: 'hinged',
  height: 1020,
  frameColor: '#C0C0C0',
  glassType: 'clear',
  unit: 'mm',
  shape: { type: 'rectangle' },
  render3D: false,
  width: 1500,
  panels: 2,
  panelWidths: [750, 750],
  panelDivisions: [
    { panelIndex: 0, horizontalCount: 2, verticalCount: 1 },
    { panelIndex: 1, horizontalCount: 3, verticalCount: 1 },
  ],
  panelDivisionHeights: [
    { panelIndex: 0, rowHeights: [645, 375] },
    { panelIndex: 1, rowHeights: [645, 375] },
  ],
  openingPanels: [],
  openingDirections: {},
  openingPanes: [
    { panelIndex: 0, rowIndex: 0, colIndex: 0, openingDirection: 'top', openingType: 'hinged' },
    { panelIndex: 1, rowIndex: 0, colIndex: 0, openingDirection: 'top', openingType: 'hinged' },
  ],
};

describe('renderSketchToPdf (real svg2pdf)', () => {
  it.each(['slope-left', 'slope-right'] as const)('exports a %s sketch with panes', async (type) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await expect(renderSketchToPdf(doc, {
      ...fixture, shape: { type, shortSideHeight: 400 },
    }, 14, 20, 44, 30)).resolves.toBeUndefined();
    expect(doc.isAdvancedAPI()).toBe(false);
    expect(doc.output()).not.toMatch(/NaN|Infinity/);
  });

  it('renders the previously failing sketch without throwing', async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    await expect(
      renderSketchToPdf(doc, fixture, 14, 20, 44, 30),
    ).resolves.toBeUndefined();

    expect(doc.isAdvancedAPI()).toBe(false);
  });
});
