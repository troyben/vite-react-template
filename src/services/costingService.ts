import type { ProductData } from '@/components/product-editor/types';
import type { CostBreakdown } from '@/utils/costCalculator';
import api from '@/api';
import { getAllMaterials, type Material } from './materialService';
import type { QuotationItem } from './quotationService';
import { COSTING_CATEGORIES, COSTING_UNITS, type CostingLine, type CostingSnapshot } from './costingTypes';

const round = (n: number, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
export function emptyCosting(currency = 'USD'): CostingSnapshot {
  return { version: 1, currency, lines: [], labour: 0, otherCosts: 0, markupPercent: 0, notes: '', warnings: [] };
}
export function captureMaterial(material: Material) {
  return JSON.parse(JSON.stringify({ id: material.id, name: material.name, category: material.category, unit: material.unit,
    costPrice: material.costPrice, currency: material.currency || 'USD', description: material.description, properties: material.properties || {} }));
}
export function materialLine(material: Material): CostingLine {
  return { id: crypto.randomUUID(), source: 'manual', materialSnapshot: captureMaterial(material), materialId: material.id, name: material.name,
    category: COSTING_CATEGORIES[material.category], unit: COSTING_UNITS[material.unit],
    quantity: 0, unitCost: material.costPrice, wastagePercent: 0 };
}
export function lineQuantity(line: CostingLine): number {
  const quantity = line.quantity * (1 + line.wastagePercent / 100);
  return line.unit === 'pcs' ? Math.ceil(quantity) : round(quantity, 3);
}
export function lineTotal(line: CostingLine): number {
  return round(lineQuantity(line) * line.unitCost);
}
export function costingTotals(snapshot: CostingSnapshot) {
  const materials = round(snapshot.lines.reduce((sum, line) => sum + lineTotal(line), 0));
  const cost = round(materials + snapshot.labour + snapshot.otherCosts);
  const markup = round(cost * snapshot.markupPercent / 100);
  return { materials, cost, markup, sellingPrice: round(cost + markup) };
}
export function costingMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

/** Load every page: the API caps page size at 100. */
export async function loadCostingMaterials(): Promise<Material[]> {
  const materials: Material[] = [];
  for (let page = 1; ; page++) {
    const response = await getAllMaterials({ page, limit: 100, sortBy: 'id', sortOrder: 'ASC' });
    if (!response.data.success) throw new Error('Unable to load materials');
    materials.push(...response.data.data.items);
    if (page >= response.data.data.pagination.totalPages) return materials;
  }
}
export async function loadCosting(id: string): Promise<{ snapshot: CostingSnapshot | null; revision: number }> {
  const response = await api.get(`/quotations/${id}/costing`);
  if (!response.data.success) throw new Error('Unable to load costing');
  return { snapshot: response.data.data, revision: response.data.revision };
}
export async function saveCosting(id: string, snapshot: CostingSnapshot, expectedRevision: number) {
  const response = await api.put(`/quotations/${id}/costing`, { ...snapshot, expectedRevision });
  if (!response.data.success) throw new Error('Unable to save costing');
  return { snapshot: response.data.data as CostingSnapshot, revision: response.data.revision as number };
}

/** The server uses this same rule engine when it stores a quotation. */
export async function previewCosting(items: QuotationItem[], quotationId?: string, currency = 'USD'): Promise<CostingSnapshot> {
  const response = await api.post('/quotations/costing-preview', { items, quotationId, currency });
  if (!response.data.success) throw new Error('Unable to calculate automatic materials');
  return response.data.data;
}

/** A plain text purchasing list: deliberately excludes internal rates and totals. */
export function quantitiesText(snapshot: CostingSnapshot, title: string): string {
  return [title, 'Bill of quantities — estimated purchasing quantities', '',
    ...snapshot.lines.map(l => `${l.name} | ${l.category} | ${lineQuantity(l)} ${l.unit}`),
    '', 'Quantities include the entered wastage allowance.', ...snapshot.warnings].join('\n');
}
export function downloadQuantities(snapshot: CostingSnapshot, quotationId: string) {
  const blob = new Blob([quantitiesText(snapshot, `Quotation #${quotationId}`)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `quotation-${quotationId}-boq.txt`; anchor.click();
  URL.revokeObjectURL(url);
}

/** Keep template material previews aligned with quotation usage rules. */
export async function previewProductMaterials(product: ProductData) {
  const snapshot = await previewCosting([{ item: product.type, quantity: 1, price: 0, total: 0, productSketch: product }]);
  const breakdown: CostBreakdown = { frameItems: [], glassItems: [], hardwareItems: [], accessoryItems: [], totalCost: costingTotals(snapshot).materials };
  const groups = { 'Frame Profile': 'frameItems', Glass: 'glassItems', Hardware: 'hardwareItems', Accessory: 'accessoryItems' } as const;
  snapshot.lines.forEach(line => {
    const group = groups[line.category as keyof typeof groups];
    if (group) breakdown[group].push({ material: line.name, category: line.category, quantity: lineQuantity(line), unit: line.unit, unitCost: line.unitCost, total: lineTotal(line) });
  });
  return { breakdown, warnings: snapshot.warnings };
}
