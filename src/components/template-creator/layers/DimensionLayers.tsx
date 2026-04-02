// ---------------------------------------------------------------------------
// DimensionLayers: Layers 5, 5b, 6, 7 — outer edge dimensions, arch
// dimensions, bottom edge dimension, and inner panel/pane dimensions.
// ---------------------------------------------------------------------------

import React from 'react';
import type { ShapeConfig } from '@/components/product-sketch/types';
import type { Point } from '../utils/types';
import { MARGIN, DIM_COLOR, DIM_FONT, DIM_OFFSET, DIM_LABEL_GAP } from '../utils/types';
import { getOutwardNormal, realEdgeLength, isBottomEdge } from '../utils/geometry';
import { getArchRy } from '../utils/shape-path';
import { getTopYAtX, getBottomYAtX } from '../utils/boundaries';
import { getRowTopFrac, getRowBottomFrac, getColLeftFrac, getColRightFrac, getRowRealHeight, getColRealWidth } from '../utils/pane-fractions';
import type { EdgeCommitContext } from '../utils/edge-commit';
import { getEdgeCommitFn } from '../utils/edge-commit';
import type { SectionId } from '../utils/section-outline';
import { isSectionRemoved } from '../utils/section-outline';

// ---------------------------------------------------------------------------
// Shared editing state types
// ---------------------------------------------------------------------------

export interface EditingDim {
  key: string;
  x: number;
  y: number;
  value: number;
  angle: number;
  onCommit: (val: number) => void;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DimensionLayersProps {
  shape: ShapeConfig;
  width: number;
  height: number;
  drawW: number;
  drawH: number;
  panels: number;
  panelWidths: number[];
  svgVerts: Point[];
  realVerts: Point[];
  svgCenterX: number;
  svgCenterY: number;
  arrowLId: string;
  arrowRId: string;
  editingDim: EditingDim | null;
  setEditingDim: (dim: EditingDim | null) => void;
  setEditValue: (val: string) => void;
  edgeCommitCtx: EdgeCommitContext;
  panelDivisions?: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }>;
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths?: Array<{ panelIndex: number; colWidths: number[] }>;
  onPanelWidthChange?: (panelIndex: number, newWidth: number) => void;
  onRowHeightChange?: (panelIndex: number, rowIndex: number, newHeight: number) => void;
  onWidthChange?: (newWidth: number) => void;
  onHeightChange?: (newHeight: number) => void;
  removedSections?: SectionId[];
  effectiveSvgVerts?: Point[];
  effectiveRealVerts?: Point[];
}

// ---------------------------------------------------------------------------
// Layer 5: Outer edge dimensions (non-bottom edges)
// ---------------------------------------------------------------------------

