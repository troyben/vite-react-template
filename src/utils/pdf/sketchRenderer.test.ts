// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import jsPDF from 'jspdf';
import type { ProductData } from '../../components/product-editor/types';
import { renderSketchToPdf } from './sketchRenderer';

// jsdom does not implement SVGElement.prototype.getBBox; svg2pdf needs it
// (both here for the mocked test and, more importantly, in the sibling
// `sketchRenderer.real.test.ts`, which exercises the real library).
(SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
  ({ x: 0, y: 0, width: 10, height: 10 }) as DOMRect;

// Faithful simulation of the real svg2pdf.js 2.7.0 failure mode: it enters
// advanced API mode, pushes a graphics state, then throws with no
// try/finally to unwind either — see sketchRenderer.ts::recoverFromSketchFailure.
vi.mock('svg2pdf.js', () => ({
  svg2pdf: vi.fn(async (_el: unknown, pdf: jsPDF) => {
    pdf.advancedAPI();
    pdf.saveGraphicsState();
    pdf.saveGraphicsState();
    throw new Error('boom');
  }),
}));

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
  panels: 1,
  panelWidths: [1500],
  openingPanels: [],
  openingDirections: {},
  openingPanes: [],
};

describe('renderSketchToPdf', () => {
  it('recovers jsPDF state when svg2pdf throws', async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pages = (doc.internal as unknown as { pages: string[][] }).pages;
    const before = pages[1].length;

    await expect(renderSketchToPdf(doc, fixture, 10, 10, 50, 50)).rejects.toThrow('boom');

    expect(doc.isAdvancedAPI()).toBe(false);
    expect(pages[1].length).toBe(before);

    // The document must still be usable afterwards — no leftover corrupted state.
    doc.text('after', 20, 20);
    expect(pages[1].length).toBeGreaterThan(before);
  });
});
