import { useCallback, useEffect, useState } from 'react';
import type { SectionId } from '@/components/product-editor/canvas/utils/section-outline';
import type {
  ActiveHingeSelector,
  GlassType,
  OpeningDirection,
  ProductData,
  ShapeConfig,
  ShapeType,
  Unit,
} from '@/components/product-editor/types';
import { useSegmentChain } from './useSegmentChain';
import { normalizeToChain } from '@/components/product-editor/canvas/utils/chain-model';
import { rotateLShape } from './shapeTransforms';

export type ProductEditorTabKey = 'shape' | 'dimensions' | 'appearance' | 'openings' | 'panels';

const DEFAULTS = {
  shape: { type: 'rectangle' as const } as ShapeConfig,
  type: 'window' as 'window' | 'door',
  doorType: 'hinged' as 'hinged' | 'sliding',
  windowType: 'hinged' as 'hinged' | 'sliding',
  width: 1000,
  height: 1000,
  panels: 1,
  unit: 'mm' as Unit,
  openingPanels: [] as number[],
  openingDirections: {} as Record<number, OpeningDirection>,
  frameColor: '#C0C0C0',
  glassType: 'clear' as GlassType,
  customGlassTint: '#FFFFFF',
  panelDivisions: [] as Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }>,
  openingPanes: [] as Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
    openingType?: 'hinged' | 'sliding';
  }>,
  panelWidths: [1000] as number[],
  panelDivisionHeights: [] as Array<{ panelIndex: number; rowHeights: number[] }>,
  panelDivisionWidths: [] as Array<{ panelIndex: number; colWidths: number[] }>,
  removedSections: [] as SectionId[],
  render3D: false,
};

// Deep-clone helpers (small, focused — avoid pulling in lodash)
const cloneOpeningDirections = (d: Record<number, OpeningDirection>) => ({ ...d });
const cloneArr = <T>(arr: T[]): T[] => arr.map((item) => ({ ...item } as T));
const cloneOpeningPanes = (a: typeof DEFAULTS.openingPanes) => a.map((p) => ({ ...p }));
const clonePanelDivisionHeights = (a: typeof DEFAULTS.panelDivisionHeights) =>
  a.map((h) => ({ panelIndex: h.panelIndex, rowHeights: h.rowHeights.slice() }));
const clonePanelDivisionWidths = (a: typeof DEFAULTS.panelDivisionWidths) =>
  a.map((w) => ({ panelIndex: w.panelIndex, colWidths: w.colWidths.slice() }));
const cloneRemovedSections = (a: SectionId[]) => a.map((s) => ({ ...s }));

