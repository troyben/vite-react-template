import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quotation, QuotationItem } from '../services/quotationService';
import { notify } from '../utils/notifications';

// Color scheme
const COLORS = {
  primary: [13, 71, 161],     // Dark blue
  secondary: [25, 118, 210],  // Medium blue
  accent: [100, 181, 246],    // Light blue
  light: [227, 242, 253],     // Very light blue
  dark: [1, 30, 75],          // Navy blue
  text: [33, 33, 33],         // Dark gray for text
  subtle: [117, 117, 117]     // Light gray for subtle text
};

const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not available');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
  });
};

export const exportQuotationToPDF = async (quotation: Quotation) => {
  try {
    const doc : any = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const items = Array.isArray(quotation.items)
      ? quotation.items
      : JSON.parse(quotation.items as string);

    let logoBase64: string | null = null;

    try {
      logoBase64 = await loadImageAsBase64('/logo.jpg');
    } catch {
      console.warn('Logo not found. Proceeding without logo.');
    }

    // === Document Settings ===
    doc.setFont('helvetica', 'normal');
    doc.setLineHeightFactor(1.2);

    // === Header Section ===
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 15, 40, 15);
    }
    
    // Company name in header - dark color
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.dark);
    doc.setFont(undefined, 'bold');
    doc.text('Malonic Aluminium & Glass', pageWidth - margin, 25, { align: 'right' });
    doc.setFont(undefined, 'normal');

    // === Quotation Title Section ===
    doc.setFontSize(24);
    doc.setTextColor(...COLORS.primary);
    doc.text('QUOTATION', margin, 50);
    
    // === Quotation Info Section ===
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    
    const quotationDate = new Date(quotation.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const quotationInfo = [
      { label: 'Quotation #', value: quotation.id },
      { label: 'Date', value: quotationDate },
      { label: 'Valid Until', value: '30 days' }
    ];
    
    // Right-aligned quotation info
    const infoStartY = 45;
    quotationInfo.forEach((info, index) => {
      doc.text(`${info.label}:`, pageWidth - margin - 30, infoStartY + (index * 5), { align: 'right' });
      doc.text(info.value.toString(), pageWidth - margin, infoStartY + (index * 5), { align: 'right' });
    });

    // Divider line
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(margin, 62, pageWidth - margin, 62);

    // === Client Information Section ===
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text('BILL TO:', margin, 70);
    
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    
    const clientInfo = [
      quotation.client_name,
      quotation.client_address || 'Address not specified',
      `Phone: ${quotation.client_phone || 'N/A'}`,
      ...(quotation.client_email ? [`Email: ${quotation.client_email}`] : [])
    ];
    
    clientInfo.forEach((line, index) => {
      doc.text(line, margin, 75 + (index * 5));
    });

    // === Items Table ===
    autoTable(doc, {
      startY: 95,
      head: [['#', 'Item', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: items.map((item: QuotationItem, index: number) => [
        (index + 1).toString(),
        item.item,
        item.description || '-',
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ]),
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        textColor: COLORS.text as any,
        lineColor: [200, 200, 200],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: COLORS.primary as any,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: COLORS.light as any
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },  // #
        1: { cellWidth: 30 },                   // Item
        2: { cellWidth: 50 },                   // Description
        3: { cellWidth: 15, halign: 'center' }, // Qty
        4: { cellWidth: 25, halign: 'right' },  // Unit Price
        5: { cellWidth: 25, halign: 'right' }   // Total
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 120;

    // === Simplified Totals Section ===
    const total = Number(quotation.total_amount);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Total Amount:', pageWidth - margin - 50, finalY + 10, { align: 'right' });
    doc.text(`$${total.toFixed(2)}`, pageWidth - margin, finalY + 10, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // === Notes Section ===
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.subtle);
    doc.text('Notes:', margin, finalY + 25);
    doc.text('1. This quotation is valid for 30 days from the date of issue.', margin, finalY + 30);
    doc.text('2. Prices are subject to change without prior notice.', margin, finalY + 35);

    // === Footer Section ===
    const footerY = doc.internal.pageSize.getHeight() - 20;
    
    // Company contact info
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.subtle);
    doc.text('Thank you for your business!', margin, footerY);
    
    const companyContacts = [
      '315 Samora Machel Avenue, Eastlea, HARARE',
      'Phone: +263 867 719 4229 | Email: sales@malonicaluminium.co.zw',
      'Website: https://malonicaluminium.co.zw'
    ];
    
    companyContacts.forEach((line, index) => {
      doc.text(line, pageWidth - margin, footerY + (index * 4), { align: 'right' });
    });

    // Page number
    doc.text(`Page 1 of 1`, pageWidth / 2, footerY + 8, { align: 'center' });

    // === Enhanced Signatures Section ===
    const signatureY = footerY - 40;
    const signatureLineLength = 60;
    
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    
    // Left signature (Company)
    doc.text('Authorized Signature', margin, signatureY);
    doc.setDrawColor(...COLORS.subtle);
    doc.setLineWidth(0.5);
    doc.line(margin, signatureY + 2, margin + signatureLineLength, signatureY + 2);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.subtle);
    doc.text('Name:', margin, signatureY + 8);
    doc.line(margin, signatureY + 9, margin + signatureLineLength, signatureY + 9);
    doc.text('Date:', margin, signatureY + 16);
    doc.line(margin, signatureY + 17, margin + signatureLineLength, signatureY + 17);
    
    // Right signature (Client)
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text('Customer Acceptance', pageWidth - margin - signatureLineLength, signatureY, { align: 'left' });
    doc.setDrawColor(...COLORS.subtle);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - signatureLineLength, signatureY + 2, pageWidth - margin, signatureY + 2);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.subtle);
    doc.text('Name:', pageWidth - margin - signatureLineLength, signatureY + 8);
    doc.line(pageWidth - margin - signatureLineLength, signatureY + 9, pageWidth - margin, signatureY + 9);
    doc.text('Date:', pageWidth - margin - signatureLineLength, signatureY + 16);
    doc.line(pageWidth - margin - signatureLineLength, signatureY + 17, pageWidth - margin, signatureY + 17);

    doc.save(`Quotation-${quotation.id}.pdf`);
    notify.success('PDF generated successfully');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    notify.error('Failed to generate PDF');
  }
};