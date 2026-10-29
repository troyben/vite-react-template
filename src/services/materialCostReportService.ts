import type { CostingLine, ItemMaterialApproval } from './costingTypes';
import api from '@/api';
import { costingMoney } from './costingService';
import type { QuotationItem } from './quotationService';

export interface MaterialCostReportLine {
  manual?: boolean; id: string; name: string; category: string; unit: string; quantity: number; unitCost: number; total: number;
}
export type MaterialConfigurationStatus = 'calculated' | 'not_configured' | 'needs_review' | 'approved';
export interface MaterialCostReportItem {
  approvalKey?: string; canApprove?: boolean; index: number; name: string; description: string; quantity: number; status: MaterialConfigurationStatus; lines: MaterialCostReportLine[]; total: number;
}
export interface MaterialCostReportData {
  currency: string; incomplete: boolean; items: MaterialCostReportItem[];
  additional: { lines: MaterialCostReportLine[]; total: number }; total: number; warnings: string[];
}
export async function previewMaterialCostReport(items: QuotationItem[], quotationId?: string, manualMaterials?: CostingLine[], itemApprovals?: ItemMaterialApproval[]): Promise<MaterialCostReportData> {
  const response = await api.post('/quotations/costing-preview', { items, quotationId, ...(manualMaterials === undefined ? {} : { manualMaterials }), ...(itemApprovals === undefined ? {} : { itemApprovals }), includeItemCosts: true });
  if (!response.data.success || !response.data.data?.itemCosts) throw new Error('Unable to load material costs');
  return response.data.data.itemCosts;
}
export function printMaterialCostReport() { window.print(); }
export function materialCostReportTitle(quotationId?: string, clientName?: string) {
  return [quotationId ? `Quotation #${quotationId}` : 'New quotation', clientName].filter(Boolean).join(' · ');
}

export function materialItemCostLabel(item: MaterialCostReportItem, currency: string) {
  if (item.status === 'not_configured') return 'Not configured';
  if (item.status !== 'calculated' && item.lines.length === 0) return 'Needs review';
  return costingMoney(item.total, currency);
}
export function materialItemEmptyMessage(item: MaterialCostReportItem) {
  if (item.status === 'not_configured') return 'No matching material defaults. Review this product’s material configuration.';
  return item.status === 'calculated' ? 'No material usage for the configured rules.' : 'Review this product’s drawing and material checks.';
}
