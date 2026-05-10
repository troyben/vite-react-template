import type jsPDF from 'jspdf';
import type { QuotationItem } from '../../services/quotationService';
import { COLORS, PAGE, FONT, SPACING, RADIUS } from './constants';
import { checkPageBreak } from './pageUtils';
import { computeTotals } from '../quotationTotals';

export interface SummaryTotals {
  /** Sum of line items. */
  subtotal: number;
  /** 0..100. */
  vatPercent: number;
  /** >= 0. */
  transportFee: number;
  /** Optional precomputed grand total (from server). If absent, computed locally. */
  grandTotal?: number;
}

/**
 * Draw the summary block: Total Pieces, Subtotal, VAT, Transport, Grand Total.
 * VAT and Transport rows render only when their value is > 0.
 * Grand total gets a rounded accent background for visual emphasis.
 */
export function drawSummary(
  doc: jsPDF,
  items: QuotationItem[],
  totals: SummaryTotals,
  startY: number,
): number {
  const { subtotal, vatPercent, transportFee } = totals;
  const computed = computeTotals(subtotal, vatPercent, transportFee);
  const grandTotal = typeof totals.grandTotal === 'number' ? totals.grandTotal : computed.grandTotal;

  // Reserve enough vertical space for max possible rows (pieces + subtotal + vat + transport + grand)
  let y = checkPageBreak(doc, startY, 50);
  y += SPACING.section;

  const right = PAGE.width - PAGE.margin;
  const labelX = right - 60;

  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);

  doc.setFontSize(FONT.summary);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  doc.text('Total Pieces:', labelX, y, { align: 'right' });
  doc.text(totalPieces.toString(), right, y, { align: 'right' });
  y += SPACING.md;

  doc.text('Subtotal:', labelX, y, { align: 'right' });
  doc.text(`$${subtotal.toFixed(2)}`, right, y, { align: 'right' });
  y += SPACING.md;

  doc.text(`VAT (${vatPercent}%):`, labelX, y, { align: 'right' });
  doc.text(`$${computed.vatAmount.toFixed(2)}`, right, y, { align: 'right' });
  y += SPACING.md;

  doc.text('Transport:', labelX, y, { align: 'right' });
  doc.text(`$${transportFee.toFixed(2)}`, right, y, { align: 'right' });
  y += SPACING.md;

  y += SPACING.sm - SPACING.md; // tighten spacing before divider

  // Divider
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(labelX - 5, y, right, y);
  y += SPACING.md;

  // Grand Total — rounded accent background sized to actual text widths.
  doc.setFontSize(FONT.grandTotal);
  doc.setFont('helvetica', 'bold');
  const labelText = 'Grand Total:';
  const valueText = `$${grandTotal.toFixed(2)}`;
  const labelW = doc.getTextWidth(labelText);
  const valueW = doc.getTextWidth(valueText);
  const padX = 4;
  const padY = 2.5;
  const boxX = labelX - labelW - padX;
  const boxW = right - boxX + padX;
  const boxH = FONT.grandTotal * 0.55 + padY * 2;
  const boxY = y - FONT.grandTotal * 0.4 - padY * 0.5;

  // Ensure value fits too — extend box right if needed.
  const valueRight = right + padX;
  const finalBoxW = Math.max(boxW, valueRight - boxX);

  doc.setFillColor(...COLORS.accentLight);
  doc.roundedRect(boxX, boxY, finalBoxW, boxH, RADIUS.md, RADIUS.md, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.text(labelText, labelX, y, { align: 'right' });
  doc.text(valueText, right, y, { align: 'right' });
  // suppress unused warning
  void valueW;

  doc.setFont('helvetica', 'normal');
  return y + SPACING.lg;
}
