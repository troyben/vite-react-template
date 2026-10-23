import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Shapes, Ruler, Palette, DoorOpen, LayoutGrid, Save, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import ShapeSelector from '@/components/product-editor/canvas/ShapeSelector';
import { shapeLabels } from '@/components/product-editor/shapeLabels';
import CanvasToolbar from '@/components/product-editor/canvas/CanvasToolbar';
import ShapeTab from '@/components/product-editor/tabs/ShapeTab';
import DimensionsTab from '@/components/product-editor/tabs/DimensionsTab';
import AppearanceTab from '@/components/product-editor/tabs/AppearanceTab';
import OpeningsTab from '@/components/product-editor/tabs/OpeningsTab';
import PanelsTab from '@/components/product-editor/tabs/PanelsTab';
import type { CanvasTool, PlacedArc } from '@/components/product-editor/canvas/utils/canvas-tools';
import type { ProductData } from '@/components/product-editor/types';
import { nudgeBend } from '@/components/product-editor/canvas/utils/chain-model';
import { useProductEditorState, type ProductEditorTabKey } from './useProductEditorState';
import { buildActiveSegmentView, buildShapeCanvasHandlers } from './productEditorHandlers';

export type ProductEditorMode = 'page' | 'dialog';

export interface ProductEditorProps {
  mode: ProductEditorMode;
  initialData?: ProductData;
  onSave: (data: ProductData) => void;
  onCancel: () => void;
  templateName?: string;
  onNameChange?: (n: string) => void;
  onSaveAsNew?: (data: ProductData, name: string) => void;
}

export interface ProductEditorHandle {
  /** Build a snapshot of current product data (for cost calc, save-as, etc.) */
  buildProductData: () => ProductData;
}

const TAB_CONFIG: { key: ProductEditorTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'shape', label: 'Shape', icon: <Shapes className="h-3.5 w-3.5" /> },
  { key: 'dimensions', label: 'Dims', icon: <Ruler className="h-3.5 w-3.5" /> },
  { key: 'appearance', label: 'Look', icon: <Palette className="h-3.5 w-3.5" /> },
  { key: 'openings', label: 'Open', icon: <DoorOpen className="h-3.5 w-3.5" /> },
  { key: 'panels', label: 'Panes', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
];

