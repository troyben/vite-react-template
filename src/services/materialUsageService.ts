import type { Material, MaterialCategory, MaterialUnit } from './materialService';
export interface UsageRule {
  enabled: boolean;
  basis: 'per_product' | 'area' | 'perimeter' | 'mullion' | 'transom' | 'opening' | 'hinged_opening' | 'sliding_opening' | 'corner_post';
  quantity: number;
  wastagePercent: number;
}
export interface MaterialUsageProperties extends Record<string, unknown> {
  usageRule?: UsageRule;
  applicableTo?: 'door' | 'window' | 'both';
  operationType?: 'any' | 'hinged' | 'sliding';
}
export const USAGE_OPTIONS = [
  { value: 'per_product', label: 'Each door / window' }, { value: 'area', label: 'Each m² of product area' },
  { value: 'perimeter', label: 'Each metre around the outer frame' }, { value: 'mullion', label: 'Each metre of vertical panel dividers' },
  { value: 'transom', label: 'Each metre of inner pane dividers' }, { value: 'opening', label: 'Each opening panel / pane' },
  { value: 'hinged_opening', label: 'Each hinged opening' }, { value: 'sliding_opening', label: 'Each sliding opening' },
  { value: 'corner_post', label: 'Each metre of corner posts' },
] as const;
export function defaultUsage(category: MaterialCategory): UsageRule {
  return { enabled: false, basis: category === 'glass' ? 'area' : category === 'frame_profile' ? 'perimeter' : 'per_product', quantity: 1, wastagePercent: 0 };
}
export function usageUnit(unit: MaterialUnit) { return { per_meter: 'm', per_sqm: 'm²', per_piece: 'pieces', per_kg: 'kg' }[unit]; }
export function usageSummary(material: Material): string {
  const rule = material.properties?.usageRule as UsageRule | undefined;
  if (!rule?.enabled) return 'Not included automatically';
  const scope = material.properties?.applicableTo === 'door' ? 'doors' : material.properties?.applicableTo === 'window' ? 'windows' : 'doors & windows';
  const basis = USAGE_OPTIONS.find(o => o.value === rule.basis)?.label.toLowerCase() ?? rule.basis;
  return `${rule.quantity} ${usageUnit(material.unit)} · ${basis} · ${scope}`;
}
