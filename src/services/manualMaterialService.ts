import type { QuotationItem } from './quotationService';
import type { CostingLine, ItemMaterialApproval } from './costingTypes';
import type { Material } from './materialService';
import { COSTING_CATEGORIES, COSTING_UNITS } from './costingTypes';
import { costingMoney, materialLine } from './costingService';
import type { DescribedOption } from './describedOptions';

/** IDs belong to the draft product, never its current row position. */
export function withQuotationItemIds(items: QuotationItem[]): QuotationItem[] {
  const used = new Set<string>();
  return items.map(item => {
    const id = item.id && item.id.trim() && item.id.length <= 100 && !used.has(item.id) ? item.id : crypto.randomUUID();
    used.add(id);
    return { ...item, id };
  });
}
export function manualMaterialsWithoutItem(lines: CostingLine[] | undefined, id?: string) {
  return lines?.filter(line => !id || line.quotationItemId !== id);
}
export function catalogueOptions(materials: Material[], currency: string): DescribedOption[] {
  return materials.filter(material => (material.currency || 'USD') === currency).map(material => ({
    value: String(material.id), label: material.name,
    description: [COSTING_CATEGORIES[material.category], `${costingMoney(material.costPrice, currency)} / ${COSTING_UNITS[material.unit]}`,
      material.properties?.usageRule?.enabled ? 'Automatic rule enabled' : 'Not included automatically', material.description].filter(Boolean).join(' · '),
  }));
}
export function addManualMaterial(material: Material, quantity: number, wastagePercent: number, quotationItemId?: string): CostingLine {
  return { ...materialLine(material), quantity, wastagePercent, quotationItemId };
}
export function validManualQuantity(quantity: number, wastage: number) {
  return Number.isFinite(quantity) && quantity > 0 && quantity <= 1e6 && Number.isFinite(wastage) && wastage >= 0 && wastage <= 1000;
}

export function saveManualLine(lines: CostingLine[], line: CostingLine) {
  return lines.some(existing => existing.id === line.id) ? lines.map(existing => existing.id === line.id ? line : existing) : [...lines, line];
}
export function removeManualLine(lines: CostingLine[], id: string) { return lines.filter(line => line.id !== id); }
export function setItemMaterialApproval(approvals: ItemMaterialApproval[], quotationItemId: string, signature?: string) {
  const others = approvals.filter(approval => approval.quotationItemId !== quotationItemId);
  return signature ? [...others, { quotationItemId, signature }] : others;
}
