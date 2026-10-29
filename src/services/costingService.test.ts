import { describe, expect, it, vi } from 'vitest';
import { costingTotals, emptyCosting, previewCosting, previewProductMaterials, lineQuantity, materialLine, quantitiesText } from './costingService';
import api from '@/api';
import { usageSummary } from './materialUsageService';
import type { Material } from './materialService';
const material = (id: number, category: Material['category'], properties: Record<string, unknown>, overrides: Partial<Material> = {}): Material => ({
  id, name: `Material ${id}`, category, properties, unit: category === 'glass' ? 'per_sqm' : category === 'frame_profile' ? 'per_meter' : 'per_piece',
  currency: 'USD', costPrice: 5, createdAt: '', updatedAt: '', ...overrides,
});
const catalogue = [material(1, 'frame_profile', { profileType: 'outer_frame' }), material(2, 'glass', { glassType: 'clear' }),
  material(3, 'hardware', { hardwareType: 'hinge' }), material(4, 'hardware', { hardwareType: 'handle' })];
describe('quotation costing', () => {
  it('requests canonical server previews without client-side usage assumptions', async () => {
    const snapshot = { ...emptyCosting(), totalMaterialCost: 90 };
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true, data: snapshot } });
    try { expect(await previewCosting([], '13')).toEqual(snapshot); expect(post).toHaveBeenCalledWith('/quotations/costing-preview', { items: [], quotationId: '13', currency: 'USD' }); }
    finally { post.mockRestore(); }
  });
  it('uses the same rules and purchasing quantities in template previews', async () => {
    const snapshot = { ...emptyCosting(), lines: [{ id: 'auto-1', materialId: 1, name: 'Glass', category: 'Glass', unit: 'm²', quantity: 9, unitCost: 10, wastagePercent: 10 }] };
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true, data: snapshot } });
    try {
      const result = await previewProductMaterials({ type: 'window', width: 3, height: 3, unit: 'm', panels: 1 });
      expect(result.breakdown.glassItems[0].quantity).toBe(9.9);
      expect(result.breakdown.totalCost).toBe(99);
    } finally { post.mockRestore(); }
  });
  it('describes configured default consumption in the catalogue', () => {
    expect(usageSummary({ ...catalogue[2], properties: { applicableTo: 'door', usageRule: { enabled: true, basis: 'per_product', quantity: 3, wastagePercent: 0 } } })).toBe('3 pieces · each door / window · doors');
    expect(usageSummary(catalogue[0])).toBe('Not included automatically');
  });
  it('rounds purchasing pieces up and computes markup on all job costs', () => {
    const line = { ...materialLine(catalogue[2]), quantity: 3, wastagePercent: 10, unitCost: 2.5 };
    expect(lineQuantity(line)).toBe(4);
    expect(costingTotals({ ...emptyCosting(), lines: [line], labour: 10, otherCosts: 5, markupPercent: 20 }))
      .toEqual({ materials: 10, cost: 25, markup: 5, sellingPrice: 30 });
  });
  it('exports purchasing quantities without internal rates or labour', () => {
    const text = quantitiesText({ ...emptyCosting(), lines: [{ ...materialLine(catalogue[0]), quantity: 4, wastagePercent: 10 }], labour: 9999 }, 'Quotation #1');
    expect(text).toContain('4.4 m');
    expect(text).not.toContain('9999');
    expect(text).not.toContain('unitCost');
    expect(text).not.toContain('$');
  });
});

it('preserves material specifications as values when adding catalogue lines', () => {
  const source = material(11, 'accessory', { thickness: 3, usageRule: { enabled: true, quantity: 2 } });
  const line = materialLine(source);
  source.properties!.thickness = 99;
  expect(line.materialSnapshot?.properties.thickness).toBe(3);
});
it('sends the loaded revision on costing saves and returns the new token', async () => {
  const { loadCosting, saveCosting } = await import('./costingService');
  const snapshot = emptyCosting();
  const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: snapshot, revision: 4 } });
  const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true, data: snapshot, revision: 5 } });
  try {
    const loaded = await loadCosting('13');
    expect(loaded.revision).toBe(4);
    expect(await saveCosting('13', snapshot, loaded.revision)).toEqual({ snapshot, revision: 5 });
    expect(put).toHaveBeenCalledWith('/quotations/13/costing', { ...snapshot, expectedRevision: 4 });
  } finally { get.mockRestore(); put.mockRestore(); }
});
