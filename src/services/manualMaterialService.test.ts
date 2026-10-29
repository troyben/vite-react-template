import { expect, it, vi } from 'vitest';
import api from '@/api';
import { addManualMaterial, catalogueOptions, manualMaterialsWithoutItem, validManualQuantity, withQuotationItemIds } from './manualMaterialService';
import { PROFILE_OPTIONS, matchesOption } from './describedOptions';
import { previewMaterialCostReport } from './materialCostReportService';
import { createQuotation, updateQuotation, type QuotationItem } from './quotationService';
import type { Material } from './materialService';
const material: Material = { id: 7, name: 'Extra hinge', category: 'hardware', unit: 'per_piece', currency: 'USD', costPrice: 3,
  description: 'For heavy doors', properties: { hardwareType: 'hinge', usageRule: { enabled: false } }, image: 'private image', createdAt: '', updatedAt: '' };
const item: QuotationItem = { item: 'Door', quantity: 2, price: 10, total: 20 };

it('searches descriptions and labels and restricts catalogue choices to the estimate currency', () => {
  expect(PROFILE_OPTIONS.filter(option => matchesOption(option, 'vertical divider')).map(option => option.value)).toEqual(['mullion']);
  expect(PROFILE_OPTIONS.filter(option => matchesOption(option, ' OUTER ')).map(option => option.value)).toEqual(['outer_frame']);
  const options = catalogueOptions([material, { ...material, id: 8, currency: 'ZAR' }], 'USD');
  expect(options).toHaveLength(1); expect(matchesOption(options[0], 'heavy doors')).toBe(true);
  expect(options[0].description).toContain('$3.00 / pcs'); expect(options[0].description).toContain('Not included automatically');
});
it('captures a manual price without images or mutating defaults, assigns explicit totals, and removes only the deleted item’s lines', () => {
  const before = JSON.stringify(material);
  const one = addManualMaterial(material, 6, 5, 'door');
  const two = addManualMaterial(material, 2, 0, 'window');
  const quote = addManualMaterial(material, 10, 0);
  material.costPrice = 99;
  expect(one.unitCost).toBe(3); expect(one.materialSnapshot?.costPrice).toBe(3);
  expect(one.materialSnapshot).not.toHaveProperty('image'); expect(one.quantity).toBe(6);
  expect(manualMaterialsWithoutItem([one, two, quote], 'window')).toEqual([one, quote]);
  expect(manualMaterialsWithoutItem([one], undefined)).toEqual([one]);
  material.costPrice = 3; expect(JSON.stringify(material)).toBe(before);
  expect(validManualQuantity(0, 0)).toBe(false); expect(validManualQuantity(1, -1)).toBe(false);
  expect(validManualQuantity(Infinity, 0)).toBe(false); expect(validManualQuantity(1, 1001)).toBe(false);
});
it('creates distinct stable item IDs and preserves surviving IDs across removal and reload', () => {
  const items = withQuotationItemIds([item, item, { ...item, id: 'existing' }, { ...item, id: 'existing' }]);
  expect(new Set(items.map(row => row.id)).size).toBe(4);
  expect(items[2].id).toBe('existing'); expect(item.id).toBeUndefined();
  expect(withQuotationItemIds(items.slice(1)).map(row => row.id)).toEqual(items.slice(1).map(row => row.id));
});
it('sends private manual drafts only through explicit costing-preview and quotation write fields', async () => {
  const manualMaterials = [addManualMaterial(material, 6, 0, 'door')];
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true, data: { itemCosts: { total: 18 } } } });
  const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } });
  try {
    await previewMaterialCostReport([{ ...item, id: 'door' }], '1', manualMaterials);
    expect(post.mock.calls[0][1]).toMatchObject({ manualMaterials, includeItemCosts: true });
    const data = { clientId: 1, client_name: 'Client', client_email: '', items: [{ ...item, id: 'door' }], total_amount: 20, vat_percent: 0, transport_fee: 0, status: 'draft' as const, manualMaterials };
    await createQuotation(data); await updateQuotation(1, { ...data, revision: 1 });
    expect(post.mock.calls[1][1]).toMatchObject({ manualMaterials, items: [{ ...item, id: 'door' }] });
    expect(put.mock.calls[0][1]).toMatchObject({ manualMaterials, revision: 1 });
    expect(data.items[0]).not.toHaveProperty('manualMaterials');
  } finally { post.mockRestore(); put.mockRestore(); }
});
