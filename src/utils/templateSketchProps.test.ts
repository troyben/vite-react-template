import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { extractShapeCanvasProps } from './templateSketchProps';
import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import type { ProductData } from '@/components/product-editor/types';

// Real production data that triggered a PDF export crash: panelIndex 1
// claims `horizontalCount: 3` rows but `panelDivisionHeights` only has 2
// entries recorded for it, which used to sum to NaN downstream.
const inconsistentDivisionsTemplate: ProductData = {
  type: 'window',
  windowType: 'hinged',
  height: 1020,
  frameColor: '#C0C0C0',
  glassType: 'clear',
  unit: 'mm',
  shape: { type: 'rectangle' },
  render3D: false,
  width: 1500,
  panels: 2,
  panelWidths: [750, 750],
  panelDivisions: [
    { panelIndex: 0, horizontalCount: 2, verticalCount: 1 },
    { panelIndex: 1, horizontalCount: 3, verticalCount: 1 },
  ],
  panelDivisionHeights: [
    { panelIndex: 0, rowHeights: [645, 375] },
    { panelIndex: 1, rowHeights: [645, 375] },
  ],
  openingPanels: [],
  openingDirections: {},
  openingPanes: [
    { panelIndex: 0, rowIndex: 0, colIndex: 0, openingDirection: 'top', openingType: 'hinged' },
    { panelIndex: 1, rowIndex: 0, colIndex: 0, openingDirection: 'top', openingType: 'hinged' },
  ],
};

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

describe.each(['slope-left', 'slope-right'] as const)('%s saved sketch rendering', (type) => {
  it('keeps its outline and edge labels in preview and print mode after JSON round-trip', () => {
    const data: ProductData = JSON.parse(JSON.stringify({
      ...legacyTemplate, width: 1200, height: 1000, panelWidths: [600, 600], panels: 2,
      shape: { type, shortSideHeight: 400 },
    }));
    const expectedPath = type === 'slope-left'
      ? 'M 40 40 L 256 148 L 256 220 L 40 220 Z'
      : 'M 40 148 L 256 40 L 256 220 L 40 220 Z';
    for (const printMode of [false, true]) {
      const props = extractShapeCanvasProps(data, { printMode });
      const svg = renderToStaticMarkup(React.createElement(ShapeCanvas, props));
      expect(svg).toContain(`d="${expectedPath}"`);
      expect(svg).toMatch(/>400<\/text>/);
      expect(svg).toMatch(/>1000<\/text>/);
      expect(svg).toMatch(/>1342<\/text>/);
      expect(svg).not.toMatch(/NaN|Infinity/);
    }
  });
});

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

  it('normalizes panelDivisions so horizontalCount never outpaces rowHeights.length', () => {
    const props = extractShapeCanvasProps(inconsistentDivisionsTemplate);
    expect(props.panelDivisions?.find((d) => d.panelIndex === 1)?.horizontalCount).toBe(2);
    expect(props.panelDivisions?.find((d) => d.panelIndex === 0)?.horizontalCount).toBe(2);
  });

  it('renders ShapeCanvas with no NaN attributes for the previously-inconsistent fixture', () => {
    const props = extractShapeCanvasProps(inconsistentDivisionsTemplate);
    const svg = renderToStaticMarkup(
      React.createElement(ShapeCanvas, {
        ...props,
        svgStyle: { width: '600px', height: '500px' },
      }),
    );
    expect(svg).not.toMatch(/NaN/);
  });
});
