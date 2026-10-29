import type { Quotation, QuotationItem } from './quotationService';

export function itemAreaLabel(item: QuotationItem) {
  if (!item.productSketch || !item.rate) return '';
  const { width, height, unit } = item.productSketch;
  const factor = unit === 'mm' ? 1000 : unit === 'cm' ? 100 : 1;
  const area = Number(width) * Number(height) / (factor * factor);
  return Number.isFinite(area) ? `${area.toFixed(2)} m²` : '';
}
export function boundedQuotationNumber(value: string, max = Infinity) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(0, number)) : 0;
}
export function canAccessQuotationCosts(user: { id: number; role: string } | null | undefined, quotation: Pick<Quotation, 'createdBy'>) {
  return !!user && (user.role === 'admin' || user.role === 'user' && quotation.createdBy === user.id);
}
