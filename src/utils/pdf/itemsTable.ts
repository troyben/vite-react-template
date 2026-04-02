import type jsPDF from 'jspdf';
import type { QuotationItem } from '../../services/quotationService';
import {
  COLORS, PAGE, FONT, COLUMNS, COL_X, CONTENT_WIDTH,
  TABLE_HEADER_HEIGHT, MIN_ROW_HEIGHT, ROW_PADDING,
  RADIUS,
} from './constants';
import { checkPageBreak } from './pageUtils';
import { renderSketchToPdf } from './sketchRenderer';

/**
 * Draw the table header row with rounded top corners.
 */
export function drawTableHeader(doc: jsPDF, y: number): number {
  const m = PAGE.margin;

  // Rounded top corners on the header
  doc.setFillColor(...COLORS.dark);
  doc.roundedRect(m, y, CONTENT_WIDTH, TABLE_HEADER_HEIGHT, RADIUS.md, RADIUS.md, 'F');
  // Fill the bottom half to make only top corners rounded
  doc.rect(m, y + TABLE_HEADER_HEIGHT / 2, CONTENT_WIDTH, TABLE_HEADER_HEIGHT / 2, 'F');

  doc.setFontSize(FONT.tableHeader);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');

  const ty = y + TABLE_HEADER_HEIGHT / 2 + 1;
  doc.text('Sketch', COL_X.sketch + 2, ty);
  doc.text('Product / Description', COL_X.name + 2, ty);
  doc.text('QTY', COL_X.qty + COLUMNS.qty / 2, ty, { align: 'center' });
  doc.text('Unit Price', COL_X.price + COLUMNS.price - 2, ty, { align: 'right' });
  doc.text('Total', COL_X.total + COLUMNS.total - 2, ty, { align: 'right' });

  // Subtle vertical column separators
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.15);
  const separators = [COL_X.name, COL_X.qty, COL_X.price, COL_X.total];
  for (const sx of separators) {
    doc.line(sx, y + 1.5, sx, y + TABLE_HEADER_HEIGHT - 1.5);
  }

  doc.setFont('helvetica', 'normal');
  return y + TABLE_HEADER_HEIGHT;
}

/**
 * Calculate height needed for a row — driven by sketch aspect ratio and text.
 */
function calcRowHeight(doc: jsPDF, item: QuotationItem, hasSketch: boolean): number {
  doc.setFontSize(FONT.tableBody);
  const nameLines = doc.splitTextToSize(item.item || 'Untitled', COLUMNS.name - 4);
  const descLines = item.description
    ? doc.splitTextToSize(item.description, COLUMNS.name - 4)
    : [];
  const lineH = 3.2;
  const textHeight = (nameLines.length + descLines.length) * lineH + ROW_PADDING * 2 + 2;

  let sketchHeight = 0;
  if (hasSketch && item.productSketch) {
    const sw = item.productSketch.width || 100;
    const sh = item.productSketch.height || 100;
    const ratio = sw / sh;
    const maxW = COLUMNS.sketch - 4;
    const maxH = 38;
    let imgH = maxW / ratio;
    if (imgH > maxH) {
      imgH = maxH;
    }
    sketchHeight = imgH + ROW_PADDING * 2;
  }

  return Math.max(MIN_ROW_HEIGHT, textHeight, sketchHeight);
}

/**
 * Draw a single item row (async for vector sketch rendering).
 */
async function drawItemRow(
  doc: jsPDF,
  item: QuotationItem,
  index: number,
  y: number,
  rowHeight: number,
): Promise<number> {
  const m = PAGE.margin;

  // Alternating background
  if (index % 2 === 0) {
    doc.setFillColor(...COLORS.rowAlt);
    doc.rect(m, y, CONTENT_WIDTH, rowHeight, 'F');
  }

  // Bottom border
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.15);
  doc.line(m, y + rowHeight, m + CONTENT_WIDTH, y + rowHeight);

  // -- Sketch (vector via svg2pdf) --
  if (item.productSketch) {
    const sw = item.productSketch.width || 100;
    const sh = item.productSketch.height || 100;
    const ratio = sw / sh;
    const maxW = COLUMNS.sketch - 4;
    const maxH = rowHeight - ROW_PADDING * 2;
    let imgW = maxW;
    let imgH = imgW / ratio;
    if (imgH > maxH) {
      imgH = maxH;
      imgW = imgH * ratio;
    }
    const imgX = COL_X.sketch + (COLUMNS.sketch - imgW) / 2;
    const imgY = y + (rowHeight - imgH) / 2;

    try {
      await renderSketchToPdf(doc, item.productSketch, imgX, imgY, imgW, imgH);
    } catch (e) {
      console.error('Failed to render sketch for item:', item.item, e);
    }
  }

  // -- Product name (bold) + description (normal) --
  const textX = COL_X.name + 2;
  const lineH = 3.2;
  let textY = y + ROW_PADDING + 3;

  doc.setFontSize(FONT.tableBold);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  const nameLines: string[] = doc.splitTextToSize(item.item || 'Untitled', COLUMNS.name - 4);
  nameLines.forEach((line: string) => {
    doc.text(line, textX, textY);
    textY += lineH;
  });

  if (item.description) {
    textY += 0.5;
    doc.setFontSize(FONT.tableBody);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.subtle);
    const descLines: string[] = doc.splitTextToSize(item.description, COLUMNS.name - 4);
    descLines.forEach((line: string) => {
      doc.text(line, textX, textY);
      textY += lineH;
    });
  }

  // -- Numeric columns (vertically centered) --
  const valY = y + rowHeight / 2 + 1;
  doc.setFontSize(FONT.tableBody);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(item.quantity.toString(), COL_X.qty + COLUMNS.qty / 2, valY, { align: 'center' });
  doc.text(`$${item.price.toFixed(2)}`, COL_X.price + COLUMNS.price - 2, valY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`$${item.total.toFixed(2)}`, COL_X.total + COLUMNS.total - 2, valY, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  return y + rowHeight;
}

/**
 * Draw the full items table with page-break handling.
 */
export async function drawItemsSection(
  doc: jsPDF,
  items: QuotationItem[],
  startY: number,
): Promise<number> {
  let y = startY;

  // Table header
  y = drawTableHeader(doc, y);

  // Rows
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const hasSketch = !!item.productSketch;
    const rowHeight = calcRowHeight(doc, item, hasSketch);

    const newY = checkPageBreak(doc, y, rowHeight + 2);
    if (newY !== y) {
      y = newY;
      y = drawTableHeader(doc, y);
    }

    y = await drawItemRow(doc, item, i, y, rowHeight);
  }

  return y;
}
