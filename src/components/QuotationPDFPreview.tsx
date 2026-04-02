import React from 'react';
import ShapeCanvas from '@/components/template-creator/ShapeCanvas';
import { extractShapeCanvasProps } from '@/utils/templateSketchProps';
import { formatCurrency } from '@/config/currency';
import type { QuotationItem } from '@/services/quotationService';

interface QuotationPDFPreviewProps {
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuotationItem[];
  totalAmount: number;
  quotationId?: number;
  createdAt?: string;
}

const COMPANY = {
  name: 'Malonic Aluminium & Glass',
  address: '315 Samora Machel Avenue, Eastlea, HARARE',
  phone: '+263 867 719 4229',
  email: 'sales@malonicaluminium.co.zw',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const QuotationPDFPreview: React.FC<QuotationPDFPreviewProps> = ({
  clientName,
  clientPhone,
  clientAddress,
  items,
  totalAmount,
  quotationId,
  createdAt,
}) => {
  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalItemsAmount = items.reduce((sum, it) => sum + it.total, 0);

  return (
    <div
      className="mx-auto bg-white shadow-lg border border-gray-200 overflow-hidden"
      style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      <div className="px-[12mm] pt-[12mm] pb-[8mm]">
        {/* ── Row 1: Logo + Company Name | Quotation # + Date ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-[10mm] w-[26mm] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-[11pt] font-bold" style={{ color: 'rgb(1, 30, 75)' }}>
              {COMPANY.name}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[8pt]" style={{ color: 'rgb(130, 130, 130)' }}>
              {quotationId ? `Quotation #${quotationId}` : 'Quotation'}
            </div>
            <div className="text-[8pt]" style={{ color: 'rgb(33, 33, 33)' }}>
              {formatDate(createdAt)}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-[4mm]" style={{ borderTop: '0.3mm solid rgb(215, 220, 235)' }} />

        {/* ── Row 2: Bill To | From ── */}
        <div className="flex justify-between gap-8">
          {/* Bill To */}
          <div className="flex-1">
            <div className="text-[7pt] font-bold uppercase tracking-wide mb-1" style={{ color: 'rgb(130, 130, 130)' }}>
              Bill To
            </div>
            <div className="text-[9pt] font-bold" style={{ color: 'rgb(33, 33, 33)' }}>
              {clientName || 'N/A'}
            </div>
            {clientAddress && (
              <div className="text-[8pt] mt-[1mm]" style={{ color: 'rgb(130, 130, 130)' }}>
                {clientAddress}
              </div>
            )}
            {clientPhone && (
              <div className="text-[8pt] mt-[1mm]" style={{ color: 'rgb(130, 130, 130)' }}>
                Tel: {clientPhone}
              </div>
            )}
          </div>

          {/* From */}
          <div className="flex-1 pl-[10mm]">
            <div className="text-[7pt] font-bold uppercase tracking-wide mb-1" style={{ color: 'rgb(130, 130, 130)' }}>
              From
            </div>
            <div className="text-[8pt] font-bold" style={{ color: 'rgb(33, 33, 33)' }}>
              {COMPANY.name}
            </div>
            <div className="text-[8pt] mt-[1mm]" style={{ color: 'rgb(130, 130, 130)' }}>
              {COMPANY.address}
            </div>
            <div className="text-[8pt] mt-[1mm]" style={{ color: 'rgb(130, 130, 130)' }}>
              Tel: {COMPANY.phone}
            </div>
            <div className="text-[8pt] mt-[1mm]" style={{ color: 'rgb(130, 130, 130)' }}>
              {COMPANY.email}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-[4mm]" style={{ borderTop: '0.3mm solid rgb(215, 220, 235)' }} />

        {/* ── Items Table ── */}
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: 'rgb(1, 30, 75)' }}>
              <th className="text-[7.5pt] font-bold text-white text-left py-[1.5mm] px-[2mm]">Sketch</th>
              <th className="text-[7.5pt] font-bold text-white text-left py-[1.5mm] px-[2mm]">Product / Description</th>
              <th className="text-[7.5pt] font-bold text-white text-center py-[1.5mm] px-[2mm]">QTY</th>
              <th className="text-[7.5pt] font-bold text-white text-right py-[1.5mm] px-[2mm]">Unit Price</th>
              <th className="text-[7.5pt] font-bold text-white text-right py-[1.5mm] px-[2mm]">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? 'rgb(248, 249, 253)' : 'rgb(255, 255, 255)',
                  borderBottom: '0.15mm solid rgb(215, 220, 235)',
                }}
              >
                {/* Sketch */}
                <td className="py-[2mm] px-[2mm] align-middle">
                  {item.productSketch ? (
                    <div className="flex items-center justify-center" style={{ minHeight: '22mm' }}>
                      <ShapeCanvas
                        {...extractShapeCanvasProps(item.productSketch)}
                        svgStyle={{ width: '100%', maxWidth: '42mm', maxHeight: '38mm', height: 'auto' }}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center text-[7pt]"
                      style={{ color: 'rgb(130, 130, 130)', minHeight: '22mm' }}
                    >
                      No sketch
                    </div>
                  )}
                </td>

                {/* Product / Description */}
                <td className="py-[2mm] px-[2mm] align-middle">
                  <div className="text-[8.5pt] font-bold" style={{ color: 'rgb(33, 33, 33)' }}>
                    {item.item || 'Untitled'}
                  </div>
                  {item.description && (
                    <div className="text-[8pt] mt-[0.5mm]" style={{ color: 'rgb(130, 130, 130)' }}>
                      {item.description}
                    </div>
                  )}
                </td>

                {/* QTY */}
                <td className="py-[2mm] px-[2mm] align-middle text-center text-[8pt]" style={{ color: 'rgb(33, 33, 33)' }}>
                  {item.quantity}
                </td>

                {/* Unit Price */}
                <td className="py-[2mm] px-[2mm] align-middle text-right text-[8pt]" style={{ color: 'rgb(33, 33, 33)' }}>
                  {formatCurrency(item.price)}
                </td>

                {/* Total */}
                <td className="py-[2mm] px-[2mm] align-middle text-right text-[8pt] font-bold" style={{ color: 'rgb(1, 30, 75)' }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Summary (right-aligned) ── */}
        <div className="flex justify-end mt-[6mm]">
          <div style={{ width: '55mm' }}>
            <div className="flex justify-between text-[9pt] mb-[1.5mm]" style={{ color: 'rgb(33, 33, 33)' }}>
              <span>Total Pieces:</span>
              <span>{totalPieces}</span>
            </div>
            <div className="flex justify-between text-[9pt] mb-[3mm]" style={{ color: 'rgb(33, 33, 33)' }}>
              <span>Total Amount:</span>
              <span>{formatCurrency(totalItemsAmount)}</span>
            </div>
            <div style={{ borderTop: '0.3mm solid rgb(215, 220, 235)' }} className="mb-[4mm]" />
            <div className="flex justify-between text-[11pt] font-bold" style={{ color: 'rgb(1, 30, 75)' }}>
              <span>Grand Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── Signatures ── */}
        <div className="flex justify-between mt-[16mm] px-[2mm]">
          <div style={{ width: '55mm' }}>
            <div style={{ borderTop: '0.3mm solid rgb(215, 220, 235)' }} />
            <div className="text-[7pt] mt-[1.5mm]" style={{ color: 'rgb(130, 130, 130)' }}>
              Authorized Signature
            </div>
          </div>
          <div style={{ width: '55mm' }}>
            <div style={{ borderTop: '0.3mm solid rgb(215, 220, 235)' }} />
            <div className="text-[7pt] mt-[1.5mm]" style={{ color: 'rgb(130, 130, 130)' }}>
              Customer Acceptance
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center text-[6.5pt] py-[3mm]" style={{ color: 'rgb(130, 130, 130)' }}>
        Thank you for your business!
      </div>
    </div>
  );
};

export default QuotationPDFPreview;
