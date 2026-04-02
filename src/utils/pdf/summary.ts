import type jsPDF from 'jspdf';
import type { QuotationItem } from '../../services/quotationService';
import { COLORS, PAGE, FONT, SPACING, RADIUS } from './constants';
import { checkPageBreak } from './pageUtils';

/**
 * Draw the summary block: Total Pieces, Total Amount, Grand Total.
 * Grand total gets a rounded accent background for visual emphasis.
 */
export function drawSummary(
  doc: jsPDF,
  items: QuotationItem[],
  grandTotal: number,
  startY: number,
): number {
  let y = checkPageBreak(doc, startY, 30);
  y += SPACING.section;

  const right = PAGE.width - PAGE.margin;
  const labelX = right - 50;

  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = items.reduce((sum, it) => sum + it.total, 0);

  doc.setFontSize(FONT.summary);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  doc.text('Total Pieces:', labelX, y, { align: 'right' });
  doc.text(totalPieces.toString(), right, y, { align: 'right' });
  y += SPACING.md;

  doc.text('Total Amount:', labelX, y, { align: 'right' });
  doc.text(`$${totalAmount.toFixed(2)}`, right, y, { align: 'right' });
  y += SPACING.sm;

  // Divider
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(labelX - 5, y, right, y);
  y += SPACING.md;

  // Grand Total — rounded accent background
  const boxX = labelX - 8;
  const boxW = right - boxX + 2;
  const boxH = 8;
  const boxY = y - 5;

  doc.setFillColor(...COLORS.accentLight);
  doc.roundedRect(boxX, boxY, boxW, boxH, RADIUS.md, RADIUS.md, 'F');

  doc.setFontSize(FONT.grandTotal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Grand Total:', labelX, y, { align: 'right' });
  doc.text(`$${grandTotal.toFixed(2)}`, right, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  return y + SPACING.lg;
}
