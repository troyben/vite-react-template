import { describe, it, expect } from 'vitest';
import { normalizeToChain, chainToProductData, makeSegment } from './chain-model';
import type { ProductData } from '@/components/product-editor/types';

const legacy: ProductData = {
  type: 'window',
  windowType: 'hinged',
  width: 1000,
  height: 1200,
  panels: 2,
  panelWidths: [600, 400],
  openingPanels: [1],
  openingDirections: { 1: 'left' },
  unit: 'mm',
  shape: { type: 'rectangle' },
};

describe('normalizeToChain', () => {
  it('turns a legacy single-unit payload into a one-segment chain', () => {
    const chain = normalizeToChain(legacy);
    expect(chain.segments).toHaveLength(1);
    expect(chain.connectors).toHaveLength(0);
    expect(chain.rootIndex).toBe(0);
    expect(chain.segments[0].width).toBe(1000);
    expect(chain.segments[0].panels).toBe(2);
    expect(chain.segments[0].panelWidths).toEqual([600, 400]);
    expect(chain.segments[0].openingPanels).toEqual([1]);
  });

  it('reads attached segments and connectors when present', () => {
    const chain = normalizeToChain({
      ...legacy,
      segments: [
        { id: 's0', width: 1000, panels: 2, panelWidths: [600, 400] },
        { id: 's1', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c0', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    });
    expect(chain.segments).toHaveLength(2);
    expect(chain.connectors).toHaveLength(1);
    expect(chain.segments[1].width).toBe(800);
  });

  it('does not share array references with the input', () => {
    const chain = normalizeToChain(legacy);
    chain.segments[0].panelWidths[0] = 1;
    expect(legacy.panelWidths).toEqual([600, 400]);
  });
});

describe('chainToProductData', () => {
  it('omits the chain fields entirely for a single segment', () => {
    const chain = normalizeToChain(legacy);
    const out = chainToProductData(chain);
    expect(out.width).toBe(1000);
    expect(out.panels).toBe(2);
    expect(out.panelWidths).toEqual([600, 400]);
    expect('segments' in out).toBe(false);
    expect('connectors' in out).toBe(false);
    expect('rootSegmentIndex' in out).toBe(false);
  });

  it('round-trips a legacy payload unchanged', () => {
    const out = chainToProductData(normalizeToChain(legacy));
    expect(out.width).toBe(legacy.width);
    expect(out.panels).toBe(legacy.panels);
    expect(out.panelWidths).toEqual(legacy.panelWidths);
    expect(out.openingPanels).toEqual(legacy.openingPanels);
    expect(out.openingDirections).toEqual(legacy.openingDirections);
  });

  it('emits the chain fields once a connector exists, with segment 0 also flattened', () => {
    const chain = normalizeToChain(legacy);
    chain.segments.push(makeSegment(800));
    chain.connectors.push({ id: 'c0', angle: 90, postWidth: 100 });
    const out = chainToProductData(chain);
    expect(out.width).toBe(1000);          // top-level still describes segment 0
    expect(out.segments).toHaveLength(2);
    expect(out.connectors).toHaveLength(1);
    expect(out.rootSegmentIndex).toBe(0);
  });
});

describe('makeSegment', () => {
  it('creates a single full-width panel with no openings', () => {
    const s = makeSegment(750);
    expect(s.width).toBe(750);
    expect(s.panels).toBe(1);
    expect(s.panelWidths).toEqual([750]);
    expect(s.openingPanels).toEqual([]);
    expect(s.id).toBeTruthy();
  });
});
