import type { QuotationItem } from '@/services/quotationService';

/**
 * Quotation totals calculation helpers.
 *
 * Backend contract:
 *   total_amount  = sum of line items (subtotal)
 *   vat_percent   = 0..100
 *   transport_fee = >= 0
 *   discount_amount = >= 0, fixed currency amount
 *   grand_total   = max(0, total_amount + VAT + transport_fee - discount_amount)
 *                   (RESPONSE-ONLY — never sent in requests)
 */

export interface QuotationTotals {
  subtotal: number;
  vatAmount: number;
  transportFee: number;
  discountAmount: number;
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

/** Compute the full totals breakdown given subtotal, VAT %, transport fee and fixed discount. */
export function computeTotals(
  subtotal: number,
  vatPercent: number,
  transportFee: number,
  discountAmount = 0,
): QuotationTotals {
  const sub = safeNumber(subtotal);
  const vat = safeNumber(vatPercent);
  const transport = safeNumber(transportFee);
  const vatAmount = +(sub * (vat / 100)).toFixed(2);
  const discount = Math.max(0, safeNumber(discountAmount));
  const grandTotal = +Math.max(0, sub + sub * vat / 100 + transport - discount).toFixed(2);
  return {
    subtotal: sub,
    vatAmount,
    transportFee: transport,
    discountAmount: discount,
    grandTotal,
  };
}

/** Convenience: compute totals from raw items + VAT + transport - discount. */
export function computeQuotationTotals(
  items: QuotationItem[],
  vatPercent: number,
  transportFee: number,
  discountAmount = 0,
): QuotationTotals {
  return computeTotals(calculateSubtotal(items), vatPercent, transportFee, discountAmount);
}
