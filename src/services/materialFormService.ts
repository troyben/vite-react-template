import { MATERIAL_UNITS } from './materialUnits';
import type { CreateMaterialData, MaterialCategory, MaterialUnit } from './materialService';
import type { MaterialUsageProperties } from './materialUsageService';

export const CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
  { value: 'frame_profile', label: 'Frame Profile' }, { value: 'glass', label: 'Glass' },
  { value: 'hardware', label: 'Hardware' }, { value: 'accessory', label: 'Accessory' },
];
export { MATERIAL_UNIT_OPTIONS as UNIT_OPTIONS } from './materialUnits';
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' }, { value: 'ZAR', label: 'ZAR — South African Rand' },
  { value: 'EUR', label: 'EUR — Euro' }, { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' }, { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' }, { value: 'CNY', label: 'CNY — Chinese Yuan' },
];
export const DEFAULT_UNITS: Record<MaterialCategory, MaterialUnit> = {
  frame_profile: 'per_meter', glass: 'per_sqm', hardware: 'per_piece', accessory: 'per_piece',
};
export interface MaterialFormValues {
  category: MaterialCategory; unit: MaterialUnit; currency: string; properties: MaterialUsageProperties; image: string | null;
}
export function materialFormData(form: FormData, values: MaterialFormValues): CreateMaterialData {
  return { ...values, name: String(form.get('name') ?? '').trim(),
    description: String(form.get('description') ?? ''), costPrice: Number(form.get('costPrice')) };
}

export function materialPriceHelp(unit: MaterialUnit): string {
  const definition = MATERIAL_UNITS[unit];
  if (definition.whole) return `Enter the cost for one ${definition.noun}. Record its size or contents in the description. Usage quantities are in ${definition.symbol}; purchasing rounds up to whole units.`;
  return `Enter the cost for one ${definition.noun}. Usage quantities must use the same unit. For example, a 6 m profile costing $30 is $5 per metre.`;
}
