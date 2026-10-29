import api from '@/api';
import type { Quotation } from './quotationService';
import type { CostingSnapshot, CostingLine } from './costingTypes';
import type { StaffIdentity } from './staffIdentity';

export interface RevisionSummary {
  id: number;
  quotationId: number;
  revision: number;
  reason: string;
  actorId: number | null;
  actor?: StaffIdentity | null;
  createdAt: string;
}
export interface ArchivedCosting extends CostingSnapshot {
  calculationVersion?: number;
  lines: (CostingLine & { quantityToBuy?: number; lineTotal?: number })[];
  totals?: { materials: number; jobCost: number; markup: number; suggestedPrice: number };
}
export interface RevisionDetail extends RevisionSummary {
  creatorId?: number | null;
  creator?: StaffIdentity | null;
  snapshot: { schemaVersion: number; quotation: Quotation; costing: ArchivedCosting | null; originalCostingText?: string };
}
export interface HistoryPage {
  creatorId?: number | null;
  creator?: StaffIdentity | null;
  items: RevisionSummary[];
  page: number;
  totalPages: number;
  total: number;
  deleted: boolean;
}
export const revisionReason = (reason: string) => ({ created: 'Created', quotation_saved: 'Quotation saved', costing_saved: 'Costing saved', legacy_baseline: 'Existing quotation captured' }[reason] || reason);
export const revisionDate = (date: string) => new Date(date).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export function archivedQuotation(detail: RevisionDetail): Quotation {
  const quote = detail.snapshot.quotation;
  return { ...quote, items: typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items };
}
export async function loadQuotationHistory(id: string, page: number): Promise<HistoryPage> {
  const response = await api.get(`/quotations/${id}/revisions`, { params: { page } });
  return response.data.data;
}
export async function loadQuotationRevision(id: string, revision: number): Promise<RevisionDetail> {
  const response = await api.get(`/quotations/${id}/revisions/${revision}`);
  return response.data.data;
}
