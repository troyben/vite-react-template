// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { QuotationItemsCard } from './QuotationItemsCard';
import { QuotationTotals } from './QuotationTotals';
import { LegacyCostingRedirect } from './LegacyCostingRedirect';
import { canAccessQuotationCosts } from '@/services/quotationPresentationService';
import type { QuotationItem } from '@/services/quotationService';

vi.mock('@/components/product-editor/canvas/ShapeCanvas', () => ({ default: () => <svg aria-label="Product sketch" /> }));
const items: QuotationItem[] = [{ id: 'one', item: 'Hinged Window', description: 'Captured description', quantity: 2, rate: 68, price: 68, total: 136,
  productSketch: { type: 'window', width: 1000, height: 1000, unit: 'mm', panels: 1 } }];
const client = { name: 'Captured client', phone: '1234', address: 'Saved address' };

it('shows saved quote values and sketches with every field readonly and no mutation controls', () => {
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(<><QuotationItemsCard items={items} client={client} /><QuotationTotals subtotal={136} vatPercent={15} transportFee={10} /></>);
  expect(root.textContent).toContain('Captured client'); expect(root.textContent).toContain('Saved address');
  expect(root.querySelector('table svg')).not.toBeNull();
  expect(root.querySelector<HTMLInputElement>('[aria-label="Item 1 name"]')?.value).toBe('Hinged Window');
  expect(root.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('Captured description');
  expect([...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')].every(field => field.readOnly)).toBe(true);
  expect(root.querySelectorAll('button,[role="button"],select').length).toBe(0);
  expect(root.textContent).not.toContain('Add another item'); expect(root.textContent).not.toContain('Save Template');
  expect(root.textContent).toContain('$166.40'); expect(root.textContent).toContain('1.00 m²');
});

it('retains editable fields and calls existing item/sketch actions in editor mode', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  const editing = { onChange: vi.fn(), onAdd: vi.fn(), onRemove: vi.fn(), onSketch: vi.fn(), onRemoveSketch: vi.fn(), onTemplate: vi.fn(), onSaveTemplate: vi.fn() };
  try {
    await act(() => root.render(<QuotationItemsCard items={items} client={client} editing={editing} onSelectClient={editing.onTemplate} />));
    expect(container.querySelector<HTMLInputElement>('[aria-label="Item 1 name"]')?.readOnly).toBe(false);
    expect(container.querySelector<HTMLInputElement>('[aria-label="Item 1 price"]')?.disabled).toBe(true);
    await act(() => { [...container.querySelectorAll('button')].find(button => button.textContent === 'Add Item')!.click(); });
    expect(editing.onAdd).toHaveBeenCalledOnce();
    await act(() => { container.querySelector<HTMLElement>('[aria-label="Edit sketch for item 1"]')!.click(); });
    expect(editing.onSketch).toHaveBeenCalledWith(0);
  } finally { await act(() => root.unmount()); container.remove(); }
});

it('keeps private costs and editing links limited to the owner or an administrator', () => {
  expect(canAccessQuotationCosts({ id: 2, role: 'admin' }, { createdBy: 1 })).toBe(true);
  expect(canAccessQuotationCosts({ id: 1, role: 'user' }, { createdBy: 1 })).toBe(true);
  expect(canAccessQuotationCosts({ id: 2, role: 'user' }, { createdBy: 1 })).toBe(false);
  expect(canAccessQuotationCosts({ id: 1, role: 'client' }, { createdBy: 1 })).toBe(false);
  expect(canAccessQuotationCosts(null, { createdBy: 1 })).toBe(false);
});

it('redirects a legacy costing URL to the readonly quotation', async () => {
  const container = document.createElement('div'); const root = createRoot(container);
  const Destination = () => <p>{useLocation().pathname}</p>;
  try {
    await act(() => root.render(<MemoryRouter initialEntries={['/quotations/30/costing']}><Routes>
      <Route path="/quotations/:id/costing" element={<LegacyCostingRedirect />} /><Route path="/quotations/:id" element={<Destination />} />
    </Routes></MemoryRouter>));
    expect(container.textContent).toBe('/quotations/30');
  } finally { await act(() => root.unmount()); }
});