const ProductEditor = forwardRef<ProductEditorHandle, ProductEditorProps>(function ProductEditor(
  { mode, initialData, onSave, onCancel },
  ref,
) {
  const state = useProductEditorState();
  useImperativeHandle(ref, () => ({
    buildProductData: () => state.buildProductData(),
  }), [state]);
  const [activeTool, setActiveTool] = useState<CanvasTool>(null);
  const [lineOrientation, setLineOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [lineTarget, setLineTarget] = useState<'panel' | 'pane'>('panel');
  const [customArcs, setCustomArcs] = useState<PlacedArc[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Hydrate from initialData on first render (or when initialData identity changes)
  useEffect(() => {
    if (initialData) {
      state.populateFromData(initialData);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Escape deactivates the tool and deselects the connector; arrow keys nudge
  // the selected connector's angle by 1 degree while one is selected.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
        state.chain.setActiveConnectorIndex(null);
        return;
      }
      const idx = state.chain.activeConnectorIndex;
      if (idx == null) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Don't hijack arrow keys that are the native increment/decrement for
        // whatever form control currently has focus (width/height/panel-width/
        // row-height/post-width number fields, selects), nor the slider handle,
        // which runs the same nudge itself when it holds focus.
        const t = e.target as HTMLElement | null;
        if (t && (
          t.isContentEditable
          || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
          || t.getAttribute('role') === 'slider'
          // The chain canvas handles this itself whenever it holds focus, which
          // is the normal case once a post is selected. This listener is only
          // the fallback for when focus sits somewhere else entirely.
          || t.closest?.('[data-chain-canvas]')
        )) return;
        e.preventDefault();
        // Nudge the BEND, not the stored interior angle -- they run in
        // opposite directions, so stepping the interior angle sent the handle
        // and the leg the way the key did not point. Shared with the slider.
        state.chain.setConnectorAngle(
          idx,
          nudgeBend(state.chain.chain.connectors[idx].angle, e.key === 'ArrowUp' ? 1 : -1),
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.chain]);

  // Keep the chain's root segment in sync with the editor's own dimension/panel
  // state, so a chained product reflects edits made through the Dimensions and
  // Panels tabs (which write to `state`, not directly to `state.chain`).
  //
  // Safe to leave targeting `rootIndex` (not `activeSegmentIndex`): every write
  // path into these flat fields — the tabs, the Panels: input, and the canvas
  // handlers — now goes through `buildActiveSegmentView`, which only touches
  // flat `state.*` when the root leg is the active one (see `view` below).
  // So by the time this effect's deps change, the root leg *is* the one that
  // was just edited, whichever leg happens to be selected when it runs. Do
  // NOT swap this to `activeSegmentIndex` — that would instead copy whatever
  // leg was active into the *newly* active leg on every selection change.
  useEffect(() => {
    state.chain.updateSegment(state.chain.chain.rootIndex, {
      width: state.width,
      panels: state.panels,
      panelWidths: state.panelWidths,
      panelDivisions: state.panelDivisions,
      panelDivisionHeights: state.panelDivisionHeights,
      panelDivisionWidths: state.panelDivisionWidths,
      openingPanels: state.openingPanels,
      openingDirections: state.openingDirections,
      openingPanes: state.openingPanes,
      removedSections: state.removedSections,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.width, state.panels, state.panelWidths, state.panelDivisions,
      state.panelDivisionHeights, state.panelDivisionWidths, state.openingPanels,
      state.openingDirections, state.openingPanes, state.removedSections]);

  const handlers = buildShapeCanvasHandlers(state, { customArcs, setCustomArcs });
  // The chain canvas edits the leg under the pointer, which is not always the
  // selected one, so it asks for that leg's handlers at click time.
  const segmentTools = (segmentIndex: number) =>
    buildShapeCanvasHandlers(state, { customArcs, setCustomArcs }, segmentIndex);
  // Read/write view over the active leg — the root leg's flat state when the
  // root is active (byte-for-byte the same as before), or the selected leg's
  // own data otherwise. Backs the Panels: input and the Dims/Open/Panes tabs.
  // Shape and Look stay bound to flat state: shape-type editing is root-only
  // by design, and frame color/glass are shared across every leg.
  const view = buildActiveSegmentView(state);

  const handleReset = () => {
    state.setWidth(1000);
    state.setHeight(1000);
    state.setPanels(1);
    state.setPanelWidths([1000]);
    state.setPanelDivisions([]);
    state.setPanelDivisionHeights([]);
    state.setPanelDivisionWidths([]);
    state.setOpeningPanels([]);
    state.setOpeningDirections({});
    state.setOpeningPanes([]);
    state.setRemovedSections([]);
    state.setShape({ type: 'rectangle' });
    state.chain.resetChain(1000);
    setCustomArcs([]);
    setActiveTool(null);
  };

  if (!hydrated) return null;

  // Outer wrapper differs by mode. The page mode is intended to mount inside an
  // existing page layout (TemplateCreator owns the header / save dialog / sidebar
  // chrome). Dialog mode would render header buttons inline.
  const isDialog = mode === 'dialog';

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left column — controls bar + preview */}
      <div className="flex flex-1 flex-col p-3 min-h-0 overflow-hidden">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3 mb-2 shrink-0">
          {/* Shape picker popover */}
          <Popover>
            <PopoverTrigger className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
              <span className="text-muted-foreground text-xs">Shape:</span>
              <span>{shapeLabels[state.shape.type]}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground">
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[280px] p-3">
              <ShapeSelector
                selected={state.shape.type}
                onSelect={state.setShapeType}
                onConnectorTool={() => setActiveTool(activeTool === 'connector' ? null : 'connector')}
                connectorActive={activeTool === 'connector'}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Panels:</span>
            <input
              type="number"
              min={1}
              max={8}
              value={view.panels}
              onChange={(e) => view.handlePanelCountChange(Number(e.target.value))}
              className="w-16 rounded-md border border-input px-2 py-1 text-sm text-center"
            />
          </div>

          <div className="h-5 w-px bg-border" />

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
                  ? 'bg-green-100 text-green-800 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() =>
                state.type === 'door' ? state.setDoorType('hinged') : state.setWindowType('hinged')
              }
            >
              Hinged
            </button>
            <button
              type="button"
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                (state.type === 'door' ? state.doorType : state.windowType) === 'sliding'
                  ? 'bg-orange-100 text-orange-800 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() =>
                state.type === 'door' ? state.setDoorType('sliding') : state.setWindowType('sliding')
              }
            >
              Sliding
            </button>
          </div>

          <div className="h-5 w-px bg-border" />

          <CanvasToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            lineOrientation={lineOrientation}
            onLineOrientationChange={setLineOrientation}
            lineTarget={lineTarget}
            onLineTargetChange={setLineTarget}
            onReset={() => setResetConfirmOpen(true)}
            onRotateShape={state.shape.type === 'l-shape' ? state.rotateShape : undefined}
            render3D={state.render3D}
            onRender3DChange={state.setRender3D}
          />

          {isDialog && (
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={() => onSave(state.buildProductData())}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className={`flex items-center justify-center flex-1 min-h-0 overflow-hidden ${isDialog ? 'pt-8' : ''}`}>
          <ShapeCanvas
            svgStyle={{ width: '100%', height: '100%' }}
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
            onWidthChange={handlers.onWidthChange}
            onHeightChange={handlers.onHeightChange}
            onShapeConfigChange={(updates) => state.updateShapeConfig(updates)}
            onPanelWidthChange={handlers.onPanelWidthChange}
            onRowHeightChange={handlers.onRowHeightChange}
            activeTool={activeTool}
            lineOrientation={lineOrientation}
            lineTarget={lineTarget}
            onHandlePlaced={handlers.onHandlePlaced}
            onPanelSplit={handlers.onPanelSplit}
            onPaneRowAdd={handlers.onPaneRowAdd}
            onPaneColAdd={handlers.onPaneColAdd}
            customArcs={customArcs}
            onArcPlaced={handlers.onArcPlaced}
            onPanelDividerRemove={handlers.onPanelDividerRemove}
            onPaneRowRemove={handlers.onPaneRowRemove}
            onPaneColRemove={handlers.onPaneColRemove}
            onPanelOpeningRemove={handlers.onPanelOpeningRemove}
            onPaneOpeningRemove={handlers.onPaneOpeningRemove}
            onArcRemove={handlers.onArcRemove}
            removedSections={state.removedSections}
            onSectionRemove={handlers.onSectionRemove}
            segmentTools={segmentTools}
            render3D={state.render3D}
            chain={state.chain.chain}
            activeSegmentIndex={state.chain.activeSegmentIndex}
            activeConnectorIndex={state.chain.activeConnectorIndex}
            onSegmentSelect={state.chain.setActiveSegmentIndex}
            onConnectorSelect={state.chain.setActiveConnectorIndex}
            onConnectorAngleChange={state.chain.setConnectorAngle}
            onConnectorRemove={state.chain.removeConnector}
            onSegmentAttach={(end, w) => state.chain.attachSegment(end, w)}
          />
        </div>
      </div>

      {/* Right column — tabs */}
      <div className="w-96 border-l flex flex-col bg-card shrink-0">
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

        <div className="flex-1 overflow-y-auto p-4">
          {state.activeTab === 'shape' && (
            <ShapeTab shape={state.shape} width={state.width} height={state.height} unit={state.unit} onChange={state.updateShapeConfig} />
          )}

          {state.activeTab === 'dimensions' && (
            <DimensionsTab
              isCircle={view.isRootActive && state.shape.type === 'circle'}
              width={view.width}
              height={state.height}
              unit={state.unit}
              panels={view.panels}
              panelWidths={view.panelWidths}
              setWidth={view.setWidth}
              setUnit={state.setUnit}
              handleDimensionChange={view.handleDimensionChange}
              handlePanelWidthChange={view.handlePanelWidthChange}
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
              panels={view.panels}
              openingPanels={view.openingPanels}
              openingDirections={view.openingDirections}
              type={state.type}
              setOpeningPanels={view.setOpeningPanels}
              setOpeningDirections={view.setOpeningDirections}
            />
          )}

          {state.activeTab === 'panels' && (
            <PanelsTab
              panels={view.panels}
              height={state.height}
              unit={state.unit}
              panelWidths={view.panelWidths}
              panelDivisions={view.panelDivisions}
              panelDivisionHeights={view.panelDivisionHeights}
              panelDivisionWidths={view.panelDivisionWidths}
              openingPanes={view.openingPanes}
              activeHingeSelector={state.activeHingeSelector}
              setPanelDivisions={view.setPanelDivisions}
              setPanelDivisionHeights={view.setPanelDivisionHeights}
              setPanelDivisionWidths={view.setPanelDivisionWidths}
              setOpeningPanes={view.setOpeningPanes}
              setActiveHingeSelector={state.setActiveHingeSelector}
            />
          )}
        </div>
      </div>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Reset canvas?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear shape, panels, openings, and any custom edits. Cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleReset();
                setResetConfirmOpen(false);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default ProductEditor;
