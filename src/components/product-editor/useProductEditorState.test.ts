// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProductEditorState, type ProductEditorState } from './useProductEditorState';
import type { ProductData } from './types';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let state: ProductEditorState;
let root: Root;
let container: HTMLDivElement;
function Harness() {
  const current = useProductEditorState();
  React.useLayoutEffect(() => { state = current; });
  return null;
}

beforeEach(async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(() => root.render(React.createElement(Harness)));
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

describe('Circle editor dimensions', () => {
  it('adopts the width as diameter and keeps tab/inline edits round', async () => {
    await act(() => { state.setWidth(1200); state.setHeight(800); });
    await act(() => state.setShapeType('circle'));
    expect([state.width, state.height]).toEqual([1200, 1200]);
    await act(() => state.handleDimensionChange('650', 'width'));
    expect([state.width, state.height]).toEqual([650, 650]);
    await act(() => state.setHeight(750));
    expect([state.width, state.height]).toEqual([750, 750]);
    await act(() => state.handleDimensionChange('', 'width'));
    expect([state.width, state.height]).toEqual([0, 0]);
  });

  it('normalizes loaded Circle data and saves a round product', async () => {
    const data: ProductData = { type: 'window', shape: { type: 'circle' }, width: 900, height: 700, panels: 1, unit: 'mm' };
    await act(() => state.populateFromData(JSON.parse(JSON.stringify(data))));
    expect([state.width, state.height]).toEqual([900, 900]);
    expect(state.buildProductData()).toMatchObject({ width: 900, height: 900, shape: { type: 'circle' } });
  });

  it('leaves non-circular dimensions independent after changing shape', async () => {
    await act(() => state.setShapeType('circle'));
    await act(() => state.setShapeType('rectangle'));
    await act(() => { state.setWidth(1200); state.setHeight(800); });
    expect([state.width, state.height]).toEqual([1200, 800]);
  });
});

describe('L-Shape rotate tool', () => {
  it('keeps multi-panel widths and explicit pane dimensions consistent after rotation', async () => {
    await act(() => state.populateFromData({
      type: 'window', width: 1200, height: 800, panels: 2, panelWidths: [900, 300], unit: 'mm',
      panelDivisionWidths: [{ panelIndex: 0, colWidths: [450, 450] }],
      panelDivisionHeights: [{ panelIndex: 0, rowHeights: [300, 500] }],
      shape: { type: 'l-shape' },
    }));
    await act(() => state.rotateShape());
    expect(state.panelWidths).toEqual([600, 200]);
    expect(state.panelDivisionWidths[0].colWidths).toEqual([300, 300]);
    expect(state.panelDivisionHeights[0].rowHeights).toEqual([450, 750]);
  });

  it('updates the editor outline and dimensions without mutating the saved input', async () => {
    const data: ProductData = {
      type: 'window', width: 1200, height: 800, panels: 1, unit: 'mm',
      shape: { type: 'l-shape', cutoutPosition: 'top-right', cutoutWidth: 400, cutoutHeight: 300 },
    };
    await act(() => state.populateFromData(data));
    await act(() => state.rotateShape());
    expect([state.width, state.height]).toEqual([800, 1200]);
    expect(state.shape).toMatchObject({ cutoutPosition: 'bottom-right', cutoutWidth: 300, cutoutHeight: 400 });
    await act(() => state.rotateShape());
    expect(state.shape.cutoutPosition).toBe('bottom-left');
    expect(data.shape?.cutoutPosition).toBe('top-right');
  });
});

it('round-trips the N-Shape opening configuration', async () => {
  const data: ProductData = {
    type: 'window', width: 1000, height: 1000, panels: 1, unit: 'mm',
    shape: { type: 'n-shape', cutoutWidth: 600, cutoutHeight: 700, cutoutOffset: 150 },
  };
  await act(() => state.populateFromData(JSON.parse(JSON.stringify(data))));
  expect(state.buildProductData().shape).toEqual(data.shape);
});
