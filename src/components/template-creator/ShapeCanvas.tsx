import React, { useId, useState, useRef, useEffect, useCallback } from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';

// Utils
import type { Point } from './utils/types';
import {
  MARGIN,
  BOTTOM_LABEL_SPACE,
  DIM_COLOR,
  DIM_FONT,
  FRAME_STROKE,
  DIVIDER_STROKE,
  DIM_OFFSET,
  MARKER_SIZE,
} from './utils/types';
import { getGlassColor } from './utils/glass-color';
import { getArchRy, getRealVertices, scaleVertices, getShapePath } from './utils/shape-path';
import { getOutwardNormal, realEdgeLength, isBottomEdge } from './utils/geometry';
import { getPanelDividers, getPanelPolygonPoints, getPanelCenter } from './utils/panels';
import { getTopYAtX, getBottomYAtX, getLeftXAtY, getRightXAtY } from './utils/boundaries';
import { getOpeningIndicator } from './utils/opening-indicators';
import type { CanvasTool, PlacedArc } from './utils/canvas-tools';
import { svgToReal, realToSvg, snapToGrid, generateId } from './utils/canvas-tools';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ShapeCanvasProps {
  shape: ShapeConfig;
  width: number;       // real-world width (mm)
  height: number;      // real-world height (mm)
  unit: string;
  panels: number;
  panelWidths: number[];
  frameColor: string;
  glassType: string;
  customGlassTint?: string;
  openingPanels: number[];
  openingDirections: Record<number, string>;
  isSliding: boolean;
  panelDivisions?: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: string;
    openingType?: 'hinged' | 'sliding';
  }>;
  /** Override the default SVG inline style. When omitted, defaults to full-page layout. */
  svgStyle?: React.CSSProperties;

  /** Editing callbacks -- when provided, dimension labels become double-clickable for inline editing */
  onWidthChange?: (newWidth: number) => void;
  onHeightChange?: (newHeight: number) => void;
  onShapeConfigChange?: (updates: Partial<import('@/components/product-sketch/types').ShapeConfig>) => void;
  onPanelWidthChange?: (panelIndex: number, newWidth: number) => void;
  onRowHeightChange?: (panelIndex: number, rowIndex: number, newHeight: number) => void;

  /** Active drawing tool (null = no tool, default selection mode) */
  activeTool?: CanvasTool;
  /** Line orientation when line tool is active */
  lineOrientation?: 'horizontal' | 'vertical';
  /** Line target: 'panel' splits the frame adding a panel divider, 'pane' subdivides a panel */
  lineTarget?: 'panel' | 'pane';
  /** Callback when a handle is placed via the handle tool */
  onHandlePlaced?: (panelIndex: number, direction: 'left' | 'right' | 'top' | 'bottom', paneInfo?: { rowIndex: number; colIndex: number }) => void;
  /** Callback to split a panel at the given real-world X position (mm) */
  onPanelSplit?: (splitPositionMm: number) => void;
  /** Callback to add a horizontal subdivision (row) to the given panel */
  onPaneRowAdd?: (panelIndex: number, splitPositionMm: number) => void;
  /** Callback to add a vertical subdivision (column) to the given panel */
  onPaneColAdd?: (panelIndex: number, splitPositionMm: number) => void;
  /** Placed custom arcs */
  customArcs?: PlacedArc[];
  /** Callback when an arc is placed */
  onArcPlaced?: (arc: PlacedArc) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  shape,
  width,
  height,
  unit,
  panels,
  panelWidths,
  frameColor,
  glassType,
  customGlassTint,
  openingPanels,
  openingDirections,
  isSliding,
  panelDivisions,
  panelDivisionHeights,
  panelDivisionWidths,
  openingPanes,
  svgStyle,
  onWidthChange,
  onHeightChange,
  onShapeConfigChange,
  onPanelWidthChange,
  onRowHeightChange,
  activeTool,
  lineOrientation = 'horizontal',
  lineTarget = 'panel',
  onHandlePlaced,
  onPanelSplit,
  onPaneRowAdd,
  onPaneColAdd,
  customArcs,
  onArcPlaced,
}) => {
  // Unique prefix for SVG defs IDs -- prevents collision when multiple ShapeCanvas
  // instances are rendered simultaneously (e.g., template grid cards).
  const uid = useId().replace(/:/g, '');
  const arrowLId = `sc-arrowL-${uid}`;
  const arrowRId = `sc-arrowR-${uid}`;
  const clipId = `sc-shape-clip-${uid}`;

  // --- Inline dimension editing state ---
  const [editingDim, setEditingDim] = useState<{
    key: string;
    x: number;
    y: number;
    value: number;
    angle: number;
    onCommit: (val: number) => void;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Tool interaction state ---
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /** Convert mouse event coords to SVG viewBox coords */
  const getSVGPoint = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  // Select all text when the input appears
  useEffect(() => {
    if (editingDim && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingDim]);

  function commitEdit() {
    if (!editingDim) return;
    const num = parseFloat(editValue);
    if (!isNaN(num) && num > 0) {
      editingDim.onCommit(num);
    }
    setEditingDim(null);
  }

  // Drawing area — height is fixed; width stretches to reflect the real-world
  // aspect ratio when the product width exceeds 1000 units.
  const baseSize = 180;
  const drawH = baseSize;
  const drawW = width > 1000 && height > 0
    ? Math.round(baseSize * (width / height))
    : baseSize;

  const totalW = drawW + 2 * MARGIN;
  const totalH = drawH + 2 * MARGIN + BOTTOM_LABEL_SPACE;

  // Compute vertices
  const realVerts = getRealVertices(shape, width, height);
  const svgVerts = scaleVertices(realVerts, width, height, drawW, drawH);

  // Shape outline path
  const shapePath = getShapePath(shape, svgVerts, drawW, drawH, width, height);

  // Glass color
  const glassColor = getGlassColor(glassType, frameColor, customGlassTint);

  // Row height helpers -- compute fractional Y positions per panel using panelDivisionHeights
  function getRowTopFrac(panelIndex: number, r: number, horizontalCount: number): number {
    const divH = panelDivisionHeights?.find((h) => h.panelIndex === panelIndex);
    if (!divH?.rowHeights) return r / horizontalCount;
    const totalH = divH.rowHeights.reduce((a, b) => a + b, 0);
    if (totalH <= 0) return r / horizontalCount;
    let sum = 0;
    for (let i = 0; i < r; i++) sum += divH.rowHeights[i];
    return sum / totalH;
  }
  function getRowBottomFrac(panelIndex: number, r: number, horizontalCount: number): number {
    const divH = panelDivisionHeights?.find((h) => h.panelIndex === panelIndex);
    if (!divH?.rowHeights) return (r + 1) / horizontalCount;
    const totalH = divH.rowHeights.reduce((a, b) => a + b, 0);
    if (totalH <= 0) return (r + 1) / horizontalCount;
    let sum = 0;
    for (let i = 0; i <= r; i++) sum += divH.rowHeights[i];
    return sum / totalH;
  }
  function getRowRealHeight(panelIndex: number, r: number, horizontalCount: number): number {
    const divH = panelDivisionHeights?.find((h) => h.panelIndex === panelIndex);
    if (divH?.rowHeights?.[r] != null) return Math.round(divH.rowHeights[r]);
    return Math.round(height / horizontalCount);
  }

  // Column width helpers -- compute fractional X positions per panel using panelDivisionWidths
  function getColLeftFrac(panelIndex: number, c: number, verticalCount: number): number {
    const divW = panelDivisionWidths?.find((w) => w.panelIndex === panelIndex);
    if (!divW?.colWidths) return c / verticalCount;
    const totalW = divW.colWidths.reduce((a, b) => a + b, 0);
    if (totalW <= 0) return c / verticalCount;
    let sum = 0;
    for (let i = 0; i < c; i++) sum += divW.colWidths[i];
    return sum / totalW;
  }
  function getColRightFrac(panelIndex: number, c: number, verticalCount: number): number {
    const divW = panelDivisionWidths?.find((w) => w.panelIndex === panelIndex);
    if (!divW?.colWidths) return (c + 1) / verticalCount;
    const totalW = divW.colWidths.reduce((a, b) => a + b, 0);
    if (totalW <= 0) return (c + 1) / verticalCount;
    let sum = 0;
    for (let i = 0; i <= c; i++) sum += divW.colWidths[i];
    return sum / totalW;
  }
  function getColRealWidth(panelIndex: number, c: number, verticalCount: number): number {
    const divW = panelDivisionWidths?.find((w) => w.panelIndex === panelIndex);
    if (divW?.colWidths?.[c] != null) return Math.round(divW.colWidths[c]);
    return Math.round(panelWidths[panelIndex] / verticalCount);
  }

  // Panel dividers
  const dividers = getPanelDividers(
    shape, panels, panelWidths, svgVerts,
    drawW, drawH, width, height,
  );

  // Shape center (for outward-normal computation)
  const svgCenterX = svgVerts.reduce((s, v) => s + v.x, 0) / svgVerts.length;
  const svgCenterY = svgVerts.reduce((s, v) => s + v.y, 0) / svgVerts.length;

  // Edges for dimension lines (skip bottom edge)
  const maxRealY = Math.max(...realVerts.map((v) => v.y));
  const edges: Array<{
    sv1: Point;
    sv2: Point;
    rv1: Point;
    rv2: Point;
    realLen: number;
  }> = [];

  for (let i = 0; i < svgVerts.length; i++) {
    const j = (i + 1) % svgVerts.length;
    const rv1 = realVerts[i];
    const rv2 = realVerts[j];
    if (isBottomEdge(rv1, rv2, maxRealY)) continue;
    edges.push({
      sv1: svgVerts[i],
      sv2: svgVerts[j],
      rv1,
      rv2,
      realLen: realEdgeLength(rv1, rv2),
    });
  }

  // ---------------------------------------------------------------------------
  // Edge-to-commit-function mapper: determines the correct editing callback
  // for a given edge based on the shape type and the edge's real-world vertices.
  // For simple shapes (rectangle), horizontal => width, vertical => height.
  // For complex shapes (l-shape, trapezoid), edges may control cutoutWidth,
  // cutoutHeight, topWidth, or partial dimensions.
  // Returns null if the edge is not directly editable (e.g. diagonals).
  // ---------------------------------------------------------------------------
  function getEdgeCommitFn(rv1: Point, rv2: Point): ((newLen: number) => void) | null {
    const len = Math.round(realEdgeLength(rv1, rv2));
    const isHoriz = Math.abs(rv1.y - rv2.y) < 0.5;
    const isVert = Math.abs(rv1.x - rv2.x) < 0.5;

    switch (shape.type) {
      case 'rectangle':
        if (isHoriz && onWidthChange) return onWidthChange;
        if (isVert && onHeightChange) return onHeightChange;
        return null;

      case 'l-shape': {
        const cutW = shape.cutoutWidth ?? width * 0.4;
        const cutH = shape.cutoutHeight ?? height * 0.4;

        // Full height edge (length === h)
        if (isVert && Math.abs(len - height) < 1 && onHeightChange) return onHeightChange;
        // Full width edge (length === w)
        if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;

        // cutoutHeight edge (length === cutH)
        if (isVert && Math.abs(len - Math.round(cutH)) < 1 && onShapeConfigChange) {
          return (v) => onShapeConfigChange({ cutoutHeight: v });
        }
        // cutoutWidth edge (length === cutW)
        if (isHoriz && Math.abs(len - Math.round(cutW)) < 1 && onShapeConfigChange) {
          return (v) => onShapeConfigChange({ cutoutWidth: v });
        }
        // Partial height edge (length === h - cutH)
        if (isVert && Math.abs(len - Math.round(height - cutH)) < 1 && onShapeConfigChange) {
          return (v) => onShapeConfigChange({ cutoutHeight: height - v });
        }
        // Partial width edge (length === w - cutW)
        if (isHoriz && Math.abs(len - Math.round(width - cutW)) < 1 && onShapeConfigChange) {
          return (v) => onShapeConfigChange({ cutoutWidth: width - v });
        }
        return null;
      }

      case 'trapezoid': {
        const topW = shape.topWidth ?? width * 0.6;
        // Top edge = topWidth
        if (isHoriz && Math.abs(len - Math.round(topW)) < 1 && onShapeConfigChange) {
          return (v) => onShapeConfigChange({ topWidth: v });
        }
        // Bottom edge = full width
        if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;
        // Diagonal edges -- too complex (function of topWidth + height), skip
        return null;
      }

      case 'arch':
        // Arch dimensions are handled separately in Layer 5b
        if (isHoriz && onWidthChange) return onWidthChange;
        if (isVert && onHeightChange) return onHeightChange;
        return null;

      case 'triangle':
        // Bottom edge = full width
        if (isHoriz && Math.abs(len - width) < 1 && onWidthChange) return onWidthChange;
        // Diagonal edges are complex -- skip
        return null;

      case 'pentagon':
      case 'hexagon':
        // Edges are proportional to w/h -- too complex for simple inline editing, skip
        return null;

      default:
        if (isHoriz && onWidthChange) return onWidthChange;
        if (isVert && onHeightChange) return onHeightChange;
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Tool interaction helpers
  // ---------------------------------------------------------------------------

  /** Find which panel (and optionally pane) the hover position falls within */
  function findPanelAtPoint(px: number, py: number): {
    panelIndex: number;
    panelCx: number;
    panelCy: number;
    panelW: number;
    panelH: number;
    paneInfo?: { rowIndex: number; colIndex: number; paneCx: number; paneCy: number; paneW: number; paneH: number };
  } | null {
    const total = panelWidths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < panels; i++) {
      const { cx, cy, w: pw, h: ph } = getPanelCenter(
        shape, i, panels, panelWidths, svgVerts,
        drawW, drawH, width, height,
      );
      const panelLeft = cx - pw / 2;
      const panelRight = cx + pw / 2;
      const panelTop = cy - ph / 2;
      const panelBottom = cy + ph / 2;

      if (px >= panelLeft && px <= panelRight && py >= panelTop && py <= panelBottom) {
        // Check if within a subdivided pane
        const div = panelDivisions?.find((d) => d.panelIndex === i);
        if (div && (div.horizontalCount > 1 || div.verticalCount > 1)) {
          for (let r = 0; r < div.horizontalCount; r++) {
            const rowTopFrac = getRowTopFrac(i, r, div.horizontalCount);
            const rowBottomFrac = getRowBottomFrac(i, r, div.horizontalCount);
            const paneTop = panelTop + rowTopFrac * ph;
            const paneBottom = panelTop + rowBottomFrac * ph;
            const paneH = paneBottom - paneTop;
            for (let c = 0; c < div.verticalCount; c++) {
              const colLeftFrac = getColLeftFrac(i, c, div.verticalCount);
              const colRightFrac = getColRightFrac(i, c, div.verticalCount);
              const paneLeft = panelLeft + colLeftFrac * pw;
              const paneRight = panelLeft + colRightFrac * pw;
              const paneW = paneRight - paneLeft;
              if (px >= paneLeft && px <= paneRight && py >= paneTop && py <= paneBottom) {
                return {
                  panelIndex: i,
                  panelCx: cx, panelCy: cy, panelW: pw, panelH: ph,
                  paneInfo: {
                    rowIndex: r,
                    colIndex: c,
                    paneCx: paneLeft + paneW / 2,
                    paneCy: paneTop + paneH / 2,
                    paneW,
                    paneH,
                  },
                };
              }
            }
          }
        }
        return { panelIndex: i, panelCx: cx, panelCy: cy, panelW: pw, panelH: ph };
      }
    }
    return null;
  }

  /** Determine opening direction from mouse position within a bounding box */
  function getDirectionFromPosition(
    px: number, py: number,
    left: number, top: number, w: number, h: number,
  ): 'left' | 'right' | 'top' | 'bottom' {
    const relX = (px - left) / w;
    const relY = (py - top) / h;
    const distFromCenterX = Math.abs(relX - 0.5);
    const distFromCenterY = Math.abs(relY - 0.5);
    if (distFromCenterX > distFromCenterY) {
      return relX > 0.5 ? 'right' : 'left';
    }
    return relY > 0.5 ? 'bottom' : 'top';
  }

  /** Compute preview line coordinates for the line tool.
   *  Panel mode: vertical line spanning the full frame height at the snapped X.
   *  Pane mode: line within the hovered panel bounds. */
  function computeLinePreview(hx: number, hy: number): {
    x1: number; y1: number; x2: number; y2: number;
    realX: number; panelIndex: number;
    leftDim?: number; rightDim?: number;  // real-world dimensions of resulting split parts
    topDim?: number; bottomDim?: number;
  } | null {
    const { realX } = svgToReal(hx, hy, MARGIN, drawW, drawH, width, height);

    if (lineTarget === 'panel') {
      // Panel mode: vertical only, full frame height
      const snappedRealX = snapToGrid(realX);
      const { svgX: snappedSvgX } = realToSvg(snappedRealX, 0, MARGIN, drawW, drawH, width, height);
      const frameLeft = MARGIN;
      const frameRight = MARGIN + drawW;
      const frameTop = MARGIN;
      const frameBottom = MARGIN + drawH;
      const clampedX = Math.max(frameLeft + 1, Math.min(frameRight - 1, snappedSvgX));
      const { realX: clampedRealX } = svgToReal(clampedX, frameTop, MARGIN, drawW, drawH, width, height);

      // Compute what the split dimensions would be
      let leftDim = 0, rightDim = 0;
      const total = panelWidths.reduce((a, b) => a + b, 0);
      let accumulated = 0;
      for (let i = 0; i < panelWidths.length; i++) {
        if (accumulated + panelWidths[i] >= clampedRealX) {
          leftDim = Math.round(clampedRealX - accumulated);
          rightDim = Math.round(panelWidths[i] - leftDim);
          break;
        }
        accumulated += panelWidths[i];
      }

      return {
        x1: clampedX, y1: frameTop,
        x2: clampedX, y2: frameBottom,
        realX: clampedRealX,
        panelIndex: -1,
        leftDim, rightDim,
      };
    }

    // Pane mode: line within the hovered panel
    const hit = findPanelAtPoint(hx, hy);
    if (!hit) return null;

    const { panelCx: cx, panelCy: cy, panelW: pw, panelH: ph } = hit;
    const panelLeft = cx - pw / 2;
    const panelRight = cx + pw / 2;
    const panelTop = cy - ph / 2;
    const panelBottom = cy + ph / 2;
    const { realX: realX2, realY } = svgToReal(hx, hy, MARGIN, drawW, drawH, width, height);

    if (lineOrientation === 'horizontal') {
      const snappedRealY = snapToGrid(realY);
      const { svgY: snappedSvgY } = realToSvg(0, snappedRealY, MARGIN, drawW, drawH, width, height);
      const clampedY = Math.max(panelTop + 1, Math.min(panelBottom - 1, snappedSvgY));
      const { realY: clampedRealY } = svgToReal(panelLeft, clampedY, MARGIN, drawW, drawH, width, height);
      const { realY: panelTopReal } = svgToReal(panelLeft, panelTop, MARGIN, drawW, drawH, width, height);
      const { realY: panelBottomReal } = svgToReal(panelLeft, panelBottom, MARGIN, drawW, drawH, width, height);
      return {
        x1: panelLeft, y1: clampedY,
        x2: panelRight, y2: clampedY,
        realX: realX2,
        panelIndex: hit.panelIndex,
        topDim: Math.round(clampedRealY - panelTopReal),
        bottomDim: Math.round(panelBottomReal - clampedRealY),
      };
    } else {
      const snappedRealX = snapToGrid(realX2);
      const { svgX: snappedSvgX } = realToSvg(snappedRealX, 0, MARGIN, drawW, drawH, width, height);
      const clampedX = Math.max(panelLeft + 1, Math.min(panelRight - 1, snappedSvgX));
      const { realX: clampedRealX } = svgToReal(clampedX, panelTop, MARGIN, drawW, drawH, width, height);
      const { realX: panelLeftReal } = svgToReal(panelLeft, panelTop, MARGIN, drawW, drawH, width, height);
      const { realX: panelRightReal } = svgToReal(panelRight, panelTop, MARGIN, drawW, drawH, width, height);
      return {
        x1: clampedX, y1: panelTop,
        x2: clampedX, y2: panelBottom,
        realX: snappedRealX,
        panelIndex: hit.panelIndex,
        leftDim: Math.round(clampedRealX - panelLeftReal),
        rightDim: Math.round(panelRightReal - clampedRealX),
      };
    }
  }

  /** Compute preview arc for the arc tool */
  function computeArcPlacement(hx: number, hy: number): PlacedArc | null {
    const hit = findPanelAtPoint(hx, hy);
    if (!hit) return null;

    const { panelCx: cx, panelCy: cy, panelW: pw, panelH: ph } = hit;
    const panelLeft = cx - pw / 2;
    const panelRight = cx + pw / 2;
    const panelBottom = cy + ph / 2;

    // Arc spans panel width, sits at bottom of panel
    const arcCx = cx;
    const arcCy = panelBottom;
    const arcRx = pw / 2;
    const arcRy = ph / 2;

    const { realX: realCx, realY: realCy } = svgToReal(arcCx, arcCy, MARGIN, drawW, drawH, width, height);
    const realRx = (pw / drawW) * width / 2;
    const realRy = (ph / drawH) * height / 2;

    return {
      id: generateId(),
      cx: arcCx, cy: arcCy,
      rx: arcRx, ry: arcRy,
      startAngle: 180,
      endAngle: 0,
      realCx, realCy,
      realRx, realRy,
    };
  }

  /** Handle click when a tool is active */
  function handleToolClick(_e: React.MouseEvent) {
    if (!hoverPos) return;

    if (activeTool === 'handle' && onHandlePlaced) {
      const hit = findPanelAtPoint(hoverPos.x, hoverPos.y);
      if (!hit) return;
      if (hit.paneInfo) {
        const { paneInfo } = hit;
        const dir = getDirectionFromPosition(
          hoverPos.x, hoverPos.y,
          paneInfo.paneCx - paneInfo.paneW / 2,
          paneInfo.paneCy - paneInfo.paneH / 2,
          paneInfo.paneW, paneInfo.paneH,
        );
        onHandlePlaced(hit.panelIndex, dir, { rowIndex: paneInfo.rowIndex, colIndex: paneInfo.colIndex });
      } else {
        const dir = getDirectionFromPosition(
          hoverPos.x, hoverPos.y,
          hit.panelCx - hit.panelW / 2,
          hit.panelCy - hit.panelH / 2,
          hit.panelW, hit.panelH,
        );
        onHandlePlaced(hit.panelIndex, dir);
      }
    }

    if (activeTool === 'line') {
      const preview = computeLinePreview(hoverPos.x, hoverPos.y);
      if (!preview) return;

      if (lineTarget === 'panel' && onPanelSplit) {
        onPanelSplit(preview.realX);
      } else if (lineTarget === 'pane' && preview.panelIndex >= 0) {
        if (lineOrientation === 'horizontal' && onPaneRowAdd && preview.topDim != null) {
          onPaneRowAdd(preview.panelIndex, preview.topDim);
        } else if (lineOrientation === 'vertical' && onPaneColAdd && preview.leftDim != null) {
          onPaneColAdd(preview.panelIndex, preview.leftDim);
        }
      }
    }

    if (activeTool === 'arc' && onArcPlaced) {
      const arc = computeArcPlacement(hoverPos.x, hoverPos.y);
      if (arc) onArcPlaced(arc);
    }
  }

  /** Render the faded preview for the active tool */
  function renderToolPreview(): React.ReactNode {
    if (!hoverPos) return null;

    if (activeTool === 'handle') {
      const hit = findPanelAtPoint(hoverPos.x, hoverPos.y);
      if (!hit) return null;
      if (hit.paneInfo) {
        const { paneInfo } = hit;
        const dir = getDirectionFromPosition(
          hoverPos.x, hoverPos.y,
          paneInfo.paneCx - paneInfo.paneW / 2,
          paneInfo.paneCy - paneInfo.paneH / 2,
          paneInfo.paneW, paneInfo.paneH,
        );
        return getOpeningIndicator(
          dir, isSliding,
          paneInfo.paneCx, paneInfo.paneCy,
          paneInfo.paneW, paneInfo.paneH,
          'preview-handle',
        );
      }
      const dir = getDirectionFromPosition(
        hoverPos.x, hoverPos.y,
        hit.panelCx - hit.panelW / 2,
        hit.panelCy - hit.panelH / 2,
        hit.panelW, hit.panelH,
      );
      return getOpeningIndicator(
        dir, isSliding,
        hit.panelCx, hit.panelCy,
        hit.panelW, hit.panelH,
        'preview-handle',
      );
    }

    if (activeTool === 'line') {
      const preview = computeLinePreview(hoverPos.x, hoverPos.y);
      if (!preview) return null;
      const isVert = Math.abs(preview.x1 - preview.x2) < 1;
      return (
        <g>
          <line
            x1={preview.x1} y1={preview.y1}
            x2={preview.x2} y2={preview.y2}
            stroke={frameColor}
            strokeWidth={1}
            strokeDasharray="3,2"
          />
          {/* Dimension labels for resulting split — pink labels at center of each part */}
          {isVert && preview.leftDim != null && preview.rightDim != null && (() => {
            const midY = (preview.y1 + preview.y2) / 2;
            const leftEdge = preview.x1 - (preview.leftDim / width) * drawW;
            const rightEdge = preview.x1 + (preview.rightDim / width) * drawW;
            return (
              <>
                <text x={(leftEdge + preview.x1) / 2} y={midY}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#e040a0" fontWeight={700}>
                  {preview.leftDim}
                </text>
                <text x={(preview.x1 + rightEdge) / 2} y={midY}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#e040a0" fontWeight={700}>
                  {preview.rightDim}
                </text>
              </>
            );
          })()}
          {!isVert && preview.topDim != null && preview.bottomDim != null && (() => {
            const midX = (preview.x1 + preview.x2) / 2;
            const topEdge = preview.y1 - (preview.topDim / height) * drawH;
            const bottomEdge = preview.y1 + (preview.bottomDim / height) * drawH;
            return (
              <>
                <text x={midX} y={(topEdge + preview.y1) / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#e040a0" fontWeight={700}>
                  {preview.topDim}
                </text>
                <text x={midX} y={(preview.y1 + bottomEdge) / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#e040a0" fontWeight={700}>
                  {preview.bottomDim}
                </text>
              </>
            );
          })()}
        </g>
      );
    }

    if (activeTool === 'arc') {
      const arc = computeArcPlacement(hoverPos.x, hoverPos.y);
      if (!arc) return null;
      return (
        <path
          d={`M ${arc.cx - arc.rx} ${arc.cy} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.cx + arc.rx} ${arc.cy}`}
          fill="none"
          stroke={frameColor}
          strokeWidth={1}
          strokeDasharray="3,2"
        />
      );
    }

    return null;
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{
        ...(svgStyle ?? { width: '100%', height: '88vh' }),
        cursor: activeTool ? 'crosshair' : undefined,
      }}
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={(e) => {
        if (!activeTool) return;
        const pt = getSVGPoint(e);
        if (pt) setHoverPos(pt);
      }}
      onMouseLeave={() => setHoverPos(null)}
      onClick={(e) => {
        if (!activeTool || !hoverPos) return;
        handleToolClick(e);
      }}
    >
      {/* Defs: arrow markers for dimension lines */}
      <defs>
        <marker
          id={arrowLId}
          markerWidth={MARKER_SIZE}
          markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE}
          refY={MARKER_SIZE / 2}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d={`M${MARKER_SIZE},0 L0,${MARKER_SIZE / 2} L${MARKER_SIZE},${MARKER_SIZE}`}
            fill={DIM_COLOR}
          />
        </marker>
        <marker
          id={arrowRId}
          markerWidth={MARKER_SIZE}
          markerHeight={MARKER_SIZE}
          refX="0"
          refY={MARKER_SIZE / 2}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE}`}
            fill={DIM_COLOR}
          />
        </marker>
        {/* Clip path matching shape outline -- used to contain opening indicators */}
        <clipPath id={clipId}>
          <path d={shapePath} />
        </clipPath>
      </defs>

      {/* --- Layer 1: Glass fill per panel --- */}
      {Array.from({ length: panels }).map((_, i) => {
        const pts = getPanelPolygonPoints(
          shape, i, panels, panelWidths, svgVerts,
          drawW, drawH, width, height,
        );
        if (!pts) return null;
        const isOpening = openingPanels.includes(i);
        const fillColor = isOpening ? '#44D5B880' : glassColor;
        return (
          <polygon
            key={`glass-${i}`}
            points={pts}
            fill={fillColor}
            stroke="none"
          />
        );
      })}

      {/* --- Layer 1b: Pane-level glass fill for opening panes --- */}
      {openingPanes && openingPanes.length > 0 && panelDivisions && openingPanes.map((pane, pIdx) => {
        const div = panelDivisions.find((d) => d.panelIndex === pane.panelIndex);
        if (!div || (div.horizontalCount <= 1 && div.verticalCount <= 1)) return null;

        const { cx, cy, w: pw, h: ph } = getPanelCenter(
          shape, pane.panelIndex, panels, panelWidths, svgVerts,
          drawW, drawH, width, height,
        );
        const panelLeft = cx - pw / 2;
        const panelTop = cy - ph / 2;
        const colLeftFrac = getColLeftFrac(pane.panelIndex, pane.colIndex, div.verticalCount);
        const colRightFrac = getColRightFrac(pane.panelIndex, pane.colIndex, div.verticalCount);
        const paneX = panelLeft + colLeftFrac * pw;
        const paneW = (colRightFrac - colLeftFrac) * pw;
        const rowTopFrac = getRowTopFrac(pane.panelIndex, pane.rowIndex, div.horizontalCount);
        const rowBottomFrac = getRowBottomFrac(pane.panelIndex, pane.rowIndex, div.horizontalCount);
        const paneY = panelTop + rowTopFrac * ph;
        const paneH = (rowBottomFrac - rowTopFrac) * ph;

        return (
          <rect
            key={`pane-glass-${pIdx}`}
            x={paneX}
            y={paneY}
            width={paneW}
            height={paneH}
            fill="#44D5B880"
            stroke="none"
          />
        );
      })}

      {/* --- Layer 2: Panel divider lines --- */}
      {dividers.map((d, i) => (
        <line
          key={`div-${i}`}
          x1={d.x}
          y1={d.topY}
          x2={d.x}
          y2={d.bottomY}
          stroke={frameColor}
          strokeWidth={DIVIDER_STROKE}
        />
      ))}

      {/* --- Layer 2b: Pane subdivision lines (double thin lines within each panel) --- */}
      {panelDivisions && panelDivisions.map((div) => {
        const { panelIndex, horizontalCount, verticalCount } = div;
        if (horizontalCount <= 1 && verticalCount <= 1) return null;

        // Get this panel's bounding region
        const total = panelWidths.reduce((a, b) => a + b, 0);
        let leftFrac = 0;
        for (let i = 0; i < panelIndex; i++) {
          leftFrac += (panelWidths[i] ?? 0) / total;
        }
        const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
        const panelLeft = MARGIN + leftFrac * drawW;
        const panelRight = MARGIN + rightFrac * drawW;
        const panelW = panelRight - panelLeft;

        // Find top and bottom Y at this panel's x range by sampling the center x
        const panelCenterX = (panelLeft + panelRight) / 2;
        const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
        const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
        const panelH = panelBottomY - panelTopY;

        const gap = 1; // gap between double lines
        const lines: React.ReactNode[] = [];

        // Horizontal subdivision lines (rows)
        for (let r = 1; r < horizontalCount; r++) {
          const frac = getRowTopFrac(panelIndex, r, horizontalCount);
          const y = panelTopY + frac * panelH;
          // Find actual left and right x at this y by intersecting with shape edges
          const lx = getLeftXAtY(y, svgVerts, shape, drawW, drawH, width, height);
          const rx = getRightXAtY(y, svgVerts, shape, drawW, drawH, width, height);
          const clippedLeft = Math.max(panelLeft, lx);
          const clippedRight = Math.min(panelRight, rx);
          lines.push(
            <line key={`pane-h-${panelIndex}-${r}-a`}
              x1={clippedLeft} y1={y - gap / 2} x2={clippedRight} y2={y - gap / 2}
              stroke={frameColor} strokeWidth={0.8} />,
            <line key={`pane-h-${panelIndex}-${r}-b`}
              x1={clippedLeft} y1={y + gap / 2} x2={clippedRight} y2={y + gap / 2}
              stroke={frameColor} strokeWidth={0.8} />,
          );
        }

        // Vertical subdivision lines (columns)
        for (let c = 1; c < verticalCount; c++) {
          const frac = getColLeftFrac(panelIndex, c, verticalCount);
          const x = panelLeft + frac * panelW;
          // Find top and bottom y at this x
          const topY = getTopYAtX(x, svgVerts, shape, drawW, drawH, width, height);
          const botY = getBottomYAtX(x, svgVerts);
          lines.push(
            <line key={`pane-v-${panelIndex}-${c}-a`}
              x1={x - gap / 2} y1={topY} x2={x - gap / 2} y2={botY}
              stroke={frameColor} strokeWidth={0.8} />,
            <line key={`pane-v-${panelIndex}-${c}-b`}
              x1={x + gap / 2} y1={topY} x2={x + gap / 2} y2={botY}
              stroke={frameColor} strokeWidth={0.8} />,
          );
        }

        return <g key={`panes-${panelIndex}`}>{lines}</g>;
      })}

      {/* --- Layer 3: Frame border --- */}
      <path
        d={shapePath}
        fill="none"
        stroke={frameColor}
        strokeWidth={FRAME_STROKE}
        strokeLinejoin="miter"
      />

      {/* --- Layer 4: Opening indicators (clipped to shape outline) --- */}
      <g clipPath={`url(#${clipId})`}>
        {openingPanels.map((panelIdx) => {
          const dir = openingDirections[panelIdx];
          if (!dir) return null;
          const { cx, cy, w: pw, h: ph } = getPanelCenter(
            shape, panelIdx, panels, panelWidths, svgVerts,
            drawW, drawH, width, height,
          );
          return getOpeningIndicator(dir, isSliding, cx, cy, pw, ph, `opening-${panelIdx}`);
        })}

        {/* --- Layer 4b: Pane-level opening indicators --- */}
        {openingPanes && panelDivisions && openingPanes.map((pane, pIdx) => {
          if (!pane.openingDirection) return null;
          const div = panelDivisions.find((d) => d.panelIndex === pane.panelIndex);
          if (!div || (div.horizontalCount <= 1 && div.verticalCount <= 1)) return null;

          const { cx, cy, w: pw, h: ph } = getPanelCenter(
            shape, pane.panelIndex, panels, panelWidths, svgVerts,
            drawW, drawH, width, height,
          );
          const panelLeft = cx - pw / 2;
          const panelTop = cy - ph / 2;
          const colLeftFrac = getColLeftFrac(pane.panelIndex, pane.colIndex, div.verticalCount);
          const colRightFrac = getColRightFrac(pane.panelIndex, pane.colIndex, div.verticalCount);
          const paneW = (colRightFrac - colLeftFrac) * pw;
          const rowTopFrac = getRowTopFrac(pane.panelIndex, pane.rowIndex, div.horizontalCount);
          const rowBottomFrac = getRowBottomFrac(pane.panelIndex, pane.rowIndex, div.horizontalCount);
          const paneH = (rowBottomFrac - rowTopFrac) * ph;
          const paneCx = panelLeft + colLeftFrac * pw + paneW / 2;
          const paneCy = panelTop + rowTopFrac * ph + paneH / 2;
          const paneIsSliding = pane.openingType === 'sliding';

          return getOpeningIndicator(
            pane.openingDirection, paneIsSliding,
            paneCx, paneCy, paneW, paneH,
            `pane-opening-${pIdx}`,
          );
        })}
      </g>

      {/* --- Layer 5: Dimension lines for each non-bottom edge --- */}
      {(() => {
        // Pre-compute all label positions, then stagger any that overlap
        const dimData = edges.map((edge, i) => {
          const { nx, ny } = getOutwardNormal(
            edge.sv1.x, edge.sv1.y,
            edge.sv2.x, edge.sv2.y,
            svgCenterX, svgCenterY,
          );
          const commitFn = getEdgeCommitFn(edge.rv1, edge.rv2);
          return { edge, nx, ny, idx: i, commitFn };
        });

        // Check if two label positions are too close and stagger offsets
        const offsets = dimData.map(() => DIM_OFFSET);
        for (let a = 0; a < dimData.length; a++) {
          for (let b = a + 1; b < dimData.length; b++) {
            const da = dimData[a], db = dimData[b];
            const midAx = (da.edge.sv1.x + da.edge.sv2.x) / 2 + da.nx * offsets[a];
            const midAy = (da.edge.sv1.y + da.edge.sv2.y) / 2 + da.ny * offsets[a];
            const midBx = (db.edge.sv1.x + db.edge.sv2.x) / 2 + db.nx * offsets[b];
            const midBy = (db.edge.sv1.y + db.edge.sv2.y) / 2 + db.ny * offsets[b];
            const dist = Math.sqrt((midAx - midBx) ** 2 + (midAy - midBy) ** 2);
            if (dist < 28) {
              // Push the shorter edge further out
              if (da.edge.realLen <= db.edge.realLen) {
                offsets[a] = offsets[a] + 14;
              } else {
                offsets[b] = offsets[b] + 14;
              }
            }
          }
        }

        return dimData.map(({ edge, nx, ny, idx, commitFn }, i) => {
          const off = offsets[i];
          const lx1 = edge.sv1.x + nx * off;
          const ly1 = edge.sv1.y + ny * off;
          const lx2 = edge.sv2.x + nx * off;
          const ly2 = edge.sv2.y + ny * off;

          // Label midpoint along the dimension line
          const labelX = (lx1 + lx2) / 2 + nx * 8;
          const labelY = (ly1 + ly2) / 2 + ny * 8;

          const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
          const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

          return (
            <g key={`dim-${idx}`}>
              {/* Extension lines */}
              <line
                x1={edge.sv1.x} y1={edge.sv1.y}
                x2={lx1} y2={ly1}
                stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
              />
              <line
                x1={edge.sv2.x} y1={edge.sv2.y}
                x2={lx2} y2={ly2}
                stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
              />
              {/* Dimension line */}
              <line
                x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke={DIM_COLOR} strokeWidth={0.8}
                markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`}
              />
              {/* Label */}
              {editingDim?.key === `edge-${idx}` ? null : (
                <text
                  x={labelX} y={labelY}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={600}
                  transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
                  style={{ cursor: commitFn ? 'pointer' : undefined }}
                  onDoubleClick={(e) => {
                    if (!commitFn) return;
                    e.stopPropagation();
                    setEditingDim({
                      key: `edge-${idx}`,
                      x: labelX, y: labelY,
                      value: edge.realLen,
                      angle: readableAngle,
                      onCommit: commitFn,
                    });
                    setEditValue(String(edge.realLen));
                  }}
                >
                  {edge.realLen}
                </text>
              )}
            </g>
          );
        });
      })()}

      {/* --- Layer 5b: Arch dimensions (height + width at spring line) --- */}
      {shape.type === 'arch' && (() => {
        const isSemicircle = (shape.archType ?? 'semicircle') === 'semicircle';
        const archH = isSemicircle ? width / 2 : (shape.archHeight ?? height * 0.3);
        const archHPx = getArchRy(shape, drawW, drawH, height);
        const apexY = MARGIN; // top of arch
        const springY = MARGIN + archHPx; // where arch meets straight sides
        const centerX = MARGIN + drawW / 2;

        // --- Arch height: vertical dimension on the right side ---
        const hLineX = MARGIN + drawW + DIM_OFFSET;
        const hLabelX = hLineX + 8;
        const hMidY = (apexY + springY) / 2;

        // --- Arch width at spring line: horizontal dimension above the arch ---
        const wLineY = MARGIN - DIM_OFFSET;
        const wLabelY = wLineY - 8;
        const archLeft = MARGIN;
        const archRight = MARGIN + drawW;

        return (
          <g>
            {/* Arch height -- vertical dimension line on right */}
            <line x1={MARGIN + drawW} y1={apexY} x2={hLineX} y2={apexY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={MARGIN + drawW} y1={springY} x2={hLineX} y2={springY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={hLineX} y1={apexY} x2={hLineX} y2={springY}
              stroke={DIM_COLOR} strokeWidth={0.8}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            {editingDim?.key === 'arch-height' ? null : (
              <text x={hLabelX} y={hMidY}
                textAnchor="start" dominantBaseline="middle"
                fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={600}
                transform={`rotate(90, ${hLabelX}, ${hMidY})`}
                style={{ cursor: onHeightChange ? 'pointer' : undefined }}
                onDoubleClick={(e) => {
                  if (!onHeightChange) return;
                  e.stopPropagation();
                  setEditingDim({
                    key: 'arch-height',
                    x: hLabelX, y: hMidY,
                    value: Math.round(archH),
                    angle: 90,
                    onCommit: onHeightChange,
                  });
                  setEditValue(String(Math.round(archH)));
                }}>
                {Math.round(archH)}
              </text>
            )}

            {/* Arch width -- horizontal dimension line above */}
            <line x1={archLeft} y1={apexY} x2={archLeft} y2={wLineY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={archRight} y1={apexY} x2={archRight} y2={wLineY}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
            <line x1={archLeft} y1={wLineY} x2={archRight} y2={wLineY}
              stroke={DIM_COLOR} strokeWidth={0.8}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            {editingDim?.key === 'arch-width' ? null : (
              <text x={centerX} y={wLabelY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={600}
                style={{ cursor: onWidthChange ? 'pointer' : undefined }}
                onDoubleClick={(e) => {
                  if (!onWidthChange) return;
                  e.stopPropagation();
                  setEditingDim({
                    key: 'arch-width',
                    x: centerX, y: wLabelY,
                    value: width,
                    angle: 0,
                    onCommit: onWidthChange,
                  });
                  setEditValue(String(width));
                }}>
                {width}
              </text>
            )}
          </g>
        );
      })()}

      {/* --- Layer 6: Bottom edge dimension (same style as other edges) --- */}
      {(() => {
        // Find the bottom edge from real vertices
        const bottomRV1 = realVerts.find((_, i) => {
          const j = (i + 1) % realVerts.length;
          return isBottomEdge(realVerts[i], realVerts[j], maxRealY);
        });
        const bottomIdx = realVerts.indexOf(bottomRV1!);
        if (bottomIdx < 0) return null;

        const j = (bottomIdx + 1) % svgVerts.length;
        const sv1 = svgVerts[bottomIdx];
        const sv2 = svgVerts[j];
        const rv1 = realVerts[bottomIdx];
        const rv2 = realVerts[j];
        const len = realEdgeLength(rv1, rv2);
        const bottomCommitFn = getEdgeCommitFn(rv1, rv2);

        // Outward normal (pointing down for bottom edge)
        const { nx, ny } = getOutwardNormal(
          sv1.x, sv1.y, sv2.x, sv2.y,
          svgCenterX, svgCenterY,
        );

        const lx1 = sv1.x + nx * DIM_OFFSET;
        const ly1 = sv1.y + ny * DIM_OFFSET;
        const lx2 = sv2.x + nx * DIM_OFFSET;
        const ly2 = sv2.y + ny * DIM_OFFSET;

        const labelX = (lx1 + lx2) / 2 + nx * 8;
        const labelY = (ly1 + ly2) / 2 + ny * 8;

        const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
        const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

        return (
          <g>
            {/* Extension lines */}
            <line
              x1={sv1.x} y1={sv1.y}
              x2={lx1} y2={ly1}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
            />
            <line
              x1={sv2.x} y1={sv2.y}
              x2={lx2} y2={ly2}
              stroke={DIM_COLOR} strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4}
            />
            {/* Dimension line */}
            <line
              x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={DIM_COLOR} strokeWidth={0.8}
              markerStart={`url(#${arrowLId})`}
              markerEnd={`url(#${arrowRId})`}
            />
            {/* Label */}
            {editingDim?.key === 'bottom-edge' ? null : (
              <text
                x={labelX} y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={DIM_FONT}
                fill={DIM_COLOR}
                fontWeight={600}
                transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
                style={{ cursor: bottomCommitFn ? 'pointer' : undefined }}
                onDoubleClick={(e) => {
                  if (!bottomCommitFn) return;
                  e.stopPropagation();
                  setEditingDim({
                    key: 'bottom-edge',
                    x: labelX, y: labelY,
                    value: len,
                    angle: readableAngle,
                    onCommit: bottomCommitFn,
                  });
                  setEditValue(String(len));
                }}
              >
                {len}
              </text>
            )}
          </g>
        );
      })()}

      {/* --- Layer 7: Inner dimension lines (panel widths + pane subdivisions) --- */}
      {(() => {
        const INNER_DIM_COLOR = '#9CA3C3';
        const INNER_DIM_FONT = 6;
        const innerStrokeW = 0.5;

        const total = panelWidths.reduce((a, b) => a + b, 0);
        const elements: React.ReactNode[] = [];

        // --- 7a: Panel width dimensions (horizontal, below the frame, above outer dims) ---
        if (panels > 1) {
          const innerY = MARGIN + drawH + 7; // between frame bottom and outer dim line
          let accFrac = 0;
          for (let i = 0; i < panels; i++) {
            const frac = panelWidths[i] / total;
            const panelLeft = MARGIN + accFrac * drawW;
            const panelRight = MARGIN + (accFrac + frac) * drawW;
            const midX = (panelLeft + panelRight) / 2;

            // Extension lines (short vertical ticks)
            elements.push(
              <line key={`inner-pw-ext-l-${i}`}
                x1={panelLeft} y1={innerY - 3} x2={panelLeft} y2={innerY + 3}
                stroke={INNER_DIM_COLOR} strokeWidth={0.4} opacity={0.6} />,
              <line key={`inner-pw-ext-r-${i}`}
                x1={panelRight} y1={innerY - 3} x2={panelRight} y2={innerY + 3}
                stroke={INNER_DIM_COLOR} strokeWidth={0.4} opacity={0.6} />,
            );
            // Dimension line
            elements.push(
              <line key={`inner-pw-line-${i}`}
                x1={panelLeft} y1={innerY} x2={panelRight} y2={innerY}
                stroke={INNER_DIM_COLOR} strokeWidth={innerStrokeW}
                markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />,
            );
            // Label (below the line)
            if (editingDim?.key !== `pw-${i}`) {
              const panelIdx = i;
              elements.push(
                <text key={`inner-pw-label-${i}`}
                  x={midX} y={innerY + 6}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={INNER_DIM_FONT} fill={INNER_DIM_COLOR} fontWeight={500}
                  style={{ cursor: onPanelWidthChange ? 'pointer' : undefined }}
                  onDoubleClick={(e) => {
                    if (!onPanelWidthChange) return;
                    e.stopPropagation();
                    setEditingDim({
                      key: `pw-${panelIdx}`,
                      x: midX, y: innerY + 6,
                      value: Math.round(panelWidths[panelIdx]),
                      angle: 0,
                      onCommit: (v) => onPanelWidthChange(panelIdx, v),
                    });
                    setEditValue(String(Math.round(panelWidths[panelIdx])));
                  }}>
                  {Math.round(panelWidths[i])}
                </text>,
              );
            }

            accFrac += frac;
          }
        }

        // --- 7b: Pane dimensions within subdivided panels ---
        if (panelDivisions) {
          for (const div of panelDivisions) {
            const { panelIndex, horizontalCount, verticalCount } = div;
            if (horizontalCount <= 1 && verticalCount <= 1) continue;

            // Compute panel bounds (same logic as Layer 2b)
            let leftFrac = 0;
            for (let i = 0; i < panelIndex; i++) {
              leftFrac += (panelWidths[i] ?? 0) / total;
            }
            const rightFrac = leftFrac + (panelWidths[panelIndex] ?? 0) / total;
            const panelLeft = MARGIN + leftFrac * drawW;
            const panelRight = MARGIN + rightFrac * drawW;
            const panelCenterX = (panelLeft + panelRight) / 2;
            const panelTopY = getTopYAtX(panelCenterX, svgVerts, shape, drawW, drawH, width, height);
            const panelBottomY = getBottomYAtX(panelCenterX, svgVerts);
            const panelH = panelBottomY - panelTopY;
            const panelW = panelRight - panelLeft;

            const panelRealWidth = panelWidths[panelIndex];

            // Pane column widths (below frame, between panel dims and outer dims)
            if (verticalCount > 1) {
              // Position below panel width dims (if panels > 1) or just below frame
              const dimY = MARGIN + drawH + (panels > 1 ? 16 : 7);

              for (let c = 0; c < verticalCount; c++) {
                const colLeftFrac = getColLeftFrac(panelIndex, c, verticalCount);
                const colRightFrac = getColRightFrac(panelIndex, c, verticalCount);
                const colLeft = panelLeft + colLeftFrac * panelW;
                const colRight = panelLeft + colRightFrac * panelW;
                const colMidX = (colLeft + colRight) / 2;
                const colRealWidth = getColRealWidth(panelIndex, c, verticalCount);

                // Extension ticks
                elements.push(
                  <line key={`inner-col-ext-l-${panelIndex}-${c}`}
                    x1={colLeft} y1={dimY - 2} x2={colLeft} y2={dimY + 2}
                    stroke={INNER_DIM_COLOR} strokeWidth={0.3} opacity={0.5} />,
                  <line key={`inner-col-ext-r-${panelIndex}-${c}`}
                    x1={colRight} y1={dimY - 2} x2={colRight} y2={dimY + 2}
                    stroke={INNER_DIM_COLOR} strokeWidth={0.3} opacity={0.5} />,
                );
                // Dimension line
                elements.push(
                  <line key={`inner-col-line-${panelIndex}-${c}`}
                    x1={colLeft} y1={dimY} x2={colRight} y2={dimY}
                    stroke={INNER_DIM_COLOR} strokeWidth={innerStrokeW}
                    strokeDasharray="1.5,1.5"
                    markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />,
                );
                // Label
                elements.push(
                  <text key={`inner-col-label-${panelIndex}-${c}`}
                    x={colMidX} y={dimY + 5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={INNER_DIM_FONT - 1} fill={INNER_DIM_COLOR} fontWeight={500}>
                    {colRealWidth}
                  </text>,
                );
              }
            }

            // Pane row heights (right side, between frame and outer right dim)
            if (horizontalCount > 1) {
              // Position just to the right of this panel's right edge
              const dimX = panelRight + 6;

              for (let r = 0; r < horizontalCount; r++) {
                const rowTopFrac = getRowTopFrac(panelIndex, r, horizontalCount);
                const rowBottomFrac = getRowBottomFrac(panelIndex, r, horizontalCount);
                const rowTop = panelTopY + rowTopFrac * panelH;
                const rowBottom = panelTopY + rowBottomFrac * panelH;
                const rowMidY = (rowTop + rowBottom) / 2;
                const rowRealHeight = getRowRealHeight(panelIndex, r, horizontalCount);

                // Extension ticks
                elements.push(
                  <line key={`inner-row-ext-t-${panelIndex}-${r}`}
                    x1={dimX - 2} y1={rowTop} x2={dimX + 2} y2={rowTop}
                    stroke={INNER_DIM_COLOR} strokeWidth={0.3} opacity={0.5} />,
                  <line key={`inner-row-ext-b-${panelIndex}-${r}`}
                    x1={dimX - 2} y1={rowBottom} x2={dimX + 2} y2={rowBottom}
                    stroke={INNER_DIM_COLOR} strokeWidth={0.3} opacity={0.5} />,
                );
                // Dimension line (vertical)
                elements.push(
                  <line key={`inner-row-line-${panelIndex}-${r}`}
                    x1={dimX} y1={rowTop} x2={dimX} y2={rowBottom}
                    stroke={INNER_DIM_COLOR} strokeWidth={innerStrokeW}
                    strokeDasharray="1.5,1.5"
                    markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />,
                );
                // Label (rotated for vertical)
                if (editingDim?.key !== `rh-${panelIndex}-${r}`) {
                  const pi = panelIndex;
                  const ri = r;
                  const rowRealH = rowRealHeight;
                  elements.push(
                    <text key={`inner-row-label-${panelIndex}-${r}`}
                      x={dimX + 5} y={rowMidY}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={INNER_DIM_FONT - 1} fill={INNER_DIM_COLOR} fontWeight={500}
                      transform={`rotate(-90, ${dimX + 5}, ${rowMidY})`}
                      style={{ cursor: onRowHeightChange ? 'pointer' : undefined }}
                      onDoubleClick={(e) => {
                        if (!onRowHeightChange) return;
                        e.stopPropagation();
                        setEditingDim({
                          key: `rh-${pi}-${ri}`,
                          x: dimX + 5, y: rowMidY,
                          value: rowRealH,
                          angle: -90,
                          onCommit: (v) => onRowHeightChange(pi, ri, v),
                        });
                        setEditValue(String(rowRealH));
                      }}>
                      {rowRealHeight}
                    </text>,
                  );
                }
              }
            }
          }
        }

        if (elements.length === 0) return null;
        return <g>{elements}</g>;
      })()}

      {/* --- Layer 8: Placed custom arcs --- */}
      {customArcs?.map((arc) => (
        <path key={arc.id}
          d={`M ${arc.cx - arc.rx} ${arc.cy} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.cx + arc.rx} ${arc.cy}`}
          fill="none" stroke={frameColor} strokeWidth={1} />
      ))}

      {/* --- Layer 9: Hover preview (faded) --- */}
      {activeTool && hoverPos && (
        <g opacity={0.3}>
          {renderToolPreview()}
        </g>
      )}

      {/* --- Inline dimension editor overlay --- */}
      {editingDim && (
        <foreignObject
          x={editingDim.x - 25}
          y={editingDim.y - 8}
          width={50}
          height={16}
          transform={editingDim.angle ? `rotate(${editingDim.angle}, ${editingDim.x}, ${editingDim.y})` : undefined}
        >
          <input
            ref={inputRef}
            xmlns="http://www.w3.org/1999/xhtml"
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitEdit();
              } else if (e.key === 'Escape') {
                setEditingDim(null);
              }
            }}
            onBlur={commitEdit}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              fontSize: '7px',
              textAlign: 'center' as const,
              border: '1px solid #7E88C3',
              borderRadius: '2px',
              outline: 'none',
              background: 'white',
              padding: '0 2px',
              boxSizing: 'border-box' as const,
            }}
          />
        </foreignObject>
      )}
    </svg>
  );
};

export default ShapeCanvas;
