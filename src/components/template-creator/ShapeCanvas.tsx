import React, { useId, useState, useRef, useEffect, useCallback } from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';

// Utils
import {
  MARGIN,
  BOTTOM_LABEL_SPACE,
  DIM_COLOR,
  FRAME_STROKE,
  DIVIDER_STROKE,
  MARKER_SIZE,
} from './utils/types';
import { getGlassColor } from './utils/glass-color';
import { getRealVertices, scaleVertices, getShapePath } from './utils/shape-path';
import { getPanelDividers, getPanelPolygonPoints, getPanelCenter } from './utils/panels';
import { getOpeningIndicator } from './utils/opening-indicators';
import type { CanvasTool, PlacedArc } from './utils/canvas-tools';

// Extracted helpers
import type { EdgeCommitContext } from './utils/edge-commit';
import { findPanelAtPoint, getDirectionFromPosition, computeLinePreview, computeArcPlacement } from './utils/tool-interactions';
import type { CanvasGeometry } from './utils/tool-interactions';
import { findRemovableAtPoint, findSameKindAtPoint, getHighlightGeometry } from './utils/remove-tools';
import type { RemovableItem, RemoveContext } from './utils/remove-tools';
import type { SectionId } from './utils/section-outline';
import { computeSectionOutlinePath, isSectionRemoved, parseOutlineVertices, svgVertsToReal, mergeCollinearVertices, computeEffectiveBounds } from './utils/section-outline';

// Extracted layer renderers
import { renderPaneGlass, renderSubdivisionLines, renderPaneOpenings } from './layers/PaneLayers';
import type { PaneLayersProps } from './layers/PaneLayers';
import { renderOuterDimensions, renderArchDimensions, renderBottomDimension, renderInnerDimensions } from './layers/DimensionLayers';
import type { EditingDim, DimensionLayersProps } from './layers/DimensionLayers';
import { renderToolPreview } from './layers/ToolPreviewLayer';

