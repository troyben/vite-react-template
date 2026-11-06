import type { CostingLine, ItemMaterialApproval } from '@/services/costingTypes';
import type { Material } from '@/services/materialService';

export interface MaterialCostEditing {
  lines: CostingLine[]; materials: Material[]; approvals: ItemMaterialApproval[]; busy: boolean; error: string; retry: () => void;
  onChange: (lines: CostingLine[]) => void; onApprove: (approvals: ItemMaterialApproval[]) => void;
}
