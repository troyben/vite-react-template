import { expect, it, vi } from 'vitest';
import api from '@/api';
import { createQuotation, updateQuotation } from './quotationService';
import { addManualMaterial, catalogueOptions } from './manualMaterialService';
import { usageSummary } from './materialUsageService';
import { fixedQuotationDiscount } from './quotationPresentationService';
import type { Material } from './materialService';

it('sends a fixed discount in create/update payloads while keeping grand_total response-only', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });
  const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } });
  const quotation = { clientId: 1, client_name: 'Client', client_email: '', items: [{ item: 'Window', quantity: 2, price: 100, total: 200 }],
    total_amount: 200, vat_percent: 15, transport_fee: 10, discount_amount: 25, grand_total: 215, status: 'draft' as const };
  try {
    await createQuotation(quotation); await updateQuotation(1, { ...quotation, revision: 1 });
    expect(post.mock.calls[0][1]).toMatchObject({ discount_amount: 25 });
    expect(post.mock.calls[0][1]).not.toHaveProperty('grand_total');
    expect(put.mock.calls[0][1]).toMatchObject({ discount_amount: 25, revision: 1 });
    expect(put.mock.calls[0][1]).not.toHaveProperty('grand_total');
    await updateQuotation(1, { revision: 2, discount_amount: 0 });
    expect(put.mock.calls[1][1]).toMatchObject({ discount_amount: 0 });
  } finally { post.mockRestore(); put.mockRestore(); }
});
it('labels silicone costs and captured manual quantities in ml', () => {
  const silicone: Material = { id: 3, name: 'Silicone', category: 'accessory', unit: 'per_ml', costPrice: 0.05, currency: 'USD', createdAt: '', updatedAt: '',
    properties: { applicableTo: 'both', usageRule: { enabled: true, basis: 'perimeter', quantity: 10, wastagePercent: 0 } } };
  expect(catalogueOptions([silicone], 'USD')[0].description).toContain('$0.05 / ml');
  expect(usageSummary(silicone)).toContain('10 ml');
  expect(addManualMaterial(silicone, 121.5, 0)).toMatchObject({ unit: 'ml', quantity: 121.5, unitCost: 0.05 });
});

it('normalizes editable discounts to nonnegative currency amounts before previews and saves', () => {
  expect(fixedQuotationDiscount('12.345')).toBe(12.35);
  expect(fixedQuotationDiscount('')).toBe(0);
  expect(fixedQuotationDiscount('-5')).toBe(0);
  expect(fixedQuotationDiscount('Infinity')).toBe(0);
});
