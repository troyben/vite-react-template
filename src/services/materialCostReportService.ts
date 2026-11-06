import api from '@/api';
import type { QuotationItem } from './quotationService';

export interface MaterialCostReportLine {
  id: string; name: string; category: string; unit: string; quantity: number; unitCost: number; total: number;
}
export interface MaterialCostReportItem {
  index: number; name: string; description: string; quantity: number; lines: MaterialCostReportLine[]; total: number;
}
export interface MaterialCostReportData {
  currency: string; items: MaterialCostReportItem[];
  additional: { lines: MaterialCostReportLine[]; total: number }; total: number; warnings: string[];
}
export async function previewMaterialCostReport(items: QuotationItem[], quotationId?: string): Promise<MaterialCostReportData> {
  const response = await api.post('/quotations/costing-preview', { items, quotationId, includeItemCosts: true });
  if (!response.data.success || !response.data.data?.itemCosts) throw new Error('Unable to load material costs');
  return response.data.data.itemCosts;
}
export function printMaterialCostReport() { window.print(); }
export function materialCostReportTitle(quotationId?: string, clientName?: string) {
  return [quotationId ? `Quotation #${quotationId}` : 'New quotation', clientName].filter(Boolean).join(' · ');
}
