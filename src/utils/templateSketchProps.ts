import type { ProductData } from '@/components/product-sketch/types';
import type { ShapeCanvasProps } from '@/components/template-creator/ShapeCanvas';

/**
 * Maps a ProductData object (from a SketchTemplate's sketchData) to the props
 * required by ShapeCanvas. Used on the Templates listing page and in
 * TemplateDetailModal to keep both renders consistent.
 */
export function extractShapeCanvasProps(
  sketchData: ProductData,
): Omit<ShapeCanvasProps, 'svgStyle'> {
  return {
    shape: sketchData.shape || { type: 'rectangle' as const },
    width: sketchData.width,
    height: sketchData.height,
    unit: sketchData.unit || 'mm',
    panels: sketchData.panels || 1,
    panelWidths: sketchData.panelWidths || [sketchData.width],
    frameColor: sketchData.frameColor || '#C0C0C0',
    glassType: sketchData.glassType || 'clear',
    customGlassTint: sketchData.customGlassTint,
    openingPanels: sketchData.openingPanels || [],
    openingDirections: sketchData.openingDirections || {},
    isSliding:
      (sketchData.type === 'door' && sketchData.doorType === 'sliding') ||
      (sketchData.type === 'window' && sketchData.windowType === 'sliding') ||
      false,
    panelDivisions: sketchData.panelDivisions,
    panelDivisionHeights: sketchData.panelDivisionHeights || [],
    panelDivisionWidths: sketchData.panelDivisionWidths || [],
    openingPanes: sketchData.openingPanes || [],
  };
}

/**
 * Formats an ISO date string for display in template cards and modals.
 */
export function formatTemplateDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