// Re-export RemovableItem for consumers that import it from here
export type { RemovableItem } from './utils/remove-tools';

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
  svgStyle?: React.CSSProperties;
  onWidthChange?: (newWidth: number) => void;
  onHeightChange?: (newHeight: number) => void;
  onShapeConfigChange?: (updates: Partial<ShapeConfig>) => void;
  onPanelWidthChange?: (panelIndex: number, newWidth: number) => void;
  onRowHeightChange?: (panelIndex: number, rowIndex: number, newHeight: number) => void;
  activeTool?: CanvasTool;
  lineOrientation?: 'horizontal' | 'vertical';
  lineTarget?: 'panel' | 'pane';
  onHandlePlaced?: (panelIndex: number, direction: 'left' | 'right' | 'top' | 'bottom', paneInfo?: { rowIndex: number; colIndex: number }) => void;
  onPanelSplit?: (splitPositionMm: number) => void;
  onPaneRowAdd?: (panelIndex: number, splitPositionMm: number) => void;
  onPaneColAdd?: (panelIndex: number, splitPositionMm: number) => void;
  customArcs?: PlacedArc[];
  onArcPlaced?: (arc: PlacedArc) => void;
  onPanelDividerRemove?: (dividerIndex: number) => void;
  onPaneRowRemove?: (panelIndex: number, rowDividerIndex: number) => void;
  onPaneColRemove?: (panelIndex: number, colDividerIndex: number) => void;
  onPanelOpeningRemove?: (panelIndex: number) => void;
  onPaneOpeningRemove?: (panelIndex: number, rowIndex: number, colIndex: number) => void;
  onArcRemove?: (arcId: string) => void;
  removedSections?: SectionId[];
  onSectionRemove?: (panelIndex: number, rowIndex: number, colIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  shape,
  width,
  height,
  unit: _unit,
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
  onPanelDividerRemove,
  onPaneRowRemove,
  onPaneColRemove,
  onPanelOpeningRemove,
  onPaneOpeningRemove,
  onArcRemove,
  removedSections,
  onSectionRemove,
}) => {
  // Unique prefix for SVG defs IDs
  const uid = useId().replace(/:/g, '');
  const arrowLId = `sc-arrowL-${uid}`;
  const arrowRId = `sc-arrowR-${uid}`;
  const clipId = `sc-shape-clip-${uid}`;

  // --- Inline dimension editing state ---
  const [editingDim, setEditingDim] = useState<EditingDim | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Tool interaction state ---
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- Remove tool state ---
  const [removeTarget, setRemoveTarget] = useState<RemovableItem | null>(null);
  const [rightClickTarget, setRightClickTarget] = useState<RemovableItem | null>(null);

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

  // Effective bounding dimensions (for display ratio when sections are removed)
  const effBounds = removedSections?.length
    ? computeEffectiveBounds(panels, panelWidths, panelDivisions, panelDivisionHeights, panelDivisionWidths, height, removedSections)
    : null;
  const displayW = effBounds?.width || width;
  const displayH = effBounds?.height || height;

  // Drawing area dimensions (ratio adapts to effective shape)
  const baseSize = 180;
  const drawH = baseSize;
  const drawW = displayW > 1000 && displayH > 0
    ? Math.round(baseSize * (displayW / displayH))
    : baseSize;

  const totalW = drawW + 2 * MARGIN;
  const totalH = drawH + 2 * MARGIN + BOTTOM_LABEL_SPACE;

  // Compute vertices
  const realVerts = getRealVertices(shape, width, height);
  const svgVerts = scaleVertices(realVerts, width, height, drawW, drawH);

  // Shape outline path
  const shapePath = getShapePath(shape, svgVerts, drawW, drawH, width, height);

  // Effective path (accounts for removed sections)
  const sectionPath = removedSections?.length
    ? computeSectionOutlinePath(panels, panelWidths, panelDivisions, panelDivisionHeights, panelDivisionWidths, width, height, drawW, drawH, shape, svgVerts, removedSections)
    : null;
  const effectivePath = sectionPath || shapePath;

  // Effective outline vertices for dimension recalculation
  const effectiveSvgVerts = sectionPath
    ? mergeCollinearVertices(parseOutlineVertices(sectionPath))
    : undefined;
  const effectiveRealVerts = effectiveSvgVerts
    ? svgVertsToReal(effectiveSvgVerts, drawW, drawH, width, height)
    : undefined;

  // Glass color
  const glassColor = getGlassColor(glassType, frameColor, customGlassTint);

  // Panel dividers
  const dividers = getPanelDividers(shape, panels, panelWidths, svgVerts, drawW, drawH, width, height);

  // Shape center
  const svgCenterX = svgVerts.reduce((s, v) => s + v.x, 0) / svgVerts.length;
  const svgCenterY = svgVerts.reduce((s, v) => s + v.y, 0) / svgVerts.length;

  // --- Build shared context objects for extracted modules ---

  const canvasGeo: CanvasGeometry = {
    panels, panelWidths, svgVerts, drawW, drawH, width, height, shape,
    panelDivisions, panelDivisionHeights, panelDivisionWidths,
  };

  const removeCtx: RemoveContext = {
    shape, panels, panelWidths, svgVerts, drawW, drawH, width, height,
    dividers, panelDivisions, panelDivisionHeights, panelDivisionWidths,
    openingPanels, openingDirections, openingPanes, customArcs, removedSections,
  };

  const edgeCommitCtx: EdgeCommitContext = {
    shape, width, height, onWidthChange, onHeightChange, onShapeConfigChange,
  };

  const paneLayerProps: PaneLayersProps = {
    shape, panels, panelWidths, svgVerts, drawW, drawH, width, height,
    frameColor, panelDivisions, panelDivisionHeights, panelDivisionWidths, openingPanes,
    removedSections,
  };

  const dimLayerProps: DimensionLayersProps = {
    shape, width, height, drawW, drawH, panels, panelWidths,
    svgVerts, realVerts, svgCenterX, svgCenterY,
    arrowLId, arrowRId, editingDim, setEditingDim, setEditValue,
    edgeCommitCtx, panelDivisions, panelDivisionHeights, panelDivisionWidths,
    onPanelWidthChange, onRowHeightChange, onWidthChange, onHeightChange,
    removedSections, effectiveSvgVerts, effectiveRealVerts,
  };

  // --- Dispatch removal for a given item ---
  function dispatchRemoval(item: RemovableItem) {
    switch (item.type) {
      case 'panel-divider': onPanelDividerRemove?.(item.dividerIndex); break;
      case 'pane-row-divider': onPaneRowRemove?.(item.panelIndex, item.rowDividerIndex); break;
      case 'pane-col-divider': onPaneColRemove?.(item.panelIndex, item.colDividerIndex); break;
      case 'panel-opening': onPanelOpeningRemove?.(item.panelIndex); break;
      case 'pane-opening': onPaneOpeningRemove?.(item.panelIndex, item.rowIndex, item.colIndex); break;
      case 'arc': onArcRemove?.(item.arcId); break;
      case 'section': onSectionRemove?.(item.panelIndex, item.rowIndex, item.colIndex); break;
    }
  }

  // --- Tool click handler ---
  function handleToolClick(_e: React.MouseEvent) {
    if (!hoverPos) return;

    if (activeTool === 'handle' && onHandlePlaced) {
      const hit = findPanelAtPoint(canvasGeo, hoverPos.x, hoverPos.y);
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
      const preview = computeLinePreview(canvasGeo, hoverPos.x, hoverPos.y, lineOrientation, lineTarget);
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
      const arc = computeArcPlacement(canvasGeo, hoverPos.x, hoverPos.y);
      if (arc) onArcPlaced(arc);
    }

    if (activeTool === 'remove' && removeTarget) {
      dispatchRemoval(removeTarget);
      setRemoveTarget(null);
    }
  }

  // --- Right-click handler for same-kind removal ---
  function handleContextMenu(e: React.MouseEvent) {
    if (!activeTool || activeTool === 'remove') return;
    e.preventDefault();
    const pt = getSVGPoint(e);
    if (!pt) return;
    const item = findSameKindAtPoint(removeCtx, pt.x, pt.y, activeTool, lineTarget);
    if (item) {
      dispatchRemoval(item);
      setRightClickTarget(null);
    }
  }

  // Cursor based on tool and hover target
  const svgCursor = (() => {
    if (!activeTool) return undefined;
    if (activeTool === 'remove') return removeTarget ? 'pointer' : 'crosshair';
    if (rightClickTarget) return 'pointer';
    return 'crosshair';
  })();

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{
        ...(svgStyle ?? { width: '100%', height: '88vh' }),
        cursor: svgCursor,
      }}
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={(e) => {
        if (!activeTool) return;
        const pt = getSVGPoint(e);
        if (pt) {
          setHoverPos(pt);
          if (activeTool === 'remove') {
            setRemoveTarget(findRemovableAtPoint(removeCtx, pt.x, pt.y));
          } else {
            setRightClickTarget(findSameKindAtPoint(removeCtx, pt.x, pt.y, activeTool, lineTarget));
          }
        }
      }}
      onMouseLeave={() => {
        setHoverPos(null);
        setRemoveTarget(null);
        setRightClickTarget(null);
      }}
      onClick={(e) => {
        if (!activeTool || !hoverPos) return;
        handleToolClick(e);
      }}
      onContextMenu={(e) => {
        if (activeTool && activeTool !== 'remove') {
          handleContextMenu(e);
        }
      }}
    >
      {/* Defs: arrow markers for dimension lines */}
      <defs>
        <marker id={arrowLId} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE} refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M${MARKER_SIZE},0 L0,${MARKER_SIZE / 2} L${MARKER_SIZE},${MARKER_SIZE}`} fill={DIM_COLOR} />
        </marker>
        <marker id={arrowRId} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX="0" refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE}`} fill={DIM_COLOR} />
        </marker>
        <clipPath id={clipId}>
          <path d={effectivePath} />
        </clipPath>
      </defs>

      {/* --- Clipped glass group (respects removed sections) --- */}
      <g clipPath={`url(#${clipId})`}>
      {/* --- Layer 1: Glass fill per panel --- */}
      {Array.from({ length: panels }).map((_, i) => {
        // Skip if all cells in this panel are removed
        if (removedSections?.length) {
          const div = panelDivisions?.find((d) => d.panelIndex === i);
          const rows = div?.horizontalCount ?? 1;
          const cols = div?.verticalCount ?? 1;
          let allRemoved = true;
          for (let ri = 0; ri < rows && allRemoved; ri++) {
            for (let ci = 0; ci < cols && allRemoved; ci++) {
              if (!isSectionRemoved(removedSections, i, ri, ci)) allRemoved = false;
            }
          }
          if (allRemoved) return null;
        }
        const pts = getPanelPolygonPoints(shape, i, panels, panelWidths, svgVerts, drawW, drawH, width, height);
        if (!pts) return null;
        const isOpening = openingPanels.includes(i);
        return (
          <polygon key={`glass-${i}`} points={pts}
            fill={isOpening ? '#44D5B880' : glassColor} stroke="none" />
        );
      })}

      {/* --- Layer 1b: Pane-level glass fill --- */}
      {renderPaneGlass(paneLayerProps)}
      </g>

      {/* --- Layer 2: Panel divider lines --- */}
      {dividers.map((d, i) => {
        // Skip divider if ALL cells on both adjacent sides are removed
        if (removedSections?.length) {
          const leftPi = i;
          const rightPi = i + 1;
          const leftDiv = panelDivisions?.find((dd) => dd.panelIndex === leftPi);
          const rightDiv = panelDivisions?.find((dd) => dd.panelIndex === rightPi);
          const leftRows = leftDiv?.horizontalCount ?? 1;
          const leftCols = leftDiv?.verticalCount ?? 1;
          const rightRows = rightDiv?.horizontalCount ?? 1;
          // Check all cells on the right edge of left panel and left edge of right panel
          let allRemoved = true;
          for (let ri = 0; ri < leftRows && allRemoved; ri++) {
            if (!isSectionRemoved(removedSections, leftPi, ri, leftCols - 1)) allRemoved = false;
          }
          for (let ri = 0; ri < rightRows && allRemoved; ri++) {
            if (!isSectionRemoved(removedSections, rightPi, ri, 0)) allRemoved = false;
          }
          if (allRemoved) return null;
        }
        return (
          <line key={`div-${i}`} x1={d.x} y1={d.topY} x2={d.x} y2={d.bottomY}
            stroke={frameColor} strokeWidth={DIVIDER_STROKE} />
        );
      })}

      {/* --- Layer 2b: Pane subdivision lines --- */}
      {renderSubdivisionLines(paneLayerProps)}

      {/* --- Layer 3: Frame border --- */}
      <path d={effectivePath} fill="none" stroke={frameColor}
        strokeWidth={FRAME_STROKE} strokeLinejoin="miter" />

      {/* --- Layer 4: Opening indicators (clipped to shape) --- */}
      <g clipPath={`url(#${clipId})`}>
        {openingPanels.map((panelIdx) => {
          const dir = openingDirections[panelIdx];
          if (!dir) return null;
          const { cx, cy, w: pw, h: ph } = getPanelCenter(
            shape, panelIdx, panels, panelWidths, svgVerts, drawW, drawH, width, height,
          );
          return getOpeningIndicator(dir, isSliding, cx, cy, pw, ph, `opening-${panelIdx}`);
        })}
        {/* --- Layer 4b: Pane-level opening indicators --- */}
        {renderPaneOpenings(paneLayerProps)}
      </g>

      {/* --- Layer 5: Outer edge dimensions --- */}
      {renderOuterDimensions(dimLayerProps)}

      {/* --- Layer 5b: Arch dimensions --- */}
      {renderArchDimensions(dimLayerProps)}

      {/* --- Layer 6: Bottom edge dimension --- */}
      {renderBottomDimension(dimLayerProps)}

      {/* --- Layer 7: Inner dimensions (panel widths + pane subdivisions) --- */}
      {renderInnerDimensions(dimLayerProps)}

      {/* --- Layer 8: Placed custom arcs --- */}
      {customArcs?.map((arc) => (
        <path key={arc.id}
          d={`M ${arc.cx - arc.rx} ${arc.cy} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.cx + arc.rx} ${arc.cy}`}
          fill="none" stroke={frameColor} strokeWidth={1} />
      ))}

      {/* --- Layer 9: Hover preview (faded) --- */}
      {activeTool && activeTool !== 'remove' && hoverPos && (
        <g opacity={0.3}>{renderToolPreview({
          activeTool, hoverPos, canvasGeo, frameColor, isSliding, lineOrientation, lineTarget,
        })}</g>
      )}

      {/* --- Layer 10: Remove / right-click highlight overlay --- */}
      {activeTool === 'remove' && removeTarget && <g key="remove-highlight">{getHighlightGeometry(removeTarget, removeCtx)}</g>}
      {activeTool && activeTool !== 'remove' && rightClickTarget && <g key="rclick-highlight">{getHighlightGeometry(rightClickTarget, removeCtx)}</g>}

      {/* --- Inline dimension editor overlay --- */}
      {editingDim && (
        <foreignObject
          x={editingDim.x - 25} y={editingDim.y - 8} width={50} height={16}
          transform={editingDim.angle ? `rotate(${editingDim.angle}, ${editingDim.x}, ${editingDim.y})` : undefined}
        >
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              else if (e.key === 'Escape') setEditingDim(null);
            }}
            onBlur={commitEdit}
            autoFocus
            style={{
              width: '100%', height: '100%', fontSize: '7px',
              textAlign: 'center' as const, border: '1px solid #7E88C3',
              borderRadius: '2px', outline: 'none', background: 'white',
              padding: '0 2px', boxSizing: 'border-box' as const,
            }}
          />
        </foreignObject>
      )}
    </svg>
  );
};

export default ShapeCanvas;
