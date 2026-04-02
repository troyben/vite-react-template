import type jsPDF from 'jspdf';
import { COLORS, PAGE, SPACING } from './constants';
import { checkPageBreak } from './pageUtils';

/**
 * Draw signature blocks (authorized + customer).
 */
export function drawSignatures(doc: jsPDF, startY: number): number {
  let y = checkPageBreak(doc, startY, 30);
  y += SPACING.section;

  const m = PAGE.margin;
  const right = PAGE.width - m;
  const lineLen = 55;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);

  // Left — Authorized
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.subtle);
  doc.line(m, y, m + lineLen, y);
  doc.text('Authorized Signature', m, y + 4);

  // Right — Customer
  doc.line(right - lineLen, y, right, y);
  doc.text('Customer Acceptance', right - lineLen, y + 4);

  return y + SPACING.lg;
}

/**
 * Premium footer with top border, thank-you message, website, and page numbers.
 */
export function drawFooter(doc: jsPDF, currentPage: number, totalPages: number): void {
  const m = PAGE.margin;
  const right = PAGE.width - m;
  const footerY = PAGE.height - 8;

  // Subtle top border line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(m, footerY - 3, right, footerY - 3);

  // Thank you + website (left-center)
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.subtle);
  doc.text(
    'Thank you for your business!  |  malonicaluminium.co.zw',
    PAGE.width / 2,
    footerY,
    { align: 'center' },
  );

  // Page number (right)
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.subtle);
  doc.text(
    `Page ${currentPage} of ${totalPages}`,
    right,
    footerY,
    { align: 'right' },
  );
}
