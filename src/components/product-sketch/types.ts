export type OpeningDirection = 'left' | 'right' | 'top' | 'bottom';
export type Unit = 'cm' | 'mm' | 'm';
export type GlassType = 'clear' | 'frosted' | 'custom-tint';

export type ShapeType = 'rectangle' | 'arch' | 'trapezoid' | 'l-shape' | 'triangle' | 'pentagon' | 'hexagon';

export interface ShapeConfig {
  type: ShapeType;
  archHeight?: number;
  archType?: 'semicircle' | 'segmental';
  topWidth?: number;
  cutoutWidth?: number;
  cutoutHeight?: number;
  cutoutPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  peakPosition?: number;
}

export interface ProductData {
  type: 'window' | 'door';
  doorType?: 'hinged' | 'sliding';
  windowType?: 'hinged' | 'sliding'; // <-- Add this line
  width: number;
  height: number;
  panels: number;
  openingPanels?: number[];
  openingDirections?: Record<number, OpeningDirection>;
  frameColor?: string;
  glassType?: GlassType;
  customGlassTint?: string;
  panelDivisions?: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
    openingType?: 'hinged' | 'sliding';
  }>;
  sketchSvg?: string;
  unit: Unit;
  panelWidths?: number[]; // New: width for each panel (cm, mm, m)
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  shape?: ShapeConfig;
  removedSections?: Array<{ panelIndex: number; rowIndex: number; colIndex: number }>;
}

export interface ProductSketchProps {
  onSave: (data: ProductData) => void;
  onCancel: () => void;
  initialData?: ProductData;
}

export interface ActiveHingeSelector {
  panelIndex: number;
  rowIndex: number;
  colIndex: number;
}
