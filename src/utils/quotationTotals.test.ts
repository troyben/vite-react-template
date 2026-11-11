import { expect, it } from 'vitest';
import { computeTotals, computeQuotationTotals } from './quotationTotals';

it('deducts a fixed amount after VAT and transport and restores the original total when cleared', () => {
  expect(computeTotals(200, 15, 10, 25)).toMatchObject({ subtotal: 200, vatAmount: 30, discountAmount: 25, grandTotal: 215 });
  expect(computeTotals(200, 15, 10).grandTotal).toBe(240);
  expect(computeTotals(200, 15, 10, 0).grandTotal).toBe(240);
  expect(computeTotals(200, 15, 10, 300).grandTotal).toBe(0);
});
it('keeps fractional prices and totals finite and rounds the final payable amount to cents', () => {
  expect(computeTotals(100.05, 15, 10.25, 12.34).grandTotal).toBe(112.97);
  expect(computeTotals(1.01, 15, 0.01, 0.01).grandTotal).toBe(1.16);
  expect(computeTotals(100, 0, 0, NaN).grandTotal).toBe(100);
  expect(computeTotals(100, 0, 0, -5).grandTotal).toBe(100);
  expect(computeQuotationTotals([{ item: 'Window', quantity: 2, price: 100, total: 0 }], 15, 10, 25).grandTotal).toBe(215);
});
