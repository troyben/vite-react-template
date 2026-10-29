export interface MaterialSnapshot {
  id: number; name: string; category: string; unit: string; costPrice: number; currency: string;
  description?: string | null; properties: Record<string, unknown>;
}
export interface CostingLine {
  materialSnapshot?: MaterialSnapshot;
  source?: 'automatic' | 'manual';
  sourceMaterialId?: number;
  quotationItemId?: string;
  id: string;
  materialId: number | null;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitCost: number;
  wastagePercent: number;
}
export interface CostingSnapshot {
  catalogue?: { id: number; name: string; category: string; unit: string; costPrice: number; currency: string; properties: Record<string, unknown> }[];
  sourceKey?: string;
  totalMaterialCost?: number;
  version: 1;
  currency: string;
  lines: CostingLine[];
  labour: number;
  otherCosts: number;
  markupPercent: number;
  notes: string;
  warnings: string[];
}
export const COSTING_CURRENCIES = ['USD', 'ZAR', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'CNY'];
export const COSTING_UNITS = { per_meter: 'm', per_sqm: 'm²', per_piece: 'pcs', per_kg: 'kg' };
export const COSTING_CATEGORIES = { frame_profile: 'Frame Profile', glass: 'Glass', hardware: 'Hardware', accessory: 'Accessory' };