export function renderOuterDimensions(props: DimensionLayersProps): React.ReactNode {
  const {
    shape, width, height, svgVerts, realVerts, svgCenterX, svgCenterY,
    arrowLId, arrowRId, editingDim, setEditingDim, setEditValue, edgeCommitCtx,
    effectiveSvgVerts, effectiveRealVerts,
  } = props;

  // Use effective outline vertices when sections have been removed
  const useSvg = effectiveSvgVerts ?? svgVerts;
  const useReal = effectiveRealVerts ?? realVerts;
  const hasEffective = !!effectiveSvgVerts;

  // Compute center from the vertices we're using
  const cX = hasEffective
    ? useSvg.reduce((s, v) => s + v.x, 0) / useSvg.length
    : svgCenterX;
  const cY = hasEffective
    ? useSvg.reduce((s, v) => s + v.y, 0) / useSvg.length
    : svgCenterY;

  const maxRealY = Math.max(...useReal.map((v) => v.y));

  // Build edge list (skip bottom)
  const edges: Array<{
    sv1: Point; sv2: Point; rv1: Point; rv2: Point; realLen: number;
  }> = [];
  for (let i = 0; i < useSvg.length; i++) {
    const j = (i + 1) % useSvg.length;
    const rv1 = useReal[i];
    const rv2 = useReal[j];
    if (isBottomEdge(rv1, rv2, maxRealY)) continue;
    edges.push({
      sv1: useSvg[i], sv2: useSvg[j], rv1, rv2,
      realLen: realEdgeLength(rv1, rv2),
    });
  }

  // Effective bounding box for checking full-span edges
  const effBboxW = hasEffective ? Math.round(Math.max(...useReal.map((v) => v.x)) - Math.min(...useReal.map((v) => v.x))) : 0;
  const effBboxH = hasEffective ? Math.round(Math.max(...useReal.map((v) => v.y)) - Math.min(...useReal.map((v) => v.y))) : 0;

  // Pre-compute all label positions, then stagger any that overlap
  const dimData = edges.map((edge, i) => {
    const { nx, ny } = getOutwardNormal(
      edge.sv1.x, edge.sv1.y, edge.sv2.x, edge.sv2.y,
      cX, cY,
    );
    // For effective outlines: only full-span edges are editable
    let commitFn: ((v: number) => void) | undefined | null;
    if (!hasEffective) {
      commitFn = getEdgeCommitFn(edgeCommitCtx, edge.rv1, edge.rv2);
    } else {
      const isHoriz = Math.abs(edge.rv1.y - edge.rv2.y) < 0.5;
      const isVert = Math.abs(edge.rv1.x - edge.rv2.x) < 0.5;
      if (isHoriz && Math.abs(edge.realLen - effBboxW) < 1 && edgeCommitCtx.onWidthChange) {
        commitFn = edgeCommitCtx.onWidthChange;
      } else if (isVert && Math.abs(edge.realLen - effBboxH) < 1 && edgeCommitCtx.onHeightChange) {
        commitFn = edgeCommitCtx.onHeightChange;
      } else {
        commitFn = null;
      }
    }
    return { edge, nx, ny, idx: i, commitFn };
  });

  const offsets = dimData.map(() => DIM_OFFSET);
  for (let a = 0; a < dimData.length; a++) {
    for (let b = a + 1; b < dimData.length; b++) {
      const da = dimData[a], db = dimData[b];
      const midAx = (da.edge.sv1.x + da.edge.sv2.x) / 2 + da.nx * offsets[a];
      const midAy = (da.edge.sv1.y + da.edge.sv2.y) / 2 + da.ny * offsets[a];
      const midBx = (db.edge.sv1.x + db.edge.sv2.x) / 2 + db.nx * offsets[b];
      const midBy = (db.edge.sv1.y + db.edge.sv2.y) / 2 + db.ny * offsets[b];
      const dist = Math.sqrt((midAx - midBx) ** 2 + (midAy - midBy) ** 2);
      if (dist < 36) {
        if (da.edge.realLen <= db.edge.realLen) {
          offsets[a] = offsets[a] + 20;
        } else {
          offsets[b] = offsets[b] + 20;
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
    const labelX = (lx1 + lx2) / 2 + nx * DIM_LABEL_GAP;
    const labelY = (ly1 + ly2) / 2 + ny * DIM_LABEL_GAP;
    const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
    const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

    return (
      <g key={`dim-${idx}`}>
        <line
          x1={edge.sv1.x} y1={edge.sv1.y} x2={lx1} y2={ly1}
          stroke={DIM_COLOR} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.4}
        />
        <line
          x1={edge.sv2.x} y1={edge.sv2.y} x2={lx2} y2={ly2}
          stroke={DIM_COLOR} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.4}
        />
        <line
          x1={lx1} y1={ly1} x2={lx2} y2={ly2}
          stroke={DIM_COLOR} strokeWidth={1}
          markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`}
        />
        {editingDim?.key === `edge-${idx}` ? null : (
          <text
            x={labelX} y={labelY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={700}
            transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
            style={{ cursor: commitFn ? 'pointer' : undefined }}
            onDoubleClick={(e) => {
              if (!commitFn) return;
              e.stopPropagation();
              setEditingDim({
                key: `edge-${idx}`, x: labelX, y: labelY,
                value: edge.realLen, angle: readableAngle,
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
}

// ---------------------------------------------------------------------------
// Layer 5b: Arch dimensions (height + width at spring line)
// ---------------------------------------------------------------------------

export function renderArchDimensions(props: DimensionLayersProps): React.ReactNode {
  const {
    shape, width, height, drawW, drawH,
    arrowLId, arrowRId, editingDim, setEditingDim, setEditValue,
    onWidthChange, onHeightChange,
  } = props;

  if (shape.type !== 'arch') return null;

  const isSemicircle = (shape.archType ?? 'semicircle') === 'semicircle';
  const archH = isSemicircle ? width / 2 : (shape.archHeight ?? height * 0.3);
  const archHPx = getArchRy(shape, drawW, drawH, height);
  const apexY = MARGIN;
  const springY = MARGIN + archHPx;
  const centerX = MARGIN + drawW / 2;

  const hLineX = MARGIN + drawW + DIM_OFFSET;
  const hLabelX = hLineX + DIM_LABEL_GAP;
  const hMidY = (apexY + springY) / 2;

  const wLineY = MARGIN - DIM_OFFSET;
  const wLabelY = wLineY - DIM_LABEL_GAP;
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
          fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={700}
          transform={`rotate(90, ${hLabelX}, ${hMidY})`}
          style={{ cursor: onHeightChange ? 'pointer' : undefined }}
          onDoubleClick={(e) => {
            if (!onHeightChange) return;
            e.stopPropagation();
            setEditingDim({
              key: 'arch-height', x: hLabelX, y: hMidY,
              value: Math.round(archH), angle: 90,
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
          fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={700}
          style={{ cursor: onWidthChange ? 'pointer' : undefined }}
          onDoubleClick={(e) => {
            if (!onWidthChange) return;
            e.stopPropagation();
            setEditingDim({
              key: 'arch-width', x: centerX, y: wLabelY,
              value: width, angle: 0,
              onCommit: onWidthChange,
            });
            setEditValue(String(width));
          }}>
          {width}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Layer 6: Bottom edge dimension
// ---------------------------------------------------------------------------

export function renderBottomDimension(props: DimensionLayersProps): React.ReactNode {
  const {
    svgVerts, realVerts, svgCenterX, svgCenterY,
    arrowLId, arrowRId, editingDim, setEditingDim, setEditValue, edgeCommitCtx,
    effectiveSvgVerts, effectiveRealVerts,
  } = props;

  // Use effective outline vertices when sections have been removed
  const useSvg = effectiveSvgVerts ?? svgVerts;
  const useReal = effectiveRealVerts ?? realVerts;
  const hasEffective = !!effectiveSvgVerts;

  const cX = hasEffective
    ? useSvg.reduce((s, v) => s + v.x, 0) / useSvg.length
    : svgCenterX;
  const cY = hasEffective
    ? useSvg.reduce((s, v) => s + v.y, 0) / useSvg.length
    : svgCenterY;

  const maxRealY = Math.max(...useReal.map((v) => v.y));

  const bottomRV1 = useReal.find((_, i) => {
    const j = (i + 1) % useReal.length;
    return isBottomEdge(useReal[i], useReal[j], maxRealY);
  });
  const bottomIdx = useReal.indexOf(bottomRV1!);
  if (bottomIdx < 0) return null;

  const j = (bottomIdx + 1) % useSvg.length;
  const sv1 = useSvg[bottomIdx];
  const sv2 = useSvg[j];
  const rv1 = useReal[bottomIdx];
  const rv2 = useReal[j];
  const len = realEdgeLength(rv1, rv2);
  // For effective outlines: bottom edge is editable if it spans the full effective width
  let bottomCommitFn: ((v: number) => void) | undefined | null;
  if (!hasEffective) {
    bottomCommitFn = getEdgeCommitFn(edgeCommitCtx, rv1, rv2);
  } else {
    const effBboxW = Math.round(Math.max(...useReal.map((v) => v.x)) - Math.min(...useReal.map((v) => v.x)));
    bottomCommitFn = Math.abs(len - effBboxW) < 1 && edgeCommitCtx.onWidthChange
      ? edgeCommitCtx.onWidthChange
      : null;
  }

  const { nx, ny } = getOutwardNormal(
    sv1.x, sv1.y, sv2.x, sv2.y,
    cX, cY,
  );

  const lx1 = sv1.x + nx * DIM_OFFSET;
  const ly1 = sv1.y + ny * DIM_OFFSET;
  const lx2 = sv2.x + nx * DIM_OFFSET;
  const ly2 = sv2.y + ny * DIM_OFFSET;
  const labelX = (lx1 + lx2) / 2 + nx * DIM_LABEL_GAP;
  const labelY = (ly1 + ly2) / 2 + ny * DIM_LABEL_GAP;
  const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
  const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

  return (
    <g>
      <line
        x1={sv1.x} y1={sv1.y} x2={lx1} y2={ly1}
        stroke={DIM_COLOR} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.4}
      />
      <line
        x1={sv2.x} y1={sv2.y} x2={lx2} y2={ly2}
        stroke={DIM_COLOR} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.4}
      />
      <line
        x1={lx1} y1={ly1} x2={lx2} y2={ly2}
        stroke={DIM_COLOR} strokeWidth={1}
        markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`}
      />
      {editingDim?.key === 'bottom-edge' ? null : (
        <text
          x={labelX} y={labelY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={700}
          transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
          style={{ cursor: bottomCommitFn ? 'pointer' : undefined }}
          onDoubleClick={(e) => {
            if (!bottomCommitFn) return;
            e.stopPropagation();
            setEditingDim({
              key: 'bottom-edge', x: labelX, y: labelY,
              value: len, angle: readableAngle,
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
}

// ---------------------------------------------------------------------------
// Layer 7: Inner dimension lines (panel widths + pane subdivisions)
// ---------------------------------------------------------------------------

export function renderInnerDimensions(props: DimensionLayersProps): React.ReactNode {
  const {
    shape, width, height, drawW, drawH, panels, panelWidths, svgVerts,
    arrowLId, arrowRId, editingDim, setEditingDim, setEditValue,
    panelDivisions, panelDivisionHeights, panelDivisionWidths,
    onPanelWidthChange, onRowHeightChange, removedSections,
  } = props;

  const INNER_DIM_COLOR = '#9CA3C3';
  const INNER_DIM_FONT = 8;
  const innerStrokeW = 0.6;
  const rs = removedSections ?? [];

  // Helper: check if all cells in a panel are removed
  const isFullPanelRemoved = (pi: number): boolean => {
    if (rs.length === 0) return false;
    const div = panelDivisions?.find((d) => d.panelIndex === pi);
    const rows = div?.horizontalCount ?? 1;
    const cols = div?.verticalCount ?? 1;
    for (let ri = 0; ri < rows; ri++) {
      for (let ci = 0; ci < cols; ci++) {
        if (!isSectionRemoved(rs, pi, ri, ci)) return false;
      }
    }
    return true;
  };

  const total = panelWidths.reduce((a, b) => a + b, 0);
  const elements: React.ReactNode[] = [];

  // --- 7a: Panel width dimensions (horizontal, below the frame, above outer dims) ---
  if (panels > 1) {
    const innerY = MARGIN + drawH + 12;
    let accFrac = 0;
    for (let i = 0; i < panels; i++) {
      // Skip panel width dimension if entire panel is removed
      if (isFullPanelRemoved(i)) {
        accFrac += panelWidths[i] / total;
        continue;
      }
      const frac = panelWidths[i] / total;
      const panelLeft = MARGIN + accFrac * drawW;
      const panelRight = MARGIN + (accFrac + frac) * drawW;
      const midX = (panelLeft + panelRight) / 2;

      elements.push(
        <line key={`inner-pw-ext-l-${i}`}
          x1={panelLeft} y1={innerY - 4} x2={panelLeft} y2={innerY + 4}
          stroke={INNER_DIM_COLOR} strokeWidth={0.5} opacity={0.6} />,
        <line key={`inner-pw-ext-r-${i}`}
          x1={panelRight} y1={innerY - 4} x2={panelRight} y2={innerY + 4}
          stroke={INNER_DIM_COLOR} strokeWidth={0.5} opacity={0.6} />,
      );
      elements.push(
        <line key={`inner-pw-line-${i}`}
          x1={panelLeft} y1={innerY} x2={panelRight} y2={innerY}
          stroke={INNER_DIM_COLOR} strokeWidth={innerStrokeW}
          markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />,
      );
      if (editingDim?.key !== `pw-${i}`) {
        const panelIdx = i;
        elements.push(
          <text key={`inner-pw-label-${i}`}
            x={midX} y={innerY + 8}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={INNER_DIM_FONT} fill={INNER_DIM_COLOR} fontWeight={700}
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

      // Pane column widths (below frame)
      if (verticalCount > 1) {
        const dimY = MARGIN + drawH + (panels > 1 ? 26 : 12);

        for (let c = 0; c < verticalCount; c++) {
          // Skip column dim if all rows in this column are removed
          if (rs.length > 0) {
            const allRowsRemoved = Array.from({ length: horizontalCount }, (_, ri) =>
              isSectionRemoved(rs, panelIndex, ri, c),
            ).every(Boolean);
            if (allRowsRemoved) continue;
          }
          const colLFrac = getColLeftFrac(panelDivisionWidths, panelIndex, c, verticalCount);
          const colRFrac = getColRightFrac(panelDivisionWidths, panelIndex, c, verticalCount);
          const colLeft = panelLeft + colLFrac * panelW;
          const colRight = panelLeft + colRFrac * panelW;
          const colMidX = (colLeft + colRight) / 2;
          const colRealWidth = getColRealWidth(panelDivisionWidths, panelWidths, panelIndex, c, verticalCount);

          elements.push(
            <line key={`inner-col-ext-l-${panelIndex}-${c}`}
              x1={colLeft} y1={dimY - 3} x2={colLeft} y2={dimY + 3}
              stroke={INNER_DIM_COLOR} strokeWidth={0.4} opacity={0.5} />,
            <line key={`inner-col-ext-r-${panelIndex}-${c}`}
              x1={colRight} y1={dimY - 3} x2={colRight} y2={dimY + 3}
              stroke={INNER_DIM_COLOR} strokeWidth={0.4} opacity={0.5} />,
          );
          elements.push(
            <line key={`inner-col-line-${panelIndex}-${c}`}
              x1={colLeft} y1={dimY} x2={colRight} y2={dimY}
              stroke={INNER_DIM_COLOR} strokeWidth={innerStrokeW}
              strokeDasharray="1.5,1.5"
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />,
          );
          elements.push(
            <text key={`inner-col-label-${panelIndex}-${c}`}
              x={colMidX} y={dimY + 7}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={INNER_DIM_FONT - 1} fill={INNER_DIM_COLOR} fontWeight={700}>
              {colRealWidth}
            </text>,
          );
        }
      }

      // Pane row heights (right side)
      if (horizontalCount > 1) {
        const dimX = panelRight + 10;

        for (let r = 0; r < horizontalCount; r++) {
          // Skip row dim if all columns in this row are removed
          if (rs.length > 0) {
            const allColsRemoved = Array.from({ length: verticalCount }, (_, ci) =>
              isSectionRemoved(rs, panelIndex, r, ci),
            ).every(Boolean);
            if (allColsRemoved) continue;
          }
          const rowTFrac = getRowTopFrac(panelDivisionHeights, panelIndex, r, horizontalCount);
          const rowBFrac = getRowBottomFrac(panelDivisionHeights, panelIndex, r, horizontalCount);
          const rowTop = panelTopY + rowTFrac * panelH;
          const rowBottom = panelTopY + rowBFrac * panelH;
          const rowMidY = (rowTop + rowBottom) / 2;
          const rowRealH = getRowRealHeight(panelDivisionHeights, panelIndex, r, horizontalCount, height);

          elements.push(
            <line key={`inner-row-ext-t-${panelIndex}-${r}`}
              x1={dimX - 3} y1={rowTop} x2={dimX + 3} y2={rowTop}
              stroke={INNER_DIM_COLOR} strokeWidth={0.4} opacity={0.5} />,
            <line key={`inner-row-ext-b-${panelIndex}-${r}`}
              x1={dimX - 3} y1={rowBottom} x2={dimX + 3} y2={rowBottom}
              stroke={INNER_DIM_COLOR} strokeWidth={0.4} opacity={0.5} />,
          );
          elements.push(
            <line key={`inner-row-line-${panelIndex}-${r}`}
              x1={dimX} y1={rowTop} x2={dimX} y2={rowBottom}
              stroke={INNER_DIM_COLOR} strokeWidth={innerStrokeW}
              strokeDasharray="1.5,1.5"
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />,
          );
          if (editingDim?.key !== `rh-${panelIndex}-${r}`) {
            const pi = panelIndex;
            const ri = r;
            elements.push(
              <text key={`inner-row-label-${panelIndex}-${r}`}
                x={dimX + 7} y={rowMidY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={INNER_DIM_FONT - 1} fill={INNER_DIM_COLOR} fontWeight={700}
                transform={`rotate(-90, ${dimX + 7}, ${rowMidY})`}
                style={{ cursor: onRowHeightChange ? 'pointer' : undefined }}
                onDoubleClick={(e) => {
                  if (!onRowHeightChange) return;
                  e.stopPropagation();
                  setEditingDim({
                    key: `rh-${pi}-${ri}`,
                    x: dimX + 7, y: rowMidY,
                    value: rowRealH,
                    angle: -90,
                    onCommit: (v) => onRowHeightChange(pi, ri, v),
                  });
                  setEditValue(String(rowRealH));
                }}>
                {rowRealH}
              </text>,
            );
          }
        }
      }
    }
  }

  if (elements.length === 0) return null;
  return <g>{elements}</g>;
}
