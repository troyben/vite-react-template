// @vitest-environment jsdom
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useInlineMaterial } from './useInlineMaterial';
import type { CostingLine } from '@/services/costingTypes';
import type { Material } from '@/services/materialService';

const material: Material = { id: 7, name: 'Frame', category: 'frame_profile', unit: 'per_meter', costPrice: 2.33, currency: 'USD', createdAt: '', updatedAt: '' };
let state: ReturnType<typeof useInlineMaterial>;
const Harness = ({ existing }: { existing?: CostingLine }) => {
  const value = useInlineMaterial([material], 'USD', 'door', existing);
  useEffect(() => { state = value; }, [value]);
  return null;
};
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(() => root.unmount()); container.remove(); });

it('captures the selected catalogue material, accepts an explicit rate and totals, and rejects invalid drafts', async () => {
  await act(() => root.render(createElement(Harness)));
  expect(state.canSave).toBe(false);
  await act(() => state.select('7'));
  expect(state.unitCost).toBe('2.33'); expect(state.unit).toBe('m');
  await act(() => { state.setQuantity('4'); state.setUnitCost('2.5'); state.setWastage('5'); });
  const line = state.build()!;
  expect(line).toMatchObject({ quotationItemId: 'door', quantity: 4, unitCost: 2.5, wastagePercent: 5, source: 'manual' });
  expect(line.materialSnapshot?.costPrice).toBe(2.33); expect(material.costPrice).toBe(2.33);
  await act(() => state.setUnitCost(''));
  expect(state.canSave).toBe(false); expect(state.build()).toBeUndefined();
  await act(() => { state.setUnitCost('2'); state.setQuantity('0'); });
  expect(state.canSave).toBe(false);
});
it('edits a captured line without repricing it from the current catalogue', async () => {
  const existing: CostingLine = { id: 'captured', materialId: 7, source: 'manual', quotationItemId: 'door', name: 'Older Frame', category: 'Frame Profile', unit: 'm', quantity: 5, unitCost: 1.5, wastagePercent: 10 };
  await act(() => root.render(createElement(Harness, { existing })));
  expect(state.unitCost).toBe('1.5');
  await act(() => state.setQuantity('6'));
  expect(state.build()).toMatchObject({ id: 'captured', name: 'Older Frame', unitCost: 1.5, quantity: 6, wastagePercent: 10 });
  expect(existing.quantity).toBe(5);
});
