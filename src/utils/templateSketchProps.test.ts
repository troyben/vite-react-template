import { describe, it, expect } from 'vitest';
import { extractShapeCanvasProps } from './templateSketchProps';
import type { ProductData } from '@/components/product-editor/types';

const legacyTemplate: ProductData = {
  type: 'window',
  windowType: 'hinged',
  width: 1000,
  height: 1200,
  panels: 1,
  panelWidths: [1000],
  unit: 'mm',
  shape: { type: 'rectangle' },
};

const chainedTemplate: ProductData = {
  ...legacyTemplate,
  segments: [
    { id: 's0', width: 1000, panels: 1, panelWidths: [1000] },
    { id: 's1', width: 800, panels: 1, panelWidths: [800] },
  ],
  connectors: [{ id: 'c0', angle: 120, postWidth: 100 }],
  rootSegmentIndex: 0,
};

/**
 * `chain` is optional on ShapeCanvasProps, so narrow it before dereferencing.
 * Throwing here fails the test with a useful message rather than a property
 * access on undefined, and keeps the test file free of `!` / `as` casts.
 */
function chainOf(props: ReturnType<typeof extractShapeCanvasProps>) {
  const { chain } = props;
  if (!chain) throw new Error('expected extractShapeCanvasProps to return a chain');
  return chain;
}

describe('extractShapeCanvasProps', () => {
  it('returns a usable one-segment, connector-free chain for a legacy template', () => {
    const chain = chainOf(extractShapeCanvasProps(legacyTemplate));
    expect(chain.segments).toHaveLength(1);
    expect(chain.connectors).toHaveLength(0);
    expect(chain.rootIndex).toBe(0);
    expect(chain.segments[0].width).toBe(1000);
  });

  it('returns the full multi-segment chain for a saved corner template', () => {
    const chain = chainOf(extractShapeCanvasProps(chainedTemplate));
    expect(chain.segments).toHaveLength(2);
    expect(chain.segments.map((s) => s.width)).toEqual([1000, 800]);
    expect(chain.connectors).toHaveLength(1);
    expect(chain.connectors[0].angle).toBe(120);
    expect(chain.rootIndex).toBe(0);
  });

  it('still returns the legacy flat fields alongside chain, unaffected by its presence', () => {
    const props = extractShapeCanvasProps(legacyTemplate);
    expect(props.width).toBe(1000);
    expect(props.panels).toBe(1);
    expect(props.panelWidths).toEqual([1000]);
  });
});
