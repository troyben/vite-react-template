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
export interface ItemMaterialApproval { quotationItemId: string; signature: string }
export interface CostingSnapshot {
  itemApprovals?: ItemMaterialApproval[];
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
export { MATERIAL_UNIT_SYMBOLS as COSTING_UNITS } from './materialUnits';
export const COSTING_CATEGORIES = { frame_profile: 'Frame Profile', glass: 'Glass', hardware: 'Hardware', accessory: 'Accessory' };
