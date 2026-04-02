import React, { useState, useEffect, useCallback } from 'react';
import { Shapes, Ruler, Palette, DoorOpen, LayoutGrid, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ShapeCanvas from '@/components/template-creator/ShapeCanvas';
import DimensionsTab from '@/components/product-sketch/tabs/DimensionsTab';
import AppearanceTab from '@/components/product-sketch/tabs/AppearanceTab';
import OpeningsTab from '@/components/product-sketch/tabs/OpeningsTab';
import PanelsTab from '@/components/product-sketch/tabs/PanelsTab';
import ShapeSelector from '@/components/template-creator/ShapeSelector';
import ShapeTab from '@/components/template-creator/tabs/ShapeTab';
import CanvasToolbar from '@/components/template-creator/CanvasToolbar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { CanvasTool, PlacedArc } from '@/components/template-creator/utils/canvas-tools';
import type {
  ShapeConfig,
  ShapeType,
  OpeningDirection,
  Unit,
  GlassType,
  ProductData,
  ActiveHingeSelector,
} from '@/components/product-sketch/types';

type TabKey = 'shape' | 'dimensions' | 'appearance' | 'openings' | 'panels';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'shape', label: 'Shape', icon: <Shapes className="h-3.5 w-3.5" /> },
  { key: 'dimensions', label: 'Dims', icon: <Ruler className="h-3.5 w-3.5" /> },
  { key: 'appearance', label: 'Look', icon: <Palette className="h-3.5 w-3.5" /> },
  { key: 'openings', label: 'Open', icon: <DoorOpen className="h-3.5 w-3.5" /> },
  { key: 'panels', label: 'Panes', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
];

// Default product state values
const DEFAULTS = {
  shape: { type: 'rectangle' as const },
  type: 'window' as const,
  doorType: 'hinged' as const,
  windowType: 'hinged' as const,
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
  openingPanes: [] as Array<{ panelIndex: number; rowIndex: number; colIndex: number; openingDirection?: OpeningDirection; openingType?: 'hinged' | 'sliding' }>,
  panelWidths: [1000],
  panelDivisionHeights: [] as Array<{ panelIndex: number; rowHeights: number[] }>,
  panelDivisionWidths: [] as Array<{ panelIndex: number; colWidths: number[] }>,
};

interface ProductEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ProductData;
  onSave: (data: ProductData) => void;
}

