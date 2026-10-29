// @vitest-environment jsdom
import { act } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import BaseDataTable from './BaseDataTable';
import { quotationListColumns } from './quotations/quotationListColumns';
import type { Quotation } from '@/services/quotationService';

let container: HTMLDivElement; let root: ReturnType<typeof createRoot>;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(() => root.unmount()); container.remove(); });
it('opens a row with mouse or keyboard, but ignores nested links/buttons and portalled menu actions', async () => {
  const open = vi.fn(), action = vi.fn(); const rows = [{ id: 30, name: 'Ben' }];
  const columns: ColumnDef<typeof rows[number]>[] = [{ accessorKey: 'name', header: 'Client' }, { id: 'actions', cell: () => <>
    <button onClick={action}>Actions</button><a href="#test" onClick={event => event.preventDefault()}>Link</a>
    {createPortal(<button role="menuitem" onClick={action}>Portalled edit</button>, document.body)}</> }];
  await act(() => root.render(<BaseDataTable columns={columns} data={rows} onRowClick={open} getRowLabel={row => `Open quotation #${row.id}`} />));
  const row = container.querySelector<HTMLTableRowElement>('tbody tr')!;
  await act(() => { row.querySelector<HTMLElement>('td')!.click(); }); expect(open).toHaveBeenCalledExactlyOnceWith(rows[0]);
  await act(() => { row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); });
  expect(open).toHaveBeenCalledTimes(3);
  await act(() => { row.querySelector('button')!.click(); row.querySelector('a')!.click(); document.querySelector<HTMLButtonElement>('[role="menuitem"]')!.click();
    row.querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
  expect(action).toHaveBeenCalledTimes(2); expect(open).toHaveBeenCalledTimes(3);
  expect(row.getAttribute('aria-label')).toBe('Open quotation #30');
});

it('shows real quote links and creator identities for staff while hiding attribution from clients', async () => {
  const rows = [{ id: 30, client_name: 'Ben', createdBy: 2, creator: { id: 2, name: 'Creator', email: 'creator@example.test' }, status: 'draft', total_amount: 100, grand_total: 125 }] as Quotation[];
  const handlers = { onView: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), deletingId: null };
  const render = async (role: string) => { await act(() => root.render(<MemoryRouter><BaseDataTable data={rows} columns={quotationListColumns({ ...handlers, user: { id: 2, role } })} /></MemoryRouter>)); };
  await render('user');
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/quotations/30'); expect(container.textContent).toContain('#30');
  expect(container.textContent).toContain('Creator'); expect(container.textContent).toContain('creator@example.test'); expect(container.textContent).toContain('User #2');
  expect(container.textContent).toContain('$125.00'); expect(container.textContent).toContain('Subtotal $100.00');
  await render('client'); expect(container.textContent).not.toContain('Created by'); expect(container.textContent).not.toContain('creator@example.test');
});
