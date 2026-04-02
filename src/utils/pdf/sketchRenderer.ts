import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { svg2pdf } from 'svg2pdf.js';
import type jsPDF from 'jspdf';
import type { ProductData } from '../../components/product-sketch';
import ShapeCanvas from '../../components/template-creator/ShapeCanvas';
import { extractShapeCanvasProps } from '../templateSketchProps';

/**
 * Render a product sketch directly into the PDF as vector graphics.
 * Uses renderToStaticMarkup to get the SVG string from ShapeCanvas,
 * then svg2pdf.js to embed it as vector paths in the PDF.
 */
export async function renderSketchToPdf(
  doc: jsPDF,
  sketchData: ProductData,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  const props = extractShapeCanvasProps(sketchData);

  const svgString = renderToStaticMarkup(
    React.createElement(ShapeCanvas, {
      ...props,
      svgStyle: { width: '600px', height: '500px' },
    })
  );

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  await svg2pdf(svgElement, doc, { x, y, width, height });
}
