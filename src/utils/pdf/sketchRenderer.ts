import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { svg2pdf } from 'svg2pdf.js';
import type jsPDF from 'jspdf';
import type { ProductData } from '../../components/product-editor/types';
import ShapeCanvas from '../../components/product-editor/canvas/ShapeCanvas';
import { extractShapeCanvasProps } from '../templateSketchProps';
import { applyBlackWhiteToSvg } from './bwSvgTransform';

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

  await svg2pdf(svgElement, doc, { x, y, width, height });
}
