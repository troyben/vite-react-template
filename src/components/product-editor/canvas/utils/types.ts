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
export const BOTTOM_LABEL_SPACE = 55;   // extra room below shape for inner + outer bottom dimensions

// Dimension lines
export const DIM_COLOR = '#7E88C3';
export const DIM_FONT = 11;
export const DIM_OFFSET = 22;           // how far dimension lines sit from the shape edge
export const MARKER_SIZE = 5;
export const DIM_LABEL_GAP = 11;        // gap between dimension line and label text

// ---------------------------------------------------------------------------
// Chain dimension stack
//
// A leg carries two rows of dimensions along its sill: its panel widths, then
// its own overall width. They are measured outward from the sill on the leg's
// normal, which for a receding leg points diagonally -- so the rows have to be
// stacked by distance, not by screen y, or they cross each other.
//
// Both the layer that draws them and the projection that sizes the viewBox
// need these numbers, so they live here rather than in either one.
// ---------------------------------------------------------------------------
export const CHAIN_INNER_DIM_OFFSET = 12;   // panel-width line, from the sill
export const CHAIN_INNER_LABEL_GAP = 9;     // its label, further out again
export const CHAIN_LEG_DIM_OFFSET = 32;     // the leg's own width line
export const CHAIN_LEG_LABEL_GAP = 9;       // its label, outside the line
/** Furthest any chain dimension reaches from a leg's sill. */
export const CHAIN_DIM_REACH = CHAIN_LEG_DIM_OFFSET + CHAIN_LEG_LABEL_GAP + DIM_FONT;

// Frame
export const FRAME_STROKE = 4;
export const DIVIDER_STROKE = 1.5;

// Arch rendering
export const ARCH_CURVE_STEPS = 24;     // segments for arch curves
