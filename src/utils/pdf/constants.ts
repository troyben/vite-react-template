import type jsPDF from 'jspdf';

// PDF color palette (RGB tuples for jsPDF)
export const COLORS = {
  primary: [13, 71, 161] as const,
  secondary: [25, 118, 210] as const,
  accent: [100, 181, 246] as const,
  accentLight: [232, 240, 254] as const,
  success: [16, 185, 129] as const,
  light: [240, 244, 255] as const,
  dark: [1, 30, 75] as const,
  text: [33, 33, 33] as const,
  subtle: [130, 130, 130] as const,
  white: [255, 255, 255] as const,
  rowAlt: [248, 249, 253] as const,
  border: [215, 220, 235] as const,
};

// A4 page dimensions in mm
export const PAGE = {
  width: 210,
  height: 297,
  margin: 12,
};

export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2; // 186mm

// Column layout for items table (total = CONTENT_WIDTH = 186mm)
export const COLUMNS = {
  sketch: 48,
  name: 72,
  qty: 18,
  price: 24,
  total: 24,
};

// Column X positions (left edges)
export const COL_X = {
  sketch: PAGE.margin,
  name: PAGE.margin + COLUMNS.sketch,
  qty: PAGE.margin + COLUMNS.sketch + COLUMNS.name,
  price: PAGE.margin + COLUMNS.sketch + COLUMNS.name + COLUMNS.qty,
  total: PAGE.margin + COLUMNS.sketch + COLUMNS.name + COLUMNS.qty + COLUMNS.price,
};

export const FONT = {
  companyName: 11,
  quotationLabel: 8,
  sectionLabel: 7,
  body: 9,
  bodySmall: 8,
  small: 7,
  tableHeader: 7.5,
  tableBody: 8,
  tableBold: 8.5,
  summary: 9,
  grandTotal: 11,
};

export const TABLE_HEADER_HEIGHT = 6;
export const MIN_ROW_HEIGHT = 22;
export const ROW_PADDING = 2;
export const FOOTER_HEIGHT = 8;

// Spacing system
export const SPACING = {
  xs: 1.5,
  sm: 3,
  md: 5,
  lg: 8,
  xl: 12,
  section: 6,
};

// Border radius for roundedRect
export const RADIUS = {
  sm: 1,
  md: 2,
  lg: 3,
};

// Style application helpers — set font, size, color in one call
export function applyHeading(doc: jsPDF): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT.companyName);
  doc.setTextColor(...COLORS.dark);
}

export function applyBody(doc: jsPDF): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT.body);
  doc.setTextColor(...COLORS.text);
}

export function applySubtle(doc: jsPDF): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT.bodySmall);
  doc.setTextColor(...COLORS.subtle);
}

export function applyLabel(doc: jsPDF): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT.sectionLabel);
  doc.setTextColor(...COLORS.subtle);
}
