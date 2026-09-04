import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { svg2pdf } from 'svg2pdf.js';
import type jsPDF from 'jspdf';
import type { ProductData } from '../../components/product-editor/types';
import ShapeCanvas from '../../components/product-editor/canvas/ShapeCanvas';
import { extractShapeCanvasProps } from '../templateSketchProps';
import { applyBlackWhiteToSvg } from './bwSvgTransform';

/**
 * jsPDF's `internal.pages` is the array of per-page content-stream lines,
 * 1-indexed (`pages[1]` is page 1). It isn't exposed in the shipped typings,
 * so it has to be narrowed with a cast at the call site.
 */
type PdfPages = { pages: string[][] };

/**
 * svg2pdf.js (2.7.0) has no try/finally around its own
 * `advancedAPI()` / `saveGraphicsState()` / `restoreGraphicsState()` /
 * `compatAPI()` calls. If rendering throws partway through, jsPDF is left in
 * advanced API mode with unbalanced graphics states on the current page,
 * which corrupts the coordinate space for every draw call that follows
 * (the classic symptom: everything after the first item row lands on a
 * near-blank final page). This rebalances the graphics-state stack and
 * discards the partially-drawn sketch so the document is left exactly as it
 * was before the failed render.
 */
function recoverFromSketchFailure(doc: jsPDF, page: string[], before: number): void {
  const drawn = page.slice(before);
  const opened = drawn.filter((line) => line === 'q').length;
  const closed = drawn.filter((line) => line === 'Q').length;
  const unbalanced = opened - closed;

  if (doc.isAdvancedAPI()) {
    // Entering advanced API mode itself pushes one graphics state that
    // `compatAPI()` pops as part of switching back to compat mode, so leave
    // one unit of imbalance for `compatAPI()` to resolve.
    for (let i = 0; i < Math.max(unbalanced - 1, 0); i++) doc.restoreGraphicsState();
    doc.compatAPI();
  } else {
    for (let i = 0; i < Math.max(unbalanced, 0); i++) doc.restoreGraphicsState();
  }

  // Discard the partial sketch (and the rebalancing restores we just made) —
  // the graphics-state stack has already been popped correctly above.
  page.length = before;
}

/**
 * Render a product sketch directly into the PDF as vector graphics.
 * Uses renderToStaticMarkup to get the SVG string from ShapeCanvas,
 * then svg2pdf.js to embed it as vector paths in the PDF.
 *
 * The PDF export is intentionally black & white — user-chosen colors
 * (frame, glass tint) are surfaced as written text in the items table,
 * not rendered. See `bwSvgTransform.ts` and `colorNames.ts`.
 */
export async function renderSketchToPdf(
  doc: jsPDF,
  sketchData: ProductData,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  const baseProps = extractShapeCanvasProps(sketchData, { printMode: true });

  // printMode in ShapeCanvas already yields a grayscale palette with thicker
  // strokes; keep frame override as the post-processor's hard floor.
  const props = {
    ...baseProps,
    frameColor: '#000000',
  };

  const svgString = renderToStaticMarkup(
    React.createElement(ShapeCanvas, {
      ...props,
      svgStyle: { width: '600px', height: '500px' },
    })
  );

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement as unknown as SVGElement;

  // Force the rendered sketch to pure B&W while preserving stroke styles
  // (dasharrays) so opening types remain visually distinguishable.
  applyBlackWhiteToSvg(svgElement);

  const pages = (doc.internal as unknown as PdfPages).pages;
  const pageNo = doc.getCurrentPageInfo().pageNumber;
  const page = pages[pageNo];
  const before = page.length;

  try {
    await svg2pdf(svgElement, doc, { x, y, width, height });
  } catch (err) {
    recoverFromSketchFailure(doc, page, before);
    throw err;
  }
}
