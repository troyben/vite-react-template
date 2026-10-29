// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import api from '@/api';
import type { QuotationItem } from './quotationService';
import { MaterialCostReport } from '@/components/quotations/MaterialCostReport';
import { materialCostReportTitle, previewMaterialCostReport, printMaterialCostReport, type MaterialCostReportData } from './materialCostReportService';
const items: QuotationItem[] = [{ item: '<Window>', quantity: 1, price: 0, total: 0, productSketch: { type: 'window', width: 2500, height: 1400, unit: 'mm', panels: 1 } }];
const report: MaterialCostReportData = { currency: 'USD', incomplete: true, total: 5.71, warnings: ['Item 2 needs a drawing'],
  additional: { lines: [], total: 0 }, items: [{ index: 0, status: 'calculated', name: '<Window>', description: '2500 × 1400 mm', quantity: 1, total: 5.71,
    lines: [{ id: 'glass', name: '4mm Glass', category: 'Glass', unit: 'm²', quantity: 3.5, unitCost: 1.63, total: 5.71 }] },
    { index: 1, status: 'needs_review', name: 'No drawing', description: '', quantity: 2, lines: [], total: 0 }] };

describe('material cost report', () => {
  it('requests an opt-in item report without changing the existing preview or saving data', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true, data: { itemCosts: report } } });
    try {
      expect(await previewMaterialCostReport([], '13')).toEqual(report);
      expect(post).toHaveBeenCalledWith('/quotations/costing-preview', { items: [], quotationId: '13', includeItemCosts: true });
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await expect(previewMaterialCostReport([])).rejects.toThrow();
    } finally { post.mockRestore(); }
  });
  it('renders every item, quantity, cost, warning, final total and safe user text for screen and print', () => {
    const html = renderToStaticMarkup(createElement(MaterialCostReport, { report, title: 'Quotation #13', items }));
    const root = document.createElement('div'); root.innerHTML = html;
    expect(root.textContent).toContain('<Window>');
    expect(root.textContent).not.toContain('Item 1 ·');
    const rows = root.querySelectorAll('.material-cost-items > tbody > tr');
    expect(rows[0].children[0].textContent).toBe('1');
    expect(rows[0].children[1].querySelector('svg')).not.toBeNull();
    expect(rows[0].children[2].textContent).toContain('4mm Glass');
    expect(rows[0].children[3].textContent).toBe('$5.71');
    expect(rows[1].children[1].textContent).toContain('No sketch');
    expect(root.textContent).toContain('Qty: 2');
    expect(root.textContent).toContain('3.5 m²');
    expect(root.textContent).toContain('$1.63');
    expect(root.textContent).toContain('Item 2 needs a drawing');
    expect(root.textContent).toContain('Needs review');
    expect(root.textContent).toContain('Incomplete');
    expect(root.textContent).toContain('Calculated so far');
    expect(root.querySelector('footer')?.textContent).toContain('$5.71');
    expect(root.querySelector('window')).toBeNull();
    expect(root.querySelectorAll('button').length).toBe(0);
  });
  it('prints the report via the native print action and labels new/saved quotes', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    try { printMaterialCostReport(); expect(print).toHaveBeenCalledOnce(); } finally { print.mockRestore(); }
    expect(materialCostReportTitle('13', 'Client')).toBe('Quotation #13 · Client');
    expect(materialCostReportTitle()).toBe('New quotation');
  });
});

it('distinguishes missing defaults from valid zero usage in both screen and print totals', () => {
  const missing = { ...report.items[1], status: 'not_configured' as const };
  const render = (value: MaterialCostReportData) => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(createElement(MaterialCostReport, { report: value, items: [], title: 'Quotation #13' }));
    return root;
  };
  const incomplete = render({ ...report, items: [missing] });
  const subtotal = incomplete.querySelector('.material-cost-items > tbody > tr > td:last-child');
  expect(subtotal?.textContent?.trim()).toBe('Not configured');
  expect(subtotal?.textContent).not.toContain('$0.00');
  expect(incomplete.querySelector('footer')?.textContent).toContain('Incomplete');
  expect(incomplete.querySelector('footer')?.textContent).toContain('$5.71');
  const zero = render({ ...report, incomplete: false, warnings: [], total: 0, items: [{ ...missing, status: 'calculated' }] });
  expect(zero.textContent).toContain('No material usage for the configured rules.');
  expect(zero.querySelector('.material-cost-items > tbody > tr > td:last-child')?.textContent?.trim()).toBe('$0.00');
  expect(zero.querySelector('footer')?.textContent).not.toContain('Incomplete');
  const partial = render({ ...report, items: [{ ...report.items[0], status: 'needs_review' }] });
  expect(partial.textContent).toContain('Needs review · partial calculation');
  expect(partial.querySelector('.material-cost-items > tbody > tr > td:last-child')?.textContent?.trim()).toBe('$5.71');

});

it('prints manual material labels, assigned costs and quote-wide additions without editor controls', () => {
  const line = { id: 'manual', name: 'Extra hinge', category: 'Hardware', unit: 'pcs', quantity: 6, unitCost: 3, total: 18, manual: true };
  const data = { ...report, items: [{ ...report.items[0], lines: [line], total: 18 }], additional: { lines: [{ ...line, id: 'shared' }], total: 18 }, total: 36 };
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(createElement(MaterialCostReport, { report: data, title: 'Quotation', items }));
  expect(root.textContent).toContain('Manual'); expect(root.textContent).toContain('Additional quotation materials');
  expect(root.querySelector('footer')?.textContent).toContain('$36.00');
  expect(root.querySelectorAll('input,button').length).toBe(0);
});
