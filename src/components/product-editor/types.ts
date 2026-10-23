import type { SectionId } from '@/components/product-editor/canvas/utils/section-outline';

export type OpeningDirection = 'left' | 'right' | 'top' | 'bottom';
export type Unit = 'cm' | 'mm' | 'm';
export type GlassType = 'clear' | 'frosted' | 'custom-tint';

export type ShapeType = 'rectangle' | 'circle' | 'arch' | 'trapezoid' | 'slope-left' | 'slope-right' | 'l-shape' | 'n-shape' | 'triangle' | 'gable' | 'pentagon' | 'hexagon';

export interface ShapeConfig {
  type: ShapeType;
  archHeight?: number;
  archType?: 'semicircle' | 'segmental';
  topWidth?: number;
  /** Sloped top: shorter vertical side, in the product's dimension unit. */
  shortSideHeight?: number;
  cutoutWidth?: number;
  cutoutHeight?: number;
  /** N-Shape: distance from the left edge to the bottom opening. */
  cutoutOffset?: number;
  cutoutPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  peakPosition?: number;
  /** Gable: apex rise above the side walls (mm). Total height includes it. */
  gableHeight?: number;
}

/**
 * One leg of a corner-window chain. Segment 0 mirrors the legacy top-level
 * ProductData fields so old payloads keep working; attached segments are
 * always rectangles.
 */
export interface Segment {
  id: string;
  width: number;
  panels: number;
  panelWidths: number[];
  panelDivisions?: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  openingPanels?: number[];
  openingDirections?: Record<number, OpeningDirection>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
    openingType?: 'hinged' | 'sliding';
  }>;
  removedSections?: SectionId[];
}

/** Joins segments[i] to segments[i+1]. */
export interface Connector {
  id: string;
  /** Interior angle in degrees. Integer, 1-359. 180 is straight. */
  angle: number;
  /** Aluminium corner post width in mm. */
  postWidth: number;
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
  render3D?: boolean;
  segments?: Segment[];
  connectors?: Connector[];
  rootSegmentIndex?: number;
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
