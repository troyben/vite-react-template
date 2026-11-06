// @vitest-environment jsdom
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMaterialCostReport } from './useMaterialCostReport';
import { previewMaterialCostReport, type MaterialCostReportData } from '@/services/materialCostReportService';
import type { CostingLine } from '@/services/costingTypes';
import type { QuotationItem } from '@/services/quotationService';
vi.mock('@/services/materialCostReportService', () => ({ previewMaterialCostReport: vi.fn() }));
const items: QuotationItem[] = [{ item: 'Window', quantity: 1, price: 0, total: 0 }];
const report: MaterialCostReportData = { currency: 'USD', incomplete: false, items: [], additional: { lines: [], total: 0 }, total: 4, warnings: [] };
let state: ReturnType<typeof useMaterialCostReport>;
const Harness = ({ rows, manual }: { rows: QuotationItem[]; manual?: CostingLine[] }) => {
  const current = useMaterialCostReport(rows, undefined, manual);
  useEffect(() => { state = current; }, [current]);
  return null;
};
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers(); vi.resetAllMocks();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.useRealTimers(); });

it('hides stale reports immediately during changed-item debounce and ignores obsolete requests', async () => {
  const pending: ((value: MaterialCostReportData) => void)[] = [];
  vi.mocked(previewMaterialCostReport).mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  await act(() => root.render(createElement(Harness, { rows: items })));
  await act(() => vi.advanceTimersByTime(200));
  await act(() => { pending[0](report); });
  expect(state.report?.total).toBe(4);
  const second = [{ ...items[0], quantity: 2 }];
  await act(() => root.render(createElement(Harness, { rows: second })));
  expect(state.loading).toBe(true); expect(state.report).toBeUndefined();
  await act(() => vi.advanceTimersByTime(200));
  const third = [{ ...items[0], quantity: 3 }];
  await act(() => root.render(createElement(Harness, { rows: third })));
  await act(() => { pending[1]({ ...report, total: 8 }); });
  expect(state.loading).toBe(true); expect(state.report).toBeUndefined();
  await act(() => vi.advanceTimersByTime(200));
  await act(() => { pending[2]({ ...report, total: 12 }); });
  expect(state.loading).toBe(false); expect(state.report?.total).toBe(12);
});
it('clears loading on failure without leaving old costs available to print', async () => {
  vi.mocked(previewMaterialCostReport).mockRejectedValue(new Error('Unavailable'));
  await act(() => root.render(createElement(Harness, { rows: items })));
  await act(() => vi.advanceTimersByTime(200));
  expect(state.loading).toBe(false); expect(state.report).toBeUndefined(); expect(state.error).toContain('could not be calculated');
});

it('invalidates printable totals immediately when manual drafts change and sends the current draft', async () => {
  const pending: ((value: MaterialCostReportData) => void)[] = [];
  vi.mocked(previewMaterialCostReport).mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  const manual: CostingLine[] = [{ id: 'extra', source: 'manual', materialId: null, name: 'Hinge', category: 'Hardware', unit: 'pcs', quantity: 2, unitCost: 3, wastagePercent: 0 }];
  await act(() => root.render(createElement(Harness, { rows: items, manual })));
  await act(() => vi.advanceTimersByTime(200));
  await act(() => { pending[0]({ ...report, total: 6 }); });
  expect(state.report?.total).toBe(6);
  const changed = [{ ...manual[0], quantity: 4 }];
  await act(() => root.render(createElement(Harness, { rows: items, manual: changed })));
  expect(state.loading).toBe(true); expect(state.report).toBeUndefined();
  await act(() => vi.advanceTimersByTime(200));
  expect(previewMaterialCostReport).toHaveBeenLastCalledWith(items, undefined, changed);
  await act(() => { pending[1]({ ...report, total: 12 }); });
  expect(state.report?.total).toBe(12);
});
