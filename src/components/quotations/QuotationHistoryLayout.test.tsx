// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RevisionSnapshot } from './RevisionSnapshot';
import { RevisionTimeline } from './RevisionTimeline';
import type { HistoryPage, RevisionDetail } from '@/services/quotationHistoryService';
import type { Quotation } from '@/services/quotationService';

vi.mock('@/components/product-editor/canvas/ShapeCanvas', () => ({ default: () => <svg /> }));
vi.mock('./RevisionPreview', () => ({ RevisionPreview: () => <button>Preview</button> }));
const quotation = { id: 30, client_name: 'Archived client', status: 'draft', items: JSON.stringify([{ item: 'Archived window', quantity: 2, price: 20, total: 40 }]), total_amount: 40, vat_percent: 10, transport_fee: 5 } as unknown as Quotation;
const detail: RevisionDetail = { id: 3, quotationId: 30, revision: 3, reason: 'quotation_saved', createdAt: '2026-10-29T10:00:00Z', actorId: 9,
  actor: { id: 9, name: 'Revision editor', email: 'editor@example.test' }, snapshot: { schemaVersion: 1, quotation,
    costing: { version: 1, currency: 'USD', lines: [{ id: 'glass', materialId: 1, source: 'automatic', name: 'Archived glass', category: 'Glass', unit: 'm²', quantity: 5, quantityToBuy: 5.5, wastagePercent: 10, unitCost: 3, lineTotal: 16.5 }], totalMaterialCost: 16.5, labour: 4, otherCosts: 2, markupPercent: 10, notes: 'Saved note', warnings: ['Saved check'], totals: { materials: 16.5, jobCost: 22.5, markup: 2.25, suggestedPrice: 24.75 } } } };
const history: HistoryPage = { items: [detail, { ...detail, id: 2, revision: 2, actor: null, actorId: 99 }], creatorId: 1,
  creator: { id: 1, name: 'Original creator', email: 'creator@example.test' }, page: 1, totalPages: 2, total: 21, deleted: false };
let container: HTMLDivElement; let root: ReturnType<typeof createRoot>;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(() => root.unmount()); container.remove(); });

it('separates the readonly archived quotation from captured costs and displays editor identity', async () => {
  await act(() => root.render(<RevisionSnapshot detail={detail} />));
  expect(container.textContent).toContain('Revision editor'); expect(container.textContent).toContain('editor@example.test');
  expect(container.textContent).toContain('User #9');
  expect(container.querySelector('input')?.value).toBe('Archived window');
  expect([...container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')].every(field => field.readOnly)).toBe(true);
  expect(container.textContent).toContain('$49.00'); expect(container.textContent).not.toContain('Archived glass');
  await act(() => { [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === 'Materials & costs')!.click(); });
  expect(container.textContent).toContain('Archived glass'); expect(container.textContent).toContain('5.5 m²');
  expect(container.textContent).toContain('$16.50'); expect(container.textContent).toContain('$24.75');
  expect(container.querySelectorAll('input').length).toBe(0); expect(container.textContent).toContain('Saved note');
  expect(detail.snapshot.quotation.items).toBe(quotation.items);
});

it('shows creator and revision actors, handles unavailable users, and selects/pages the timeline', async () => {
  const select = vi.fn(), page = vi.fn();
  await act(() => root.render(<RevisionTimeline history={history} selected={3} page={1} onSelect={select} onPage={page} />));
  expect(container.textContent).toContain('Original creator'); expect(container.textContent).toContain('creator@example.test');
  expect(container.textContent).toContain('User unavailable'); expect(container.textContent).toContain('User #99');
  expect(container.querySelector('[aria-current="true"]')?.textContent).toContain('Revision 3');
  await act(() => { [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Revision 2'))!.click(); });
  expect(select).toHaveBeenCalledWith(2);
  await act(() => { [...container.querySelectorAll('button')].find(button => button.textContent === 'Older')!.click(); });
  expect(page).toHaveBeenCalledWith(2);
});
