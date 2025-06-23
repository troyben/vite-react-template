import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MiniSketchPreview from "../components/MiniSketchPreview";
import ReactDOM from "react-dom/client";
import React from "react";
import type { Quotation } from '../services/quotationService';
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

export async function exportQuotationToPDF(quotation: Quotation) {
  try {
    const doc: any = new jsPDF({
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
    let currentY = 15;

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, currentY, 40, 15);
    }
    currentY += 10;

    // Company name in header - dark color
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.dark);
    doc.setFont(undefined, 'bold');
    doc.text('Malonic Aluminium & Glass', pageWidth - margin, currentY + 10, { align: 'right' });
    doc.setFont(undefined, 'normal');
    currentY += 20;

    // === Quotation Title Section ===
    doc.setFontSize(24);
    doc.setTextColor(...COLORS.primary);
    doc.text('QUOTATION', margin, currentY + 15);
    currentY += 15;

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
    ];

    const infoStartY = currentY + 5;
    quotationInfo.forEach((info, index) => {
      doc.text(`${info.label}:`, pageWidth - margin - 30, infoStartY + (index * 5), { align: 'right' });
      doc.text(info.value.toString(), pageWidth - margin, infoStartY + (index * 5), { align: 'right' });
    });
    currentY = infoStartY + quotationInfo.length * 5 + 5;

    // Divider line
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // === Client Information Section ===
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text('BILL TO:', margin, currentY + 5);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    const clientInfo = [
      quotation.client_name,
      quotation.client_address || 'Address not specified',
      `Phone: ${quotation.client_phone || 'N/A'}`,
    ];

    clientInfo.forEach((line, index) => {
      doc.text(line, margin, currentY + 10 + (index * 5));
    });
    currentY += 10 + clientInfo.length * 5 + 5;

    // === Items Section ===
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.text('Items', margin, currentY + 2);
    currentY += 6;

    // For page break logic
    const itemCardHeight = 95;
    const minBottomSpace = 60;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (const [index, item] of items.entries()) {
      // If not enough space for next item, add new page
      if (currentY + itemCardHeight + minBottomSpace > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      // Draw item card background (larger to accommodate details)
      doc.setFillColor(249, 250, 254); // #F9FAFE
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, itemCardHeight, 4, 4, 'F');

      // Item title
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.text(`Item #${index + 1}: ${item.item}`, margin + 4, currentY + 8);

      // Description
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
      if (item.description) {
        doc.text(item.description, margin + 4, currentY + 14);
      }

      // === Product Details Section ===
      const detailsLeft = margin + 4;
      let detailsY = currentY + 22;

      // Extract product sketch data
      const sketch = item.productSketch;
      const totalPanels = sketch?.panels || 0;
      const openingPanels = sketch?.openingPanels?.length || 0;
      const openingPanes = sketch?.openingPanes?.length || 0;

      // Calculate total divisions
      let totalDivisions = 0;
      if (sketch?.panelDivisions) {
        totalDivisions = sketch.panelDivisions.reduce((sum: any, panel: any) => {
          return sum + (panel.horizontalCount * panel.verticalCount);
        }, 0);
      }

      // Main dimensions
      doc.text(`Window: ${sketch?.width || 0} × ${sketch?.height || 0} ${sketch?.unit || 'cm'}`, detailsLeft, detailsY);
      detailsY += 6;

      // Panels information
      doc.text(`Panels: ${totalPanels} total (${openingPanels} opening)`, detailsLeft, detailsY);
      detailsY += 6;

      // Divisions
      doc.text(`Divisions: ${totalDivisions} sections across panels`, detailsLeft, detailsY);
      detailsY += 6;

      // Opening panes
      doc.text(`Opening Panes: ${openingPanes} panes`, detailsLeft, detailsY);
      detailsY += 6;

      // Frame and glass type
      const frameColor = sketch?.frameColor === '#C0C0C0' ? 'Silver' :
        sketch?.frameColor === 'natural' ? 'Natural' :
          sketch?.frameColor || 'Not specified';
      doc.text(`Frame: ${frameColor}`, detailsLeft, detailsY);
      detailsY += 6;
      doc.text(`Glass: ${sketch?.glassType || 'clear'}`, detailsLeft, detailsY);
      detailsY += 6;

      // === Quantity and Pricing Section (in a column) ===
      let priceColY = currentY + 10;
      const priceColX = pageWidth - margin - 60;
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.text);
      doc.text(`Quantity: ${item.quantity}`, priceColX, priceColY);
      priceColY += 7;
      doc.text(`Unit Price: $${item.price.toFixed(2)}`, priceColX, priceColY);
      priceColY += 7;
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(`Item Total: $${item.total.toFixed(2)}`, priceColX, priceColY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...COLORS.text);

      // === Sketch Preview Section ===
      if (item.productSketch) {
        const imgData = await renderSketchToImage(item.productSketch);
        if (imgData) {
          // Position sketch to the right - taking most of the available width
          const sketchWidth = 100;
          const sketchHeight = 60;
          const sketchX = pageWidth - margin - sketchWidth - 5;
          const sketchY = currentY + 30;

          doc.addImage(
            imgData,
            "PNG",
            sketchX,
            sketchY,
            sketchWidth,
            sketchHeight
          );

          // Add border around sketch
          doc.setDrawColor(...COLORS.accent);
          doc.setLineWidth(0.2);
          doc.rect(sketchX, sketchY, sketchWidth, sketchHeight);

          // === PDF-ONLY DIMENSION LINES & LABELS ===
          // Horizontal (bottom) dimension line
          const dimColor = COLORS.primary;
          const arrowLen = 1; // smaller arrow
          const arrowHead = 1; // smaller arrow head
          // Align lines exactly with the sketch corners
          const bottomOffset = 2;
          const arrowY = sketchY + sketchHeight + bottomOffset;
          doc.setDrawColor(...dimColor);
          doc.setLineWidth(0.2); // thinner lines
          // Main line
          doc.line(sketchX, arrowY, sketchX + sketchWidth, arrowY);
          // Left arrow
          doc.line(sketchX, arrowY, sketchX + arrowLen, arrowY - arrowHead);
          doc.line(sketchX, arrowY, sketchX + arrowLen, arrowY + arrowHead);
          // Right arrow
          doc.line(sketchX + sketchWidth, arrowY, sketchX + sketchWidth - arrowLen, arrowY - arrowHead);
          doc.line(sketchX + sketchWidth, arrowY, sketchX + sketchWidth - arrowLen, arrowY + arrowHead);
          // Label
          doc.setFontSize(11);
          doc.setTextColor(...dimColor);
          doc.setFont(undefined, 'regular');
          doc.text(`${sketch.width} ${sketch.unit}`, sketchX + sketchWidth / 2, arrowY + 3, { align: 'center' });

          // Vertical (left) dimension line
          const arrowX = sketchX - 2;
          const verticalTop = sketchY;
          const verticalBottom = sketchY + sketchHeight;
          doc.setDrawColor(...dimColor);
          doc.setLineWidth(0.2);
          doc.line(arrowX, verticalTop, arrowX, verticalBottom);
          // Top arrow
          doc.line(arrowX, verticalTop, arrowX - arrowHead, verticalTop + arrowLen);
          doc.line(arrowX, verticalTop, arrowX + arrowHead, verticalTop + arrowLen);
          // Bottom arrow
          doc.line(arrowX, verticalBottom, arrowX - arrowHead, verticalBottom - arrowLen);
          doc.line(arrowX, verticalBottom, arrowX + arrowHead, verticalBottom - arrowLen);
          // Label
          doc.setFontSize(11);
          doc.setTextColor(...dimColor);
          doc.setFont(undefined, 'regular');
          doc.text(`${sketch.height} ${sketch.unit}`, arrowX + 10, sketchY + 6 + sketchHeight / 2, { align: 'right', angle: 90 });

          // === Panel Top Dimensions ===
          if (sketch.panelWidths && sketch.panelWidths.length > 1) {
            let px = sketchX;
            let totalWidth = 0;
            for (let i = 0; i < sketch.panelWidths.length; i++) {
              const panelW = sketch.panelWidths[i];
              const panelPx = (panelW / sketch.width) * sketchWidth;
              // Draw label above
              doc.setFontSize(8);
              doc.setTextColor(...dimColor);
              doc.setFont(undefined, 'regular');
              doc.text(`${panelW} ${sketch.unit}`, px + panelPx / 2, sketchY + 2, { align: 'center' });
              px += panelPx;
              totalWidth += panelW;
            }
            // End tick
          }
        }
      }

      currentY += itemCardHeight;
    }

    // === Total Section (always at the bottom of the last page) ===
    // If not enough space, add a new page
    if (currentY + 30 > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = 20;
    }
    const total = Number(quotation.total_amount);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Total Amount:', pageWidth - margin - 50, doc.internal.pageSize.getHeight() - 35, { align: 'right' });
    doc.text(`$${total.toFixed(2)}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 35, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // === Footer Section ===
    const footerY = doc.internal.pageSize.getHeight() - 20;

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


    // === Signatures Section ===
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

    doc.save(`Malonic-Aluminium-Quotation-${quotation.id}.pdf`);
    notify.success('PDF generated successfully');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    notify.error('Failed to generate PDF');
  }
};

async function renderSketchToImage(sketchData: any): Promise<string | null> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.height = "600px";
  container.style.backgroundColor = "#ffffff";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0",
          boxSizing: "border-box"
        }
      },
      React.createElement(MiniSketchPreview, {
        sketch: sketchData,
        widthPx: 800,
        heightPx: 620,
        pdfMode: true
      })
    )
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  let dataUrl: string | null = null;
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 4,
      logging: true,
      useCORS: true,
      allowTaint: true
    });
    dataUrl = canvas.toDataURL("image/png", 1.0);
  } catch (e) {
    console.error("Error rendering sketch:", e);
    dataUrl = null;
  }

  root.unmount();
  document.body.removeChild(container);

  return dataUrl;
}