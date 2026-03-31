import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { getTemplateById, createTemplate, updateTemplate } from '@/services/templateService';
import { notify } from '@/utils/notifications';
import type {
  ShapeConfig,
  ShapeType,
  OpeningDirection,
  Unit,
  GlassType,
  ProductData,
  ActiveHingeSelector,
} from '@/components/product-sketch/types';
import '../styles/ProductSketch.css';

type TabKey = 'shape' | 'dimensions' | 'appearance' | 'openings' | 'panels';

const TAB_CONFIG: { key: TabKey; label: string; icon: string }[] = [
  { key: 'shape', label: 'Shape', icon: '/ruler.png' },
  { key: 'dimensions', label: 'Dims', icon: '/ruler.png' },
  { key: 'appearance', label: 'Look', icon: '/painting.png' },
  { key: 'openings', label: 'Open', icon: '/cogs.svg' },
  { key: 'panels', label: 'Panes', icon: '/grid.svg' },
];

function useTemplateCreatorState() {
  // Template metadata
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateId, setTemplateId] = useState<number | null>(null);

  // Shape
  const [shape, setShapeState] = useState<ShapeConfig>({ type: 'rectangle' });

  // Product state (mirrors useProductSketchState)
  const [type, setType] = useState<'window' | 'door'>('window');
  const [doorType, setDoorType] = useState<'hinged' | 'sliding'>('hinged');
  const [windowType, setWindowType] = useState<'hinged' | 'sliding'>('hinged');
  const [width, setWidth] = useState<number>(1000);
  const [height, setHeight] = useState<number>(1000);
  const [panels, setPanels] = useState<number>(1);
  const [unit, setUnit] = useState<Unit>('mm');
  const [openingPanels, setOpeningPanels] = useState<number[]>([]);
  const [openingDirections, setOpeningDirections] = useState<Record<number, OpeningDirection>>({});
  const [frameColor, setFrameColor] = useState<string>('#C0C0C0');
  const [glassType, setGlassType] = useState<GlassType>('clear');
  const [customGlassTint, setCustomGlassTint] = useState<string>('#FFFFFF');
  const [panelDivisions, setPanelDivisions] = useState<Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>>([]);
  const [openingPanes, setOpeningPanes] = useState<Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>>([]);
  const [activeHingeSelector, setActiveHingeSelector] = useState<ActiveHingeSelector | null>(null);
  const [panelWidths, setPanelWidths] = useState<number[]>([1000]);
  const [activeTab, setActiveTab] = useState<TabKey>('dimensions');

  const isSliding = (type === 'door' && doorType === 'sliding') || (type === 'window' && windowType === 'sliding');

  // Shape setter with type change handling
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
    const numValue = parseInt(value);
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
    let num = parseInt(value);
    if (isNaN(num) || num <= 0) return;
    let newWidths = [...panelWidths];
    if (panelIndex === panels - 1) {
      const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
      num = Math.max(width - sumExceptLast, 1);
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
      shape,
    };
  }, [type, doorType, windowType, height, panels, openingPanels, openingDirections,
      frameColor, glassType, customGlassTint, panelDivisions, openingPanes, unit, panelWidths, shape]);

  // Load template from API
  const loadTemplate = useCallback(async (id: number) => {
    try {
      const response = await getTemplateById(id);
      if (response.data.success) {
        const tpl = response.data.data;
        setTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setTemplateDescription(tpl.description || '');
        const d = tpl.sketchData;
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
        setShapeState(d.shape || { type: 'rectangle' });
      }
    } catch {
      notify.error('Failed to load template');
    }
  }, []);

  // Save template to API
  const saveTemplate = useCallback(async (name: string, description: string) => {
    const sketchData = buildProductData();
    try {
      if (templateId) {
        const response = await updateTemplate(templateId, { name, description, sketchData });
        if (response.data.success) {
          setTemplateName(name);
          setTemplateDescription(description);
          notify.success('Template updated');
          return true;
        }
      } else {
        const response = await createTemplate({ name, description, sketchData });
        if (response.data.success) {
          setTemplateId(response.data.data.id);
          setTemplateName(name);
          setTemplateDescription(description);
          notify.success('Template saved');
          return true;
        }
      }
    } catch {
      notify.error('Failed to save template');
    }
    return false;
  }, [templateId, buildProductData]);

  return {
    // Template meta
    templateName, setTemplateName,
    templateDescription, setTemplateDescription,
    templateId,
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
    activeTab, setActiveTab,
    isSliding,
    // Handlers
    handleDimensionChange,
    handleTypeChange,
    handlePanelCountChange,
    handlePanelWidthChange,
    // Actions
    buildProductData,
    loadTemplate,
    saveTemplate,
  };
}

const TemplateCreator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const state = useTemplateCreatorState();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Load template if editing
  useEffect(() => {
    if (id) {
      state.loadTemplate(parseInt(id, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveClick = () => {
    setSaveName(state.templateName);
    setSaveDescription(state.templateDescription);
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const success = await state.saveTemplate(saveName.trim(), saveDescription.trim());
    setSaving(false);
    if (success) {
      setSaveDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Input
          value={state.templateName}
          onChange={(e) => state.setTemplateName(e.target.value)}
          className="max-w-xs font-semibold"
          placeholder="Template name"
        />
        <div className="flex-1" />
        <Button size="sm" onClick={handleSaveClick}>
          <Save className="h-4 w-4 mr-1" data-icon="inline-start" />
          Save Template
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left column — controls bar + preview, no scroll */}
        <div className="flex flex-1 flex-col p-3 min-h-0 overflow-hidden">
          {/* Controls bar — compact, shrinks to fit */}
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
              <span className="text-sm text-muted-foreground">Type:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    state.type === 'window'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => state.setType('window')}
                >
                  Window
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    state.type === 'door'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => state.handleTypeChange('door')}
                >
                  Door
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {state.type === 'door' ? 'Door:' : 'Window:'}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    (state.type === 'door' ? state.doorType : state.windowType) === 'hinged'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => state.type === 'door' ? state.setDoorType('hinged') : state.setWindowType('hinged')}
                >
                  Hinged
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    (state.type === 'door' ? state.doorType : state.windowType) === 'sliding'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => state.type === 'door' ? state.setDoorType('sliding') : state.setWindowType('sliding')}
                >
                  Sliding
                </button>
              </div>
            </div>
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
          </div>

          {/* Live preview — fills all remaining vertical space */}
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
            />
          </div>
        </div>

        {/* Right column — tabs */}
        <div className="w-80 border-l flex flex-col bg-card">
          {/* Tab buttons */}
          <div className="flex border-b px-2 py-2 gap-1">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => state.setActiveTab(tab.key)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  state.activeTab === tab.key
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
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
                panelDivisions={state.panelDivisions}
                openingPanes={state.openingPanes}
                activeHingeSelector={state.activeHingeSelector}
                setPanelDivisions={state.setPanelDivisions}
                setOpeningPanes={state.setOpeningPanes}
                setActiveHingeSelector={state.setActiveHingeSelector}
              />
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Template Name</label>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter template name"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Brief description of this template"
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveConfirm} disabled={saving || !saveName.trim()}>
              {saving ? 'Saving...' : (state.templateId ? 'Update' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateCreator;