export function useProductEditorState() {
  // Shape
  const [shape, setShapeState] = useState<ShapeConfig>(DEFAULTS.shape);

  // Product state
  const [type, setType] = useState<'window' | 'door'>(DEFAULTS.type);
  const [doorType, setDoorType] = useState<'hinged' | 'sliding'>(DEFAULTS.doorType);
  const [windowType, setWindowType] = useState<'hinged' | 'sliding'>(DEFAULTS.windowType);
  const [width, setWidthState] = useState<number>(DEFAULTS.width);
  const [height, setHeightState] = useState<number>(DEFAULTS.height);
  const [panels, setPanels] = useState<number>(DEFAULTS.panels);
  const [unit, setUnit] = useState<Unit>(DEFAULTS.unit);
  const [openingPanels, setOpeningPanels] = useState<number[]>(DEFAULTS.openingPanels);
  const [openingDirections, setOpeningDirections] = useState<Record<number, OpeningDirection>>(DEFAULTS.openingDirections);
  const [frameColor, setFrameColor] = useState<string>(DEFAULTS.frameColor);
  const [glassType, setGlassType] = useState<GlassType>(DEFAULTS.glassType);
  const [customGlassTint, setCustomGlassTint] = useState<string>(DEFAULTS.customGlassTint);
  const [panelDivisions, setPanelDivisions] = useState<typeof DEFAULTS.panelDivisions>(DEFAULTS.panelDivisions);
  const [openingPanes, setOpeningPanes] = useState<typeof DEFAULTS.openingPanes>(DEFAULTS.openingPanes);
  const [activeHingeSelector, setActiveHingeSelector] = useState<ActiveHingeSelector | null>(null);
  const [panelWidths, setPanelWidths] = useState<number[]>(DEFAULTS.panelWidths);
  const [panelDivisionHeights, setPanelDivisionHeights] = useState<typeof DEFAULTS.panelDivisionHeights>(DEFAULTS.panelDivisionHeights);
  const [panelDivisionWidths, setPanelDivisionWidths] = useState<typeof DEFAULTS.panelDivisionWidths>(DEFAULTS.panelDivisionWidths);
  const [removedSections, setRemovedSections] = useState<SectionId[]>(DEFAULTS.removedSections);
  const [render3D, setRender3D] = useState<boolean>(DEFAULTS.render3D);
  const [activeTab, setActiveTab] = useState<ProductEditorTabKey>('dimensions');
  const chainState = useSegmentChain(DEFAULTS.width);

  const isSliding =
    (type === 'door' && doorType === 'sliding') || (type === 'window' && windowType === 'sliding');

  const setWidth = useCallback((value: number) => {
    setWidthState(value);
    if (shape.type === 'circle') setHeightState(value);
  }, [shape.type]);
  const setHeight = useCallback((value: number) => {
    setHeightState(value);
    if (shape.type === 'circle') setWidthState(value);
  }, [shape.type]);
  const setShape = useCallback((config: ShapeConfig) => {
    setShapeState(config);
    if (config.type === 'circle') setHeightState(width);
  }, [width]);
  const setShapeType = useCallback((newType: ShapeType) => {
    setShapeState((prev) => ({ ...prev, type: newType }));
    if (newType === 'circle') setHeightState(width);
  }, [width]);
  const rotateShape = useCallback(() => {
    const rotated = rotateLShape(shape, width, height);
    if (shape.type !== 'l-shape') return;
    const widthRatio = width > 0 ? rotated.width / width : 1;
    const heightRatio = height > 0 ? rotated.height / height : 1;
    // The tool rotates the outline; keep the upright pane grid proportionate
    // to the new bounding dimensions, including explicitly sized subdivisions.
    setPanelWidths((prev) => prev.map((value) => value * widthRatio));
    setPanelDivisionWidths((prev) => prev.map((entry) => ({
      ...entry, colWidths: entry.colWidths.map((value) => value * widthRatio),
    })));
    setPanelDivisionHeights((prev) => prev.map((entry) => ({
      ...entry, rowHeights: entry.rowHeights.map((value) => value * heightRatio),
    })));
    setShapeState(rotated.shape);
    setWidthState(rotated.width);
    setHeightState(rotated.height);
  }, [shape, width, height]);
  const updateShapeConfig = useCallback((updates: Partial<ShapeConfig>) => {
    setShapeState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleDimensionChange = useCallback((value: string, dimension: 'width' | 'height') => {
    if (value === '' || value === '-') {
      if (dimension === 'width') setWidth(0);
      else setHeight(0);
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    if (dimension === 'width') setWidth(numValue);
    else setHeight(numValue);
  }, [setWidth, setHeight]);

  const handleTypeChange = useCallback((newType: 'window' | 'door') => {
    setType(newType);
    if (newType === 'door') setDoorType('hinged');
  }, []);

  const syncPanelWidths = useCallback((newWidths: number[], totalWidth: number) => {
    const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
    const lastWidth = Math.max(totalWidth - sumExceptLast, 1);
    return [...newWidths.slice(0, -1), lastWidth];
  }, []);

  const handlePanelCountChange = useCallback((newCount: number) => {
    setPanels(newCount);
    const existingDivisions = [...panelDivisions];
    for (let i = 0; i < newCount; i++) {
      if (!existingDivisions.find((d) => d.panelIndex === i)) {
        existingDivisions.push({ panelIndex: i, horizontalCount: 1, verticalCount: 1 });
      }
    }
    setPanelDivisions(existingDivisions);
    const avg = Math.round(width / newCount);
    const widths = Array(newCount).fill(avg);
    if (newCount > 0) widths[newCount - 1] = width - avg * (newCount - 1);
    setPanelWidths(widths);
  }, [panelDivisions, width]);

  const handlePanelWidthChange = useCallback((panelIndex: number, value: string) => {
    if (value === '') {
      const newWidths = [...panelWidths];
      newWidths[panelIndex] = 0;
      setPanelWidths(newWidths);
      return;
    }
    let num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    let newWidths = [...panelWidths];
    if (panelIndex === panels - 1) {
      const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
      num = Math.max(width - sumExceptLast, 0);
      newWidths[panelIndex] = num;
    } else {
      newWidths[panelIndex] = num;
      newWidths = syncPanelWidths(newWidths, width);
    }
    setPanelWidths(newWidths);
  }, [panelWidths, panels, width, syncPanelWidths]);

  // Keep panelWidths synced when panels or width changes
  useEffect(() => {
    setPanelWidths((prev) => {
      let arr = prev.slice(0, panels);
      if (arr.length < panels) {
        const missing = panels - arr.length;
        arr = [...arr, ...Array(missing).fill(Math.round(width / panels))];
      }
      return syncPanelWidths(arr, width);
    });
  }, [panels, width, syncPanelWidths]);

  const buildProductData = useCallback((): ProductData => {
    const chainFields = chainState.toProductData();
    return {
      type,
      doorType: type === 'door' ? doorType : undefined,
      windowType: type === 'window' ? windowType : undefined,
      height,
      frameColor,
      glassType,
      customGlassTint: glassType === 'custom-tint' ? customGlassTint : undefined,
      unit,
      shape,
      render3D,
      ...chainFields,
    };
  }, [
    type, doorType, windowType, height, frameColor, glassType, customGlassTint,
    unit, shape, render3D, chainState,
  ]);

  const populateFromData = useCallback((d: ProductData) => {
    setType(d.type || 'window');
    setDoorType(d.doorType || 'hinged');
    setWindowType(d.windowType || 'hinged');
    setWidthState(d.width || 1000);
    setHeightState(d.shape?.type === 'circle' ? (d.width || 1000) : (d.height || 1000));
    setPanels(d.panels || 1);
    setUnit(d.unit || 'mm');
    setOpeningPanels((d.openingPanels || []).slice());
    setOpeningDirections(cloneOpeningDirections(d.openingDirections || {}));
    setFrameColor(d.frameColor || '#C0C0C0');
    setGlassType(d.glassType || 'clear');
    setCustomGlassTint(d.customGlassTint || '#FFFFFF');
    setPanelDivisions(cloneArr(d.panelDivisions || []));
    setOpeningPanes(cloneOpeningPanes(d.openingPanes || []));
    setPanelWidths((d.panelWidths || [d.width || 1000]).slice());
    setPanelDivisionHeights(clonePanelDivisionHeights(d.panelDivisionHeights || []));
    setPanelDivisionWidths(clonePanelDivisionWidths(d.panelDivisionWidths || []));
    setRemovedSections(cloneRemovedSections(d.removedSections || []));
    setRender3D(d.render3D ?? false);
    setShapeState(d.shape ? { ...d.shape } : { type: 'rectangle' });
    setActiveHingeSelector(null);
    setActiveTab('dimensions');
    chainState.loadChain(normalizeToChain(d));
  }, [chainState]);

  const resetToDefaults = useCallback(() => {
    setShapeState(DEFAULTS.shape);
    setType(DEFAULTS.type);
    setDoorType(DEFAULTS.doorType);
    setWindowType(DEFAULTS.windowType);
    setWidthState(DEFAULTS.width);
    setHeightState(DEFAULTS.height);
    setPanels(DEFAULTS.panels);
    setUnit(DEFAULTS.unit);
    setOpeningPanels(DEFAULTS.openingPanels);
    setOpeningDirections(DEFAULTS.openingDirections);
    setFrameColor(DEFAULTS.frameColor);
    setGlassType(DEFAULTS.glassType);
    setCustomGlassTint(DEFAULTS.customGlassTint);
    setPanelDivisions(DEFAULTS.panelDivisions);
    setOpeningPanes(DEFAULTS.openingPanes);
    setPanelWidths(DEFAULTS.panelWidths);
    setPanelDivisionHeights(DEFAULTS.panelDivisionHeights);
    setPanelDivisionWidths(DEFAULTS.panelDivisionWidths);
    setRemovedSections(DEFAULTS.removedSections);
    setRender3D(DEFAULTS.render3D);
    setActiveHingeSelector(null);
    setActiveTab('dimensions');
    chainState.resetChain(DEFAULTS.width);
  }, [chainState]);

  return {
    // Shape
    shape, setShape, setShapeType, updateShapeConfig, rotateShape,
    // Product state
    type, setType,
    doorType, setDoorType,
    windowType, setWindowType,
    width, setWidth,
    height, setHeight,
    panels, setPanels,
    unit, setUnit,
    openingPanels, setOpeningPanels,
    openingDirections, setOpeningDirections,
    frameColor, setFrameColor,
    glassType, setGlassType,
    customGlassTint, setCustomGlassTint,
    panelDivisions, setPanelDivisions,
    openingPanes, setOpeningPanes,
    activeHingeSelector, setActiveHingeSelector,
    panelWidths, setPanelWidths,
    panelDivisionHeights, setPanelDivisionHeights,
    panelDivisionWidths, setPanelDivisionWidths,
    removedSections, setRemovedSections,
    render3D, setRender3D,
    activeTab, setActiveTab,
    isSliding,
    chain: chainState,
    // Handlers
    handleDimensionChange,
    handleTypeChange,
    handlePanelCountChange,
    handlePanelWidthChange,
    // Actions
    buildProductData,
    populateFromData,
    resetToDefaults,
  };
}

export type ProductEditorState = ReturnType<typeof useProductEditorState>;
