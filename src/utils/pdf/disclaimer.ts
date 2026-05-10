import type jsPDF from 'jspdf';
import { COLORS, PAGE, SPACING } from './constants';
import { checkPageBreak } from './pageUtils';

const IMPORTANT_NOTES_TEXT =
  'Customer is responsible to remove the protection film (if applicable) cover in maximum 2 months ' +
  'from installation. The plastic can glue to frame from intense sun exposure and heat and might ' +
  'not come out easy or even might remain on frames permanently. In this case manufacturer is not ' +
  'responsible if protection film cover can not be removed.';

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

/**
 * Draw an "Important Notes" block (used near the bottom of the quotation).
 * Same warm-background style as the disclaimer, with a bold heading.
 */
export function drawImportantNotes(doc: jsPDF, startY: number): number {
  const m = PAGE.margin;
  const contentWidth = PAGE.width - m * 2;
  const boxPadding = 3;
  const headingHeight = 4.2;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(IMPORTANT_NOTES_TEXT, contentWidth - boxPadding * 2 - 1);
  const lineHeight = 3.2;
  const boxHeight = headingHeight + lines.length * lineHeight + boxPadding * 2;

  let y = checkPageBreak(doc, startY, boxHeight + SPACING.md);
  y += SPACING.md;

  doc.setFillColor(255, 250, 235);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(230, 160, 50);
  doc.rect(m, y, 1.2, boxHeight, 'F');

  // Heading
  doc.setTextColor(140, 90, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Notes', m + boxPadding + 1, y + boxPadding + headingHeight - 0.6);

  // Body
  doc.setTextColor(100, 80, 40);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  let textY = y + boxPadding + headingHeight + lineHeight * 0.7;
  for (const line of lines) {
    doc.text(line, m + boxPadding + 1, textY);
    textY += lineHeight;
  }

  return y + boxHeight + SPACING.md;
}
