import React from 'react';
import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import { extractShapeCanvasProps } from '@/utils/templateSketchProps';
import { formatCurrency } from '@/config/currency';
import type { QuotationItem } from '@/services/quotationService';
import { computeTotals } from '@/utils/quotationTotals';

interface QuotationPDFPreviewProps {
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuotationItem[];
  /** Subtotal — sum of line items. */
  totalAmount: number;
  /** 0..100. Defaults to 0 (no VAT row rendered when 0). */
  vatPercent?: number;
  /** >= 0. Defaults to 0 (no Transport row rendered when 0). */
  transportFee?: number;
  /** Optional precomputed grand total; if absent, computed from the three above. */
  grandTotal?: number;
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
  vatPercent = 0,
  transportFee = 0,
  grandTotal,
  quotationId,
  createdAt,
}) => {
  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalItemsAmount = items.reduce((sum, it) => sum + it.total, 0);
  // Subtotal precedence: explicit totalAmount prop, falling back to summed items.
  const subtotal = Number.isFinite(totalAmount) ? totalAmount : totalItemsAmount;
  const totals = computeTotals(subtotal, vatPercent, transportFee);
  const grand = typeof grandTotal === 'number' ? grandTotal : totals.grandTotal;
  const showVatRow = true;
  const showTransportRow = true;

  return (
    <div
      className="mx-auto bg-white shadow-lg border border-gray-200 overflow-hidden"
      style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      <div className="px-[12mm] pt-[12mm] pb-[8mm]">
        {/* ── Disclaimer ── */}
        <div
          className="relative mb-[5mm] rounded-[1.5mm] border text-[7.5pt] italic"
          style={{
            backgroundColor: 'rgb(255, 250, 235)',
            borderColor: 'rgb(215, 220, 235)',
            color: 'rgb(100, 80, 40)',
            padding: '3mm',
            paddingLeft: '4.2mm',
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-l-[1.5mm]"
            style={{ width: '1.2mm', backgroundColor: 'rgb(230, 160, 50)' }}
          />
          All dimensions on drawings are in mm(metric system) and represent rough opening sizes, any other notes in imperial system might not reflect the final production sizes or R.O.(rough opening) sizes and will not be considered valid. All windows and doors are view from inside the house.
        </div>

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
                        {...extractShapeCanvasProps(item.productSketch, { printMode: true })}
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
          <div style={{ width: '70mm' }}>
            <div className="flex justify-between text-[9pt] mb-[1.5mm]" style={{ color: 'rgb(33, 33, 33)' }}>
              <span>Total Pieces:</span>
              <span>{totalPieces}</span>
            </div>
            <div className="flex justify-between text-[9pt] mb-[1.5mm]" style={{ color: 'rgb(33, 33, 33)' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {showVatRow && (
              <div className="flex justify-between text-[9pt] mb-[1.5mm]" style={{ color: 'rgb(33, 33, 33)' }}>
                <span>VAT ({vatPercent}%):</span>
                <span>{formatCurrency(totals.vatAmount)}</span>
              </div>
            )}
            {showTransportRow && (
              <div className="flex justify-between text-[9pt] mb-[3mm]" style={{ color: 'rgb(33, 33, 33)' }}>
                <span>Transport:</span>
                <span>{formatCurrency(transportFee)}</span>
              </div>
            )}
            <div style={{ borderTop: '0.3mm solid rgb(215, 220, 235)' }} className="mb-[4mm]" />
            <div className="flex justify-between text-[11pt] font-bold" style={{ color: 'rgb(1, 30, 75)' }}>
              <span>Grand Total:</span>
              <span>{formatCurrency(grand)}</span>
            </div>
          </div>
        </div>

        {/* ── Important Notes ── */}
        <div
          className="mt-[8mm] rounded-[1.5mm] border text-[7.5pt]"
          style={{
            backgroundColor: 'rgb(255, 250, 235)',
            borderColor: 'rgb(215, 220, 235)',
            color: 'rgb(80, 60, 30)',
            padding: '3mm',
            paddingLeft: '4.2mm',
            position: 'relative',
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-l-[1.5mm]"
            style={{ width: '1.2mm', backgroundColor: 'rgb(230, 160, 50)' }}
          />
          <div className="font-bold mb-[1.2mm] text-[8pt]" style={{ color: 'rgb(140, 90, 20)' }}>
            Important Notes
          </div>
          <div>
            Customer is responsible to remove the protection film (if applicable) cover in maximum 2 months from installation. The plastic can glue to frame from intense sun exposure and heat and might not come out easy or even might remain on frames permanently. In this case manufacturer is not responsible if protection film cover can not be removed.
          </div>
        </div>

        {/* ── Signatures ── */}
        <div className="flex justify-between mt-[12mm] px-[2mm]">
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
