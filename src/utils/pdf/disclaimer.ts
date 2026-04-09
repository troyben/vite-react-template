import type jsPDF from 'jspdf';
import { COLORS, PAGE, SPACING } from './constants';

const DISCLAIMER_TEXT =
  'All dimensions on drawings are in mm(metric system) and represent rough opening sizes, ' +
  'any other notes in imperial system might not reflect the final production sizes or ' +
  'R.O.(rough opening) sizes and will not be considered valid. All windows and doors are ' +
  'view from inside the house.';

/**
 * Draw a disclaimer notice at the top of the PDF, before any other content.
 * Returns the Y position after the disclaimer block.
 */
export function drawDisclaimer(doc: jsPDF, startY: number): number {
  const m = PAGE.margin;
  const contentWidth = PAGE.width - m * 2;
  let y = startY;

  // Background box
  const boxPadding = 3;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  const lines = doc.splitTextToSize(DISCLAIMER_TEXT, contentWidth - boxPadding * 2);
  const lineHeight = 3.2;
  const boxHeight = lines.length * lineHeight + boxPadding * 2;

  // Light warm background
  doc.setFillColor(255, 250, 235);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  // Left accent bar
  doc.setFillColor(230, 160, 50);
  doc.rect(m, y, 1.2, boxHeight, 'F');

  // Disclaimer text
  doc.setTextColor(100, 80, 40);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');

  let textY = y + boxPadding + lineHeight * 0.7;
  for (const line of lines) {
    doc.text(line, m + boxPadding + 1, textY);
    textY += lineHeight;
  }

  y += boxHeight + SPACING.md;

  return y;
}
