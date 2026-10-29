// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import QuotationPreviewModal from './QuotationPreviewModal';
import ClientSelector from './ClientSelector';
import { ClientFormDialog } from './clients/ClientFormDialog';
import { createClient, getAllClients } from '@/services/clientService';

vi.mock('@/services/clientService', () => ({ getAllClients: vi.fn(), createClient: vi.fn() }));
const apiResponse = <T,>(data: T): AxiosResponse<T> => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
let container: HTMLDivElement; let root: ReturnType<typeof createRoot>;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.resetAllMocks(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(() => root.unmount()); container.remove(); });

it('uses an accessible standard dialog that closes with Escape and returns focus to its opener', async () => {
  const Harness = () => {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Open preview</button><QuotationPreviewModal open={open} onClose={() => setOpen(false)} title="Quotation #30 preview"><p>Saved document</p></QuotationPreviewModal></>;
  };
  await act(() => root.render(<Harness />));
  const opener = container.querySelector('button')!; opener.focus();
  await act(() => opener.click());
  const dialog = document.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain('Quotation #30 preview'); expect(dialog.textContent).toContain('Saved document');
  expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull();
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Quotation #30 preview');
  await act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(opener);
});

it('zooms between 50 and 200 percent, resets, and starts each preview opening at 100 percent', async () => {
  const Harness = () => {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Open preview</button><QuotationPreviewModal open={open} onClose={() => setOpen(false)}><p>Document</p></QuotationPreviewModal></>;
  };
  await act(() => root.render(<Harness />));
  const opener = container.querySelector('button')!;
  await act(() => opener.click());
  const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const percentage = () => document.querySelector('output')?.textContent;
  expect(percentage()).toBe('100%');
  for (let index = 0; index < 5; index++) await act(() => button('Zoom in').click());
  expect(percentage()).toBe('200%'); expect(button('Zoom in').disabled).toBe(true);
  await act(() => button('Reset zoom to 100%').click()); expect(percentage()).toBe('100%');
  for (let index = 0; index < 3; index++) await act(() => button('Zoom out').click());
  expect(percentage()).toBe('50%'); expect(button('Zoom out').disabled).toBe(true);
  await act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  await act(() => opener.click()); expect(percentage()).toBe('100%');
});

it('creates and selects a client from a quote without requiring a phone', async () => {
  vi.mocked(getAllClients).mockResolvedValue(apiResponse({ success: true, data: { items: [], pagination: { page: 1, limit: 100, totalItems: 0, totalPages: 0 } } }));
  const client = { id: 5, name: 'No phone client', address: 'Test address', phone: null };
  vi.mocked(createClient).mockResolvedValue(apiResponse({ success: true, data: client }));
  const selected = vi.fn();
  await act(() => root.render(<ClientSelector onSelect={selected} selectedClient={null} onClose={() => {}} />));
  await act(() => { [...container.querySelectorAll('button')].find(button => button.textContent === 'Add New Client')!.click(); });
  const fill = (name: string, value: string) => {
    const field = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  };
  await act(() => { fill('name', client.name); fill('address', client.address); });
  expect(container.querySelector<HTMLInputElement>('[name="phone"]')?.required).toBe(false);
  expect(container.querySelector('form')!.checkValidity()).toBe(true);
  await act(() => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  expect(createClient).toHaveBeenCalledWith(expect.objectContaining({ name: client.name, address: client.address, phone: null }));
  await act(() => { [...container.querySelectorAll<HTMLElement>('h4')].find(heading => heading.textContent === client.name)!.click(); });
  expect(selected).toHaveBeenCalledWith(client);
});

it('also leaves phone optional in client management when editing a phone-less client', async () => {
  await act(() => root.render(<ClientFormDialog open onOpenChange={() => {}} editingClient={{ id: 5, name: 'No phone', address: 'Address', phone: null }} onSubmit={() => {}} onCancel={() => {}} />));
  const form = document.querySelector('form')!;
  expect(form.querySelector<HTMLInputElement>('[name="phone"]')?.required).toBe(false);
  expect(form.checkValidity()).toBe(true);
  expect(new FormData(form).get('phone')).toBe('');
});
