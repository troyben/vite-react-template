// ---------------------------------------------------------------------------
// Shared types and constants for ShapeCanvas
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface DividerLine {
  x: number;
  topY: number;
  bottomY: number;
}

// Layout
export const MARGIN = 40;               // space around shape for dimension labels
export const BOTTOM_LABEL_SPACE = 40;   // extra room below shape for inner + outer bottom dimensions

// Dimension lines
export const DIM_COLOR = '#7E88C3';
export const DIM_FONT = 8;
export const DIM_OFFSET = 16;           // how far dimension lines sit from the shape edge
export const MARKER_SIZE = 4;

// Frame
export const FRAME_STROKE = 4;
export const DIVIDER_STROKE = 1.5;

// Arch rendering
export const ARCH_CURVE_STEPS = 24;     // segments for arch curves
