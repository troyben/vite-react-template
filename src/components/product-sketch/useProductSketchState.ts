import React, { useState } from 'react';
import type { ProductSketchProps, OpeningDirection, Unit, GlassType, ProductData, ActiveHingeSelector } from './types';

export function useProductSketchState({ onSave, onCancel, initialData }: ProductSketchProps) {
  // Basic product state
  const [type, setType] = useState<'window' | 'door'>(initialData?.type || 'window');
  const [doorType, setDoorType] = useState<'hinged' | 'sliding'>(
    initialData?.doorType || 'hinged'
  );
  const [windowType, setWindowType] = useState<'hinged' | 'sliding'>(
    initialData?.windowType || 'hinged'
  ); // <-- Add this line
  const [width, setWidth] = useState<number>(initialData?.width || 1000);
  const [height, setHeight] = useState<number>(initialData?.height || 1000);
  const [panels, setPanels] = useState<number>(initialData?.panels || 1);
  const [unit, setUnit] = useState<Unit>(initialData?.unit || 'mm');

  // Panel and opening state
  const [openingPanels, setOpeningPanels] = useState<number[]>(
    initialData?.openingPanels || []
  );
  const [openingDirections, setOpeningDirections] = useState<Record<number, OpeningDirection>>(
    initialData?.openingDirections || {} as Record<number, OpeningDirection>
  );
  const [frameColor, setFrameColor] = useState<string>(initialData?.frameColor || '#C0C0C0');
  const [glassType, setGlassType] = useState<GlassType>(
    initialData?.glassType || 'clear'
  );
  const [customGlassTint, setCustomGlassTint] = useState<string>(
    initialData?.customGlassTint || '#FFFFFF'
  );
  const [panelDivisions, setPanelDivisions] = useState<Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>>(initialData?.panelDivisions || []);
  const [openingPanes, setOpeningPanes] = useState<Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
    openingType?: 'hinged' | 'sliding';
  }>>(initialData?.openingPanes || []);

  const [activeHingeSelector, setActiveHingeSelector] = useState<ActiveHingeSelector | null>(null);

  // New: panel widths state
  const [panelWidths, setPanelWidths] = useState<number[]>(
    initialData?.panelWidths && initialData.panelWidths.length === panels
      ? initialData.panelWidths
      : Array(panels).fill(Math.round((initialData?.width || 100) / panels))
  );

  // New: panel division heights state
  const [panelDivisionHeights, setPanelDivisionHeights] = useState<Array<{ panelIndex: number; rowHeights: number[] }>>(
    initialData?.panelDivisionHeights || []
  );

  // New: panel division widths state
  const [panelDivisionWidths, setPanelDivisionWidths] = useState<Array<{ panelIndex: number; colWidths: number[] }>>(
    initialData?.panelDivisionWidths || []
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<'dimensions' | 'appearance' | 'openings' | 'divisions' | 'panels'>('dimensions');

  // Use correct sliding logic for both doors and windows (make available to all render logic)
  const isSliding = (type === 'door' && doorType === 'sliding') || (type === 'window' && windowType === 'sliding');

  const handleSave = () => {
    // New: total width/height from panelWidths/panelDivisionHeights
    const totalWidth = panelWidths.reduce((a, b) => a + b, 0);
    const newPanelDivisionHeights = panelDivisionHeights.map(h => ({
      ...h,
      rowHeights: h.rowHeights.slice()
    }));
    const data: ProductData = {
      type,
      doorType: type === 'door' ? doorType : undefined,
      windowType: type === 'window' ? windowType : undefined, // <-- Add this line
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
      panelDivisionHeights: newPanelDivisionHeights,
      panelDivisionWidths: panelDivisionWidths.length > 0 ? panelDivisionWidths.map(w => ({ ...w, colWidths: w.colWidths.slice() })) : undefined,
    };
    onSave(data);
  };

  const handleDimensionChange = (value: string, dimension: 'width' | 'height') => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    if (dimension === 'width') {
      setWidth(numValue);
    } else {
      setHeight(numValue);
    }
  };

  // Ensure doorType is set to 'hinged' when switching to door type
  const handleTypeChange = (newType: 'window' | 'door') => {
    setType(newType);
    if (newType === 'door') {
      setDoorType('hinged');
    }
  };

  // Update setPanels to properly initialize divisions and auto-divide panel widths
  const handlePanelCountChange = (newCount: number) => {
    setPanels(newCount);
    // Initialize divisions for new panels
    const existingDivisions = [...panelDivisions];
    for (let i = 0; i < newCount; i++) {
      if (!existingDivisions.find(d => d.panelIndex === i)) {
        existingDivisions.push({
          panelIndex: i,
          horizontalCount: 1,
          verticalCount: 1
        });
      }
    }
    setPanelDivisions(existingDivisions);

    // Auto-divide panel widths equally
    const avg = Math.round(width / newCount);
    const widths = Array(newCount).fill(avg);
    // Adjust last panel to ensure sum matches width exactly
    if (newCount > 0) {
      widths[newCount - 1] = width - avg * (newCount - 1);
    }
    setPanelWidths(widths);
  };

  // Helper to keep panelWidths sum in sync with total width (proportional scaling)
  const syncPanelWidths = (newWidths: number[], totalWidth: number) => {
    const currentSum = newWidths.reduce((a, b) => a + b, 0);
    if (currentSum === 0) return newWidths.map(() => Math.round(totalWidth / newWidths.length));
    const scale = totalWidth / currentSum;
    const scaled = newWidths.map(w => Math.round(w * scale));
    // Fix rounding: adjust last panel to hit exact total
    const roundedSum = scaled.reduce((a, b) => a + b, 0);
    scaled[scaled.length - 1] += totalWidth - roundedSum;
    return scaled;
  };

  // When panels or width changes, update panelWidths
  React.useEffect(() => {
    setPanelWidths((prev) => {
      let arr = prev.slice(0, panels);
      if (arr.length < panels) {
        // Fill new panels with equal width
        const missing = panels - arr.length;
        arr = [...arr, ...Array(missing).fill(Math.round(width / panels))];
      }
      // Always sync last panel
      return syncPanelWidths(arr, width);
    });
    // eslint-disable-next-line
  }, [panels, width]);

  // Close on Escape key
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close when clicking the backdrop (but not when clicking inside the container)
    if (e.currentTarget === e.target) {
      onCancel();
    }
  };

  // When user edits a panel width, adjust the neighbor panel to keep sum = width
  const handlePanelWidthChange = (panelIndex: number, value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) return;
    const newWidths = [...panelWidths];
    const delta = num - newWidths[panelIndex];
    newWidths[panelIndex] = num;
    // Adjust neighbor: next panel, or previous if editing last
    const neighborIdx = panelIndex < panels - 1 ? panelIndex + 1 : panelIndex - 1;
    if (neighborIdx >= 0) {
      newWidths[neighborIdx] = Math.max(newWidths[neighborIdx] - delta, 1);
    }
    setPanelWidths(newWidths);
  };

  return {
    // State values
    type,
    doorType,
    windowType,
    width,
    height,
    panels,
    unit,
    openingPanels,
    openingDirections,
    frameColor,
    glassType,
    customGlassTint,
    panelDivisions,
    openingPanes,
    activeHingeSelector,
    panelWidths,
    panelDivisionHeights,
    panelDivisionWidths,
    activeTab,
    isSliding,

    // Setters
    setType,
    setDoorType,
    setWindowType,
    setWidth,
    setHeight,
    setPanels,
    setUnit,
    setOpeningPanels,
    setOpeningDirections,
    setFrameColor,
    setGlassType,
    setCustomGlassTint,
    setPanelDivisions,
    setOpeningPanes,
    setActiveHingeSelector,
    setPanelWidths,
    setPanelDivisionHeights,
    setPanelDivisionWidths,
    setActiveTab,

    // Handlers
    handleSave,
    handleDimensionChange,
    handleTypeChange,
    handlePanelCountChange,
    handleOverlayClick,
    handlePanelWidthChange,

    // For cancel
    onCancel,
  };
}
