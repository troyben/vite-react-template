import { describe, it, expect } from 'vitest';
import { calculateProductCost } from './costCalculator';
import type { ProductData } from '@/components/product-editor/types';
import type { Material } from '@/services/materialService';

// Real Material shape (category/unit/costPrice/properties), not the brief's
// mocked fixture — see task-11-report.md for the mismatches this caught.
const now = '2026-01-01T00:00:00.000Z';

const materials: Material[] = [
  {
    id: 1,
    name: 'Frame 40x40',
    category: 'frame_profile',
    unit: 'per_meter',
    costPrice: 10,
    isDefault: true,
    properties: { profileType: 'outer_frame' },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    name: 'Clear 4mm',
    category: 'glass',
    unit: 'per_sqm',
    costPrice: 20,
    isDefault: true,
    properties: { glassType: 'clear' },
    createdAt: now,
    updatedAt: now,
  },
];

const oneSegment: ProductData = {
  type: 'window', windowType: 'hinged',
  width: 1000, height: 1000, panels: 1, panelWidths: [1000],
  openingPanels: [], openingDirections: {}, unit: 'mm',
  shape: { type: 'rectangle' },
};

describe('calculateProductCost with chains', () => {
  it('leaves a single-segment product unchanged when chain fields are absent', () => {
    const withChain = { ...oneSegment, segments: [
      { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
    ], connectors: [], rootSegmentIndex: 0 };
    expect(calculateProductCost(withChain, materials).totalCost)
      .toBeCloseTo(calculateProductCost(oneSegment, materials).totalCost, 2);
  });

  it('costs more with a second segment than with one', () => {
    const two: ProductData = {
      ...oneSegment,
      segments: [
        { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
        { id: 'b', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    };
    const single = calculateProductCost(oneSegment, materials).totalCost;
    const chained = calculateProductCost(two, materials).totalCost;
    expect(chained).toBeGreaterThan(single);
  });

  it('adds one frame line item per corner post', () => {
    const two: ProductData = {
      ...oneSegment,
      segments: [
        { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
        { id: 'b', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    };
    const breakdown = calculateProductCost(two, materials);
    const posts = breakdown.frameItems.filter((i) => i.material.toLowerCase().includes('corner post'));
    expect(posts).toHaveLength(1);
    expect(posts[0].total).toBeGreaterThan(0);
  });

  it('treats a segments array with no connectors as a single-unit product', () => {
    const noConnectors: ProductData = {
      ...oneSegment,
      segments: [
        { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
        { id: 'b', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [],
      rootSegmentIndex: 0,
    };
    expect(calculateProductCost(noConnectors, materials).totalCost)
      .toBeCloseTo(calculateProductCost(oneSegment, materials).totalCost, 2);
  });

  it('prices attached legs as rectangles even when the root segment has a non-rectangular shape', () => {
    // ChainCanvas.tsx only ever draws the root segment with its real shape;
    // every attached leg renders as a plain rectangle. Costing must match:
    // an arch (or any non-rectangular) root must not leak its shape formula
    // into the attached leg's glass area.
    const rootOnlyArch = calculateProductCost(
      { ...oneSegment, shape: { type: 'arch', archHeight: 300 } },
      materials,
    ).totalCost;

    const legBAlone: ProductData = {
      type: 'window', windowType: 'hinged',
      width: 800, height: 1000, panels: 1, panelWidths: [800],
      openingPanels: [], openingDirections: {}, unit: 'mm',
      shape: { type: 'rectangle' },
    };
    const legBOnly = calculateProductCost(legBAlone, materials).totalCost;

    const chainWithArchRoot: ProductData = {
      ...oneSegment,
      shape: { type: 'arch', archHeight: 300 },
      segments: [
        { id: 'a', width: 1000, panels: 1, panelWidths: [1000] },
        { id: 'b', width: 800, panels: 1, panelWidths: [800] },
      ],
      connectors: [{ id: 'c', angle: 90, postWidth: 100 }],
      rootSegmentIndex: 0,
    };
    const chained = calculateProductCost(chainWithArchRoot, materials);
    const postsCost = chained.frameItems
      .filter((i) => i.material.toLowerCase().includes('corner post'))
      .reduce((sum, i) => sum + i.total, 0);

    // If leg b leaked the root's arch shape, this equality would fail.
    expect(chained.totalCost).toBeCloseTo(rootOnlyArch + legBOnly + postsCost, 2);
  });
});
