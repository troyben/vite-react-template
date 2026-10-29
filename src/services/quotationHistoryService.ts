import api from '@/api';
import type { Quotation } from './quotationService';
import type { CostingSnapshot, CostingLine } from './costingTypes';

export interface RevisionSummary {
  id: number;
  quotationId: number;
  revision: number;
  reason: string;
  actorId: number | null;
  createdAt: string;
}
export interface ArchivedCosting extends CostingSnapshot {
  calculationVersion?: number;
  lines: (CostingLine & { quantityToBuy?: number; lineTotal?: number })[];
  totals?: { materials: number; jobCost: number; markup: number; suggestedPrice: number };
}
export interface RevisionDetail extends RevisionSummary {
  snapshot: { schemaVersion: number; quotation: Quotation; costing: ArchivedCosting | null; originalCostingText?: string };
}
export interface HistoryPage {
  items: RevisionSummary[];
  page: number;
  totalPages: number;
  total: number;
  deleted: boolean;
}
export const revisionReason = (reason: string) => ({ created: 'Created', quotation_saved: 'Quotation saved', costing_saved: 'Costing saved', legacy_baseline: 'Existing quotation captured' }[reason] || reason);
export async function loadQuotationHistory(id: string, page: number): Promise<HistoryPage> {
  const response = await api.get(`/quotations/${id}/revisions`, { params: { page } });
  return response.data.data;
}
export async function loadQuotationRevision(id: string, revision: number): Promise<RevisionDetail> {
  const response = await api.get(`/quotations/${id}/revisions/${revision}`);
  return response.data.data;
}
