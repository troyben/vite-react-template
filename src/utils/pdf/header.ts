import type jsPDF from 'jspdf';
import type { Quotation } from '../../services/quotationService';
import {
  COLORS, PAGE, SPACING,
  applyHeading, applyBody, applySubtle, applyLabel,
} from './constants';
import { loadImageAsBase64 } from './pageUtils';

const COMPANY = {
  name: 'Malonic Aluminium & Glass',
  address: '315 Samora Machel Avenue, Eastlea, HARARE',
  phone: '+263 867 719 4229',
  email: 'sales@malonicaluminium.co.zw',
  website: 'malonicaluminium.co.zw',
};

/**
 * Draw the PDF header.
 *
 * Row 1: [Logo + Company Name]  ............  [Quotation # + Date]
 * Accent band
 * Row 2: [BILL TO client info]  ............  [Company details]
 *
 * Returns the Y position after the header.
 */
export async function drawHeader(doc: jsPDF, quotation: Quotation): Promise<number> {
  const m = PAGE.margin;
  const right = PAGE.width - m;
  let y = m;

  // -- Row 1: Logo + Company name (left) | Quotation # + Date (right) --
  let logoWidth = 0;
  try {
    const logoBase64 = await loadImageAsBase64('/logo.jpg');
    const logoH = 10;
    const logoW = 26;
    doc.addImage(logoBase64, 'PNG', m, y, logoW, logoH);
    logoWidth = logoW + SPACING.sm;
  } catch {
    // Continue without logo
  }

  // Company name next to logo
  applyHeading(doc);
  doc.text(COMPANY.name, m + logoWidth, y + 6);

  // Quotation # and date (right-aligned)
  const quotationDate = new Date(quotation.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  applySubtle(doc);
  doc.text(`Quotation #${quotation.id}`, right, y + 3, { align: 'right' });
  applyBody(doc);
  doc.text(quotationDate, right, y + 7, { align: 'right' });

  y += 13;

  // Accent band — thin colored line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(m, y, right, y);
  y += SPACING.md;

  // -- Row 2: Bill To (left) | Company Details (right) --
  const midX = PAGE.width / 2;

  // BILL TO
  applyLabel(doc);
  doc.text('BILL TO', m, y + 3);

  applyBody(doc);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.client_name, m, y + 7);
  applySubtle(doc);
  let clientY = y + 11;
  if (quotation.client_address) {
    doc.text(quotation.client_address, m, clientY);
    clientY += 3.5;
  }
  if (quotation.client_phone) {
    doc.text(`Tel: ${quotation.client_phone}`, m, clientY);
    clientY += 3.5;
  }

  // Company details (right side)
  applyLabel(doc);
  doc.text('FROM', midX + 10, y + 3);

  applySubtle(doc);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(COMPANY.name, midX + 10, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.subtle);
  let compY = y + 11;
  doc.text(COMPANY.address, midX + 10, compY);
  compY += 3.5;
  doc.text(`Tel: ${COMPANY.phone}`, midX + 10, compY);
  compY += 3.5;
  doc.text(COMPANY.email, midX + 10, compY);

  y = Math.max(clientY, compY) + SPACING.md;

  // Bottom divider
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(m, y, right, y);
  y += SPACING.md;

  return y;
}