function useProductEditorState() {
  // Shape
  const [shape, setShapeState] = useState<ShapeConfig>(DEFAULTS.shape);

  // Product state
  const [type, setType] = useState<'window' | 'door'>(DEFAULTS.type);
  const [doorType, setDoorType] = useState<'hinged' | 'sliding'>(DEFAULTS.doorType);
  const [windowType, setWindowType] = useState<'hinged' | 'sliding'>(DEFAULTS.windowType);
  const [width, setWidth] = useState<number>(DEFAULTS.width);
  const [height, setHeight] = useState<number>(DEFAULTS.height);
  const [panels, setPanels] = useState<number>(DEFAULTS.panels);
  const [unit, setUnit] = useState<Unit>(DEFAULTS.unit);
  const [openingPanels, setOpeningPanels] = useState<number[]>(DEFAULTS.openingPanels);
  const [openingDirections, setOpeningDirections] = useState<Record<number, OpeningDirection>>(DEFAULTS.openingDirections);
  const [frameColor, setFrameColor] = useState<string>(DEFAULTS.frameColor);
  const [glassType, setGlassType] = useState<GlassType>(DEFAULTS.glassType);
  const [customGlassTint, setCustomGlassTint] = useState<string>(DEFAULTS.customGlassTint);
  const [panelDivisions, setPanelDivisions] = useState<Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>>(DEFAULTS.panelDivisions);
  const [openingPanes, setOpeningPanes] = useState<Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
    openingType?: 'hinged' | 'sliding';
  }>>(DEFAULTS.openingPanes);
  const [activeHingeSelector, setActiveHingeSelector] = useState<ActiveHingeSelector | null>(null);
  const [panelWidths, setPanelWidths] = useState<number[]>(DEFAULTS.panelWidths);
  const [panelDivisionHeights, setPanelDivisionHeights] = useState<Array<{ panelIndex: number; rowHeights: number[] }>>(DEFAULTS.panelDivisionHeights);
  const [panelDivisionWidths, setPanelDivisionWidths] = useState<Array<{ panelIndex: number; colWidths: number[] }>>(DEFAULTS.panelDivisionWidths);
  const [activeTab, setActiveTab] = useState<TabKey>('dimensions');

  const isSliding = (type === 'door' && doorType === 'sliding') || (type === 'window' && windowType === 'sliding');

  // Shape setter
  const setShape = useCallback((config: ShapeConfig) => {
    setShapeState(config);
  }, []);

  const setShapeType = useCallback((newType: ShapeType) => {
    setShapeState((prev) => ({ ...prev, type: newType }));
  }, []);

  const updateShapeConfig = useCallback((updates: Partial<ShapeConfig>) => {
    setShapeState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Dimension handlers
  const handleDimensionChange = useCallback((value: string, dimension: 'width' | 'height') => {
    if (value === '' || value === '-') {
      if (dimension === 'width') setWidth(0);
      else setHeight(0);
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    if (dimension === 'width') {
      setWidth(numValue);
    } else {
      setHeight(numValue);
    }
  }, []);

  const handleTypeChange = useCallback((newType: 'window' | 'door') => {
    setType(newType);
    if (newType === 'door') {
      setDoorType('hinged');
    }
  }, []);

  // Sync panelWidths with width
  const syncPanelWidths = useCallback((newWidths: number[], totalWidth: number) => {
    const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
    const lastWidth = Math.max(totalWidth - sumExceptLast, 1);
    return [...newWidths.slice(0, -1), lastWidth];
  }, []);

  const handlePanelCountChange = useCallback((newCount: number) => {
    setPanels(newCount);
    const existingDivisions = [...panelDivisions];
    for (let i = 0; i < newCount; i++) {
      if (!existingDivisions.find(d => d.panelIndex === i)) {
        existingDivisions.push({ panelIndex: i, horizontalCount: 1, verticalCount: 1 });
      }
    }
    setPanelDivisions(existingDivisions);
    const avg = Math.round(width / newCount);
    const widths = Array(newCount).fill(avg);
    if (newCount > 0) {
      widths[newCount - 1] = width - avg * (newCount - 1);
    }
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

  // Build ProductData for save
  const buildProductData = useCallback((): ProductData => {
    const totalWidth = panelWidths.reduce((a, b) => a + b, 0);
    return {
      type,
      doorType: type === 'door' ? doorType : undefined,
      windowType: type === 'window' ? windowType : undefined,
      width: totalWidth,
      height,
      panels,
      openingPanels,
      openingDirections,
      frameColor,
      glassType,
      customGlassTint: glassType === 'custom-tint' ? customGlassTint : undefined,
      panelDivisions,
      openingPanes,
      unit,
      panelWidths: panelWidths.slice(),
      panelDivisionHeights: panelDivisionHeights.length > 0 ? panelDivisionHeights : undefined,
      panelDivisionWidths: panelDivisionWidths.length > 0 ? panelDivisionWidths : undefined,
      shape,
    };
  }, [type, doorType, windowType, height, panels, openingPanels, openingDirections,
      frameColor, glassType, customGlassTint, panelDivisions, openingPanes, unit, panelWidths, panelDivisionHeights, panelDivisionWidths, shape]);

  // Populate state from ProductData (when editing)
  const populateFromData = useCallback((d: ProductData) => {
    setType(d.type || 'window');
    setDoorType(d.doorType || 'hinged');
    setWindowType(d.windowType || 'hinged');
    setWidth(d.width || 1000);
    setHeight(d.height || 1000);
    setPanels(d.panels || 1);
    setUnit(d.unit || 'mm');
    setOpeningPanels(d.openingPanels || []);
    setOpeningDirections(d.openingDirections || {});
    setFrameColor(d.frameColor || '#C0C0C0');
    setGlassType(d.glassType || 'clear');
    setCustomGlassTint(d.customGlassTint || '#FFFFFF');
    setPanelDivisions(d.panelDivisions || []);
    setOpeningPanes(d.openingPanes || []);
    setPanelWidths(d.panelWidths || [d.width || 1000]);
    setPanelDivisionHeights(d.panelDivisionHeights || []);
    setPanelDivisionWidths(d.panelDivisionWidths || []);
    setShapeState(d.shape || { type: 'rectangle' });
    setActiveHingeSelector(null);
    setActiveTab('dimensions');
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setShapeState(DEFAULTS.shape);
    setType(DEFAULTS.type);
    setDoorType(DEFAULTS.doorType);
    setWindowType(DEFAULTS.windowType);
    setWidth(DEFAULTS.width);
    setHeight(DEFAULTS.height);
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
    setActiveHingeSelector(null);
    setActiveTab('dimensions');
  }, []);

  return {
    // Shape
    shape, setShape, setShapeType, updateShapeConfig,
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
    activeTab, setActiveTab,
    isSliding,
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

const ProductEditorDialog: React.FC<ProductEditorDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
}) => {
  const state = useProductEditorState();
  const [initialized, setInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState<CanvasTool>(null);
  const [lineOrientation, setLineOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [lineTarget, setLineTarget] = useState<'panel' | 'pane'>('panel');
  const [customArcs, setCustomArcs] = useState<PlacedArc[]>([]);

  // Escape key deactivates tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTool(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When dialog opens, populate state from initialData or reset
  useEffect(() => {
    if (open) {
      if (initialData) {
        state.populateFromData(initialData);
      } else {
        state.resetToDefaults();
      }
      setActiveTool(null);
      setCustomArcs([]);
      setInitialized(true);
    } else {
      setInitialized(false);
    }
    // Only run when open changes -- state functions are stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = () => {
    onSave(state.buildProductData());
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <DialogTitle>Product Configuration</DialogTitle>
            <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  state.type === 'window'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => state.setType('window')}
              >
                Window
              </button>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  state.type === 'door'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => state.handleTypeChange('door')}
              >
                Door
              </button>
            </div>
            <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  (state.type === 'door' ? state.doorType : state.windowType) === 'hinged'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => state.type === 'door' ? state.setDoorType('hinged') : state.setWindowType('hinged')}
              >
                Hinged
              </button>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  (state.type === 'door' ? state.doorType : state.windowType) === 'sliding'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => state.type === 'door' ? state.setDoorType('sliding') : state.setWindowType('sliding')}
              >
                Sliding
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </DialogHeader>

        {/* Main content */}
        {initialized && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left column -- controls bar + preview */}
            <div className="flex flex-1 flex-col p-3 min-h-0 overflow-hidden">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center gap-3 mb-2 shrink-0">
                {/* Shape picker popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <span className="text-muted-foreground text-xs">Shape:</span>
                      <span className="capitalize">{state.shape.type.replace('-', ' ')}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground">
                        <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[280px] p-3">
                    <ShapeSelector
                      selected={state.shape.type}
                      onSelect={state.setShapeType}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Panels:</span>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={state.panels}
                    onChange={(e) => state.handlePanelCountChange(Number(e.target.value))}
                    className="w-16 rounded-md border border-input px-2 py-1 text-sm text-center"
                  />
                </div>

                <div className="h-5 w-px bg-border" />

                <CanvasToolbar
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  lineOrientation={lineOrientation}
                  onLineOrientationChange={setLineOrientation}
                  lineTarget={lineTarget}
                  onLineTargetChange={setLineTarget}
                />
              </div>

              {/* Live preview */}
              <div className="flex items-center justify-center flex-1 min-h-0">
                <ShapeCanvas
                  shape={state.shape}
                  width={state.width}
                  height={state.height}
                  unit={state.unit}
                  panels={state.panels}
                  panelWidths={state.panelWidths}
                  frameColor={state.frameColor}
                  glassType={state.glassType}
                  customGlassTint={state.customGlassTint}
                  openingPanels={state.openingPanels}
                  openingDirections={state.openingDirections}
                  isSliding={state.isSliding}
                  panelDivisions={state.panelDivisions}
                  panelDivisionHeights={state.panelDivisionHeights}
                  panelDivisionWidths={state.panelDivisionWidths}
                  openingPanes={state.openingPanes}
                  svgStyle={{ width: '100%', height: '100%' }}
                  onWidthChange={(v) => state.setWidth(v)}
                  onHeightChange={(v) => state.setHeight(v)}
                  onShapeConfigChange={(updates) => state.updateShapeConfig(updates)}
                  onPanelWidthChange={(i, v) => {
                    const newWidths = [...state.panelWidths];
                    const delta = v - newWidths[i];
                    newWidths[i] = v;
                    // Adjust neighbor panel to maintain total width
                    const neighborIdx = i < newWidths.length - 1 ? i + 1 : i - 1;
                    if (neighborIdx >= 0) {
                      newWidths[neighborIdx] = Math.max(newWidths[neighborIdx] - delta, 1);
                    }
                    state.setPanelWidths(newWidths);
                  }}
                  onRowHeightChange={(panelIndex, rowIndex, v) => {
                    const heights = [...state.panelDivisionHeights];
                    const entry = heights.find(h => h.panelIndex === panelIndex);
                    if (entry) {
                      const newRowHeights = [...entry.rowHeights];
                      const delta = v - newRowHeights[rowIndex];
                      newRowHeights[rowIndex] = v;
                      // Adjust neighbor row to maintain total height
                      const neighborRow = rowIndex < newRowHeights.length - 1 ? rowIndex + 1 : rowIndex - 1;
                      if (neighborRow >= 0) {
                        newRowHeights[neighborRow] = Math.max(newRowHeights[neighborRow] - delta, 1);
                      }
                      heights[heights.indexOf(entry)] = { ...entry, rowHeights: newRowHeights };
                      state.setPanelDivisionHeights(heights);
                    }
                  }}
                  activeTool={activeTool}
                  lineOrientation={lineOrientation}
                  lineTarget={lineTarget}
                  onHandlePlaced={(panelIdx, dir, paneInfo) => {
                    if (paneInfo) {
                      state.setOpeningPanes((prev) => [...prev, {
                        panelIndex: panelIdx,
                        rowIndex: paneInfo.rowIndex,
                        colIndex: paneInfo.colIndex,
                        openingDirection: dir as OpeningDirection,
                        openingType: 'hinged',
                      }]);
                    } else {
                      state.setOpeningPanels([...state.openingPanels, panelIdx]);
                      state.setOpeningDirections({ ...state.openingDirections, [panelIdx]: dir as OpeningDirection });
                    }
                    setActiveTool(null);
                  }}
                  onPanelSplit={(splitMm) => {
                    const newWidths = [...state.panelWidths];
                    let accumulated = 0;
                    for (let i = 0; i < newWidths.length; i++) {
                      if (accumulated + newWidths[i] >= splitMm) {
                        const leftWidth = Math.round(splitMm - accumulated);
                        const rightWidth = Math.round(newWidths[i] - leftWidth);
                        if (leftWidth < 10 || rightWidth < 10) return;
                        newWidths.splice(i, 1, leftWidth, rightWidth);
                        break;
                      }
                      accumulated += newWidths[i];
                    }
                    state.setPanels(newWidths.length);
                    state.setPanelWidths(newWidths);
                  }}
                  onPaneRowAdd={(panelIndex, splitMm) => {
                    const existing = state.panelDivisions.find(d => d.panelIndex === panelIndex);
                    const currentRows = existing?.horizontalCount ?? 1;
                    if (currentRows >= 4) return;
                    const newDivisions = state.panelDivisions.filter(d => d.panelIndex !== panelIndex);
                    newDivisions.push({
                      panelIndex,
                      horizontalCount: currentRows + 1,
                      verticalCount: existing?.verticalCount ?? 1,
                    });
                    state.setPanelDivisions(newDivisions);
                    // Split existing row heights at the clicked position
                    const existingHeights = state.panelDivisionHeights.find(h => h.panelIndex === panelIndex);
                    const oldRowHeights = existingHeights?.rowHeights ?? [state.height];
                    const newRowHeights: number[] = [];
                    let accumulated = 0;
                    let inserted = false;
                    for (let i = 0; i < oldRowHeights.length; i++) {
                      if (!inserted && accumulated + oldRowHeights[i] >= splitMm) {
                        const topPart = Math.round(splitMm - accumulated);
                        const bottomPart = Math.round(oldRowHeights[i] - topPart);
                        if (topPart >= 1 && bottomPart >= 1) {
                          newRowHeights.push(topPart, bottomPart);
                        } else {
                          newRowHeights.push(oldRowHeights[i]);
                        }
                        inserted = true;
                      } else {
                        newRowHeights.push(oldRowHeights[i]);
                      }
                      accumulated += oldRowHeights[i];
                    }
                    const newHeights = state.panelDivisionHeights.filter(h => h.panelIndex !== panelIndex);
                    newHeights.push({ panelIndex, rowHeights: newRowHeights });
                    state.setPanelDivisionHeights(newHeights);
                  }}
                  onPaneColAdd={(panelIndex, splitMm) => {
                    const existing = state.panelDivisions.find(d => d.panelIndex === panelIndex);
                    const currentCols = existing?.verticalCount ?? 1;
                    if (currentCols >= 4) return;
                    const newDivisions = state.panelDivisions.filter(d => d.panelIndex !== panelIndex);
                    newDivisions.push({
                      panelIndex,
                      horizontalCount: existing?.horizontalCount ?? 1,
                      verticalCount: currentCols + 1,
                    });
                    state.setPanelDivisions(newDivisions);
                    // Split column widths at clicked position
                    const panelW = state.panelWidths[panelIndex];
                    const existingWidths = state.panelDivisionWidths.find(w => w.panelIndex === panelIndex);
                    const oldColWidths = existingWidths?.colWidths ?? [panelW];
                    const newColWidths: number[] = [];
                    let accumulated = 0;
                    let inserted = false;
                    for (let i = 0; i < oldColWidths.length; i++) {
                      if (!inserted && accumulated + oldColWidths[i] >= splitMm) {
                        const leftPart = Math.round(splitMm - accumulated);
                        const rightPart = Math.round(oldColWidths[i] - leftPart);
                        if (leftPart >= 1 && rightPart >= 1) {
                          newColWidths.push(leftPart, rightPart);
                        } else {
                          newColWidths.push(oldColWidths[i]);
                        }
                        inserted = true;
                      } else {
                        newColWidths.push(oldColWidths[i]);
                      }
                      accumulated += oldColWidths[i];
                    }
                    const newWidthsArr = state.panelDivisionWidths.filter(w => w.panelIndex !== panelIndex);
                    newWidthsArr.push({ panelIndex, colWidths: newColWidths });
                    state.setPanelDivisionWidths(newWidthsArr);
                  }}
                  customArcs={customArcs}
                  onArcPlaced={(arc) => setCustomArcs((prev) => [...prev, arc])}
                  onPanelDividerRemove={(idx) => {
                    const nw = [...state.panelWidths];
                    nw.splice(idx, 2, nw[idx] + nw[idx + 1]);
                    state.setPanels(nw.length);
                    state.setPanelWidths(nw);
                  }}
                  onPaneRowRemove={(pi, ri) => {
                    const ex = state.panelDivisions.find(d => d.panelIndex === pi);
                    if (!ex || ex.horizontalCount <= 1) return;
                    const nd = state.panelDivisions.filter(d => d.panelIndex !== pi);
                    nd.push({ panelIndex: pi, horizontalCount: ex.horizontalCount - 1, verticalCount: ex.verticalCount });
                    state.setPanelDivisions(nd);
                    const eh = state.panelDivisionHeights.find(h => h.panelIndex === pi);
                    if (eh) {
                      const rh = [...eh.rowHeights];
                      rh.splice(ri, 2, rh[ri] + rh[ri + 1]);
                      const nh = state.panelDivisionHeights.filter(h => h.panelIndex !== pi);
                      if (rh.length > 1) nh.push({ panelIndex: pi, rowHeights: rh });
                      state.setPanelDivisionHeights(nh);
                    }
                  }}
                  onPaneColRemove={(pi, ci) => {
                    const ex = state.panelDivisions.find(d => d.panelIndex === pi);
                    if (!ex || ex.verticalCount <= 1) return;
                    const nd = state.panelDivisions.filter(d => d.panelIndex !== pi);
                    nd.push({ panelIndex: pi, horizontalCount: ex.horizontalCount, verticalCount: ex.verticalCount - 1 });
                    state.setPanelDivisions(nd);
                    const ew = state.panelDivisionWidths.find(w => w.panelIndex === pi);
                    if (ew) {
                      const cw = [...ew.colWidths];
                      cw.splice(ci, 2, cw[ci] + cw[ci + 1]);
                      const nw = state.panelDivisionWidths.filter(w => w.panelIndex !== pi);
                      if (cw.length > 1) nw.push({ panelIndex: pi, colWidths: cw });
                      state.setPanelDivisionWidths(nw);
                    }
                  }}
                  onPanelOpeningRemove={(pi) => {
                    state.setOpeningPanels(state.openingPanels.filter(p => p !== pi));
                    const d = { ...state.openingDirections };
                    delete d[pi];
                    state.setOpeningDirections(d);
                  }}
                  onPaneOpeningRemove={(pi, ri, ci) => {
                    state.setOpeningPanes(prev => prev.filter(p => !(p.panelIndex === pi && p.rowIndex === ri && p.colIndex === ci)));
                  }}
                  onArcRemove={(id) => {
                    setCustomArcs(prev => prev.filter(a => a.id !== id));
                  }}
                />
              </div>
            </div>

            {/* Right column -- tabs */}
            <div className="w-96 border-l flex flex-col bg-card shrink-0">
              {/* Tab buttons */}
              <div className="flex border-b px-2 py-2 gap-1">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => state.setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      state.activeTab === tab.key
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4">
                {state.activeTab === 'shape' && (
                  <ShapeTab
                    shape={state.shape}
                    onChange={state.updateShapeConfig}
                  />
                )}

                {state.activeTab === 'dimensions' && (
                  <DimensionsTab
                    width={state.width}
                    height={state.height}
                    unit={state.unit}
                    panels={state.panels}
                    panelWidths={state.panelWidths}
                    setWidth={state.setWidth}
                    setUnit={state.setUnit}
                    handleDimensionChange={state.handleDimensionChange}
                    handlePanelWidthChange={state.handlePanelWidthChange}
                  />
                )}

                {state.activeTab === 'appearance' && (
                  <AppearanceTab
                    frameColor={state.frameColor}
                    glassType={state.glassType}
                    customGlassTint={state.customGlassTint}
                    setFrameColor={state.setFrameColor}
                    setGlassType={state.setGlassType}
                    setCustomGlassTint={state.setCustomGlassTint}
                  />
                )}

                {state.activeTab === 'openings' && (
                  <OpeningsTab
                    panels={state.panels}
                    openingPanels={state.openingPanels}
                    openingDirections={state.openingDirections}
                    type={state.type}
                    setOpeningPanels={state.setOpeningPanels}
                    setOpeningDirections={state.setOpeningDirections}
                  />
                )}

                {state.activeTab === 'panels' && (
                  <PanelsTab
                    panels={state.panels}
                    height={state.height}
                    unit={state.unit}
                    panelWidths={state.panelWidths}
                    panelDivisions={state.panelDivisions}
                    panelDivisionHeights={state.panelDivisionHeights}
                    panelDivisionWidths={state.panelDivisionWidths}
                    openingPanes={state.openingPanes}
                    activeHingeSelector={state.activeHingeSelector}
                    setPanelDivisions={state.setPanelDivisions}
                    setPanelDivisionHeights={state.setPanelDivisionHeights}
                    setPanelDivisionWidths={state.setPanelDivisionWidths}
                    setOpeningPanes={state.setOpeningPanes}
                    setActiveHingeSelector={state.setActiveHingeSelector}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer with save/cancel (visible on mobile as secondary action area) */}
        <DialogFooter className="sm:hidden px-4 py-3 border-t">
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditorDialog;
