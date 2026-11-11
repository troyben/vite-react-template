import { expect, it } from 'vitest';
import { MATERIAL_UNITS, MATERIAL_UNIT_SYMBOLS, type MaterialUnit } from './materialUnits';
import { UNIT_OPTIONS, materialPriceHelp } from './materialFormService';
import { materialLine, lineQuantity, lineTotal } from './costingService';
import { usageSummary } from './materialUsageService';
import type { Material } from './materialService';
const fixture = (unit: MaterialUnit): Material => ({ id: 1, name: 'Material', category: 'accessory', unit, costPrice: 10,
  createdAt: '', updatedAt: '', properties: { applicableTo: 'both', usageRule: { enabled: true, basis: 'per_product', quantity: 0.25, wastagePercent: 10 } } });

it('offers common measurement and supply units with pricing and usage labels throughout costing', () => {
  const expected = ['m', 'cm', 'mm', 'm²', 'm³', 'ml', 'L', 'g', 'kg', 't', 'pcs', 'pairs', 'sets', 'sheets', 'lengths', 'rolls', 'packs', 'boxes', 'bags', 'tubes', 'cartridges'];
  expect(Object.values(MATERIAL_UNIT_SYMBOLS)).toEqual(expected);
  expect(UNIT_OPTIONS).toHaveLength(21);
  for (const option of UNIT_OPTIONS) {
    const definition = MATERIAL_UNITS[option.value];
    expect(materialPriceHelp(option.value)).toContain(`one ${definition.noun}`);
    expect(materialLine(fixture(option.value)).unit).toBe(definition.symbol);
    expect(usageSummary(fixture(option.value))).toContain(option.value === 'per_piece' ? 'pieces' : definition.symbol);
  }
  expect(materialPriceHelp('per_pack')).toContain('Usage quantities are in packs');
  expect(materialPriceHelp('per_length')).toContain('one stock length');
});
it('buys whole supply units while retaining fractional consumption and decimal measurement units', () => {
  for (const unit of ['per_sheet', 'per_length', 'per_roll', 'per_pack', 'per_box', 'per_set', 'per_pair', 'per_bag', 'per_tube', 'per_cartridge'] as MaterialUnit[]) {
    const line = { ...materialLine(fixture(unit)), quantity: 1.2, wastagePercent: 10 };
    expect(lineQuantity(line)).toBe(2); expect(lineTotal(line)).toBe(20); expect(line.quantity).toBe(1.2);
  }
  for (const unit of ['per_meter', 'per_cm', 'per_mm', 'per_sqm', 'per_cubic_meter', 'per_litre', 'per_ml', 'per_gram', 'per_kg', 'per_tonne'] as MaterialUnit[]) {
    const line = { ...materialLine(fixture(unit)), quantity: 1.2, wastagePercent: 10 };
    expect(lineQuantity(line)).toBe(1.32); expect(lineTotal(line)).toBe(13.2);
  }
});
