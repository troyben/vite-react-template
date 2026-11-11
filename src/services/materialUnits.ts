/** Pricing units. Usage coefficients are in the selected unit; pack sizes are never inferred.
 * Keep this registry aligned with the other Malonic application's materialUnits.ts.
 */
export const MATERIAL_UNITS = {
  per_meter: { label: 'Per Meter', symbol: 'm', noun: 'metre', whole: false },
  per_cm: { label: 'Per Centimetre (cm)', symbol: 'cm', noun: 'centimetre', whole: false },
  per_mm: { label: 'Per Millimetre (mm)', symbol: 'mm', noun: 'millimetre', whole: false },
  per_sqm: { label: 'Per Square Meter', symbol: 'm²', noun: 'square metre', whole: false },
  per_cubic_meter: { label: 'Per Cubic Metre (m³)', symbol: 'm³', noun: 'cubic metre', whole: false },
  per_ml: { label: 'Per Millilitre (ml)', symbol: 'ml', noun: 'millilitre', whole: false },
  per_litre: { label: 'Per Litre (L)', symbol: 'L', noun: 'litre', whole: false },
  per_gram: { label: 'Per Gram (g)', symbol: 'g', noun: 'gram', whole: false },
  per_kg: { label: 'Per Kilogram', symbol: 'kg', noun: 'kilogram', whole: false },
  per_tonne: { label: 'Per Tonne (t)', symbol: 't', noun: 'tonne', whole: false },
  per_piece: { label: 'Per Piece', symbol: 'pcs', noun: 'piece', whole: true },
  per_pair: { label: 'Per Pair', symbol: 'pairs', noun: 'pair', whole: true },
  per_set: { label: 'Per Set', symbol: 'sets', noun: 'set', whole: true },
  per_sheet: { label: 'Per Sheet', symbol: 'sheets', noun: 'sheet', whole: true },
  per_length: { label: 'Per Stock Length', symbol: 'lengths', noun: 'stock length', whole: true },
  per_roll: { label: 'Per Roll', symbol: 'rolls', noun: 'roll', whole: true },
  per_pack: { label: 'Per Pack', symbol: 'packs', noun: 'pack', whole: true },
  per_box: { label: 'Per Box', symbol: 'boxes', noun: 'box', whole: true },
  per_bag: { label: 'Per Bag', symbol: 'bags', noun: 'bag', whole: true },
  per_tube: { label: 'Per Tube', symbol: 'tubes', noun: 'tube', whole: true },
  per_cartridge: { label: 'Per Cartridge', symbol: 'cartridges', noun: 'cartridge', whole: true },
} as const;
export type MaterialUnit = keyof typeof MATERIAL_UNITS;
export const MATERIAL_UNIT_OPTIONS = Object.entries(MATERIAL_UNITS).map(([value, unit]) => ({ value: value as MaterialUnit, label: unit.label }));
export const MATERIAL_UNIT_SYMBOLS = Object.fromEntries(Object.entries(MATERIAL_UNITS).map(([value, unit]) => [value, unit.symbol])) as Record<MaterialUnit, string>;
const wholeSymbols = new Set<string>(Object.values(MATERIAL_UNITS).filter(unit => unit.whole).map(unit => unit.symbol));
export function isWholeCostingUnit(symbol: string): boolean { return wholeSymbols.has(symbol); }
