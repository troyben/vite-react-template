// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import api from '@/api';
import { MaterialCostReport } from '@/components/quotations/MaterialCostReport';
import { materialCostReportTitle, previewMaterialCostReport, printMaterialCostReport, type MaterialCostReportData } from './materialCostReportService';
const report: MaterialCostReportData = { currency: 'USD', total: 5.71, warnings: ['Item 2 needs a drawing'],
  additional: { lines: [], total: 0 }, items: [{ index: 0, name: '<Window>', description: '2500 × 1400 mm', quantity: 1, total: 5.71,
    lines: [{ id: 'glass', name: '4mm Glass', category: 'Glass', unit: 'm²', quantity: 3.5, unitCost: 1.63, total: 5.71 }] },
    { index: 1, name: 'No drawing', description: '', quantity: 2, lines: [], total: 0 }] };

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
    const html = renderToStaticMarkup(createElement(MaterialCostReport, { report, title: 'Quotation #13' }));
    const root = document.createElement('div'); root.innerHTML = html;
    expect(root.textContent).toContain('Item 1 · <Window>');
    expect(root.textContent).toContain('Quoted quantity: 2');
    expect(root.textContent).toContain('3.5 m²');
    expect(root.textContent).toContain('$1.63');
    expect(root.textContent).toContain('Item 2 needs a drawing');
    expect(root.textContent).toContain('No automatic material costs for this item');
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
