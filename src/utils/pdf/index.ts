import jsPDF from 'jspdf';
import type { Quotation } from '../../services/quotationService';
import { notify } from '../notifications';
import { drawHeader } from './header';
import { drawItemsSection } from './itemsTable';
import { drawSummary } from './summary';
import { drawSignatures, drawFooter } from './footer';

export async function exportQuotationToPDF(quotation: Quotation): Promise<void> {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'normal');

    const items = Array.isArray(quotation.items)
      ? quotation.items
      : JSON.parse(quotation.items as unknown as string);

    // Header
    let y = await drawHeader(doc, quotation);

    // Items table (renders sketches inline as vector graphics)
    y = await drawItemsSection(doc, items, y);

    // Summary
    const grandTotal = Number(quotation.total_amount);
    y = drawSummary(doc, items, grandTotal, y);

    // Signatures
    drawSignatures(doc, y);

    // Footer on every page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(doc, i, totalPages);
    }

    const safeName = (quotation.client_name || 'Client').replace(/\s+/g, '-');
    doc.save(`Malonic-Aluminium-${safeName}-Quotation-${quotation.id}.pdf`);
    notify.success('PDF generated successfully');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    notify.error('Failed to generate PDF');
  }
}
