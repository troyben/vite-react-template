import type { QuotationItem } from '@/services/quotationService';

/**
 * Quotation totals calculation helpers.
 *
 * Backend contract:
 *   total_amount  = sum of line items (subtotal)
 *   vat_percent   = 0..100
 *   transport_fee = >= 0
 *   grand_total   = total_amount + total_amount * vat_percent / 100 + transport_fee
 *                   (RESPONSE-ONLY — never sent in requests)
 */

export interface QuotationTotals {
  subtotal: number;
  vatAmount: number;
  transportFee: number;
  grandTotal: number;
}

const safeNumber = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Compute the items subtotal (sum of `quantity * price` per item). */
export function calculateSubtotal(items: QuotationItem[]): number {
  return items.reduce((sum, item) => sum + safeNumber(item.quantity) * safeNumber(item.price), 0);
}

/** Compute the full totals breakdown given subtotal, VAT %, transport fee. */
export function computeTotals(
  subtotal: number,
  vatPercent: number,
  transportFee: number,
): QuotationTotals {
  const sub = safeNumber(subtotal);
  const vat = safeNumber(vatPercent);
  const transport = safeNumber(transportFee);
  const vatAmount = +(sub * (vat / 100)).toFixed(2);
  const grandTotal = +(sub + vatAmount + transport).toFixed(2);
  return {
    subtotal: sub,
    vatAmount,
    transportFee: transport,
    grandTotal,
  };
}

/** Convenience: compute totals from raw items + VAT + transport. */
export function computeQuotationTotals(
  items: QuotationItem[],
  vatPercent: number,
  transportFee: number,
): QuotationTotals {
  return computeTotals(calculateSubtotal(items), vatPercent, transportFee);
}
