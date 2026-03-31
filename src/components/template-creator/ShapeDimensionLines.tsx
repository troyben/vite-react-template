import React from 'react';
import { getShapeVertices } from '@/utils/shapeClipPath';
import type { ShapeConfig } from '@/components/product-sketch/types';

interface ShapeDimensionLinesProps {
  shape?: ShapeConfig;
  width: number;
  height: number;
  unit: string;
  panelWidths: number[];
  panels: number;
  previewWidth: number;
  previewHeight: number;
}

const OFFSET = 25;
const COLOR = '#7E88C3';
const FONT_SIZE = 11;
const MARKER_SIZE = 5;

/**
 * Calculate the perpendicular offset direction for a line segment.
 * Returns a unit normal pointing outward from the shape center.
 */
function getOutwardNormal(
  x1: number, y1: number, x2: number, y2: number,
  centerX: number, centerY: number
): { nx: number; ny: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { nx: 0, ny: -1 };
  // Two possible normals
  let nx = -dy / len;
  let ny = dx / len;
  // Pick the one pointing away from center
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const toCenter = (centerX - midX) * nx + (centerY - midY) * ny;
  if (toCenter > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { nx, ny };
}

/**
 * Calculate the real-world length of an edge given the vertex coordinates
 * in real dimensions (not pixels).
 */
function edgeLength(
  v1: { x: number; y: number },
  v2: { x: number; y: number }
): number {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

const ShapeDimensionLines: React.FC<ShapeDimensionLinesProps> = ({
  shape,
  width,
  height,
  unit,
  panelWidths,
  panels,
  previewWidth,
  previewHeight,
}) => {
  const realVertices = getShapeVertices(shape, width, height);
  const pixelVertices = getShapeVertices(shape, previewWidth, previewHeight);
  const centerX = previewWidth / 2;
  const centerY = previewHeight / 2;

  // The SVG extends around the shape to leave room for dimension lines.
  // It's positioned so the shape area starts at (margin, margin).
  const margin = OFFSET + 20; // space for dimension labels
  const svgW = previewWidth + margin * 2;
  const svgH = previewHeight + margin * 2 + 20; // extra bottom for panel widths
  const ox = margin; // shape origin x within SVG
  const oy = margin; // shape origin y within SVG

  // Build edges from consecutive vertex pairs, skipping the bottom edge
  const edges: Array<{
    px1: number; py1: number; px2: number; py2: number;
    realLen: number;
  }> = [];

  const maxY = previewHeight;
  for (let i = 0; i < pixelVertices.length; i++) {
    const j = (i + 1) % pixelVertices.length;
    const pv1 = pixelVertices[i];
    const pv2 = pixelVertices[j];
    const rv1 = realVertices[i];
    const rv2 = realVertices[j];
    // Skip the bottom edge (both endpoints at max y) — panel widths cover it
    const isBottom = Math.abs(pv1.y - maxY) < 2 && Math.abs(pv2.y - maxY) < 2;
    if (isBottom) continue;
    edges.push({
      px1: pv1.x, py1: pv1.y,
      px2: pv2.x, py2: pv2.y,
      realLen: edgeLength(rv1, rv2),
    });
  }

  // Panel width annotations along the bottom — single line showing total or per-panel widths
  const panelAnnotations: React.ReactNode[] = [];
  if (panels > 0 && panelWidths.length > 0) {
    const total = panelWidths.reduce((a, b) => a + b, 0);
    const bottomLineY = oy + previewHeight + OFFSET;

    if (panels === 1) {
      // Single panel — just show total width
      const startX = ox;
      const endX = ox + previewWidth;
      const midX = (startX + endX) / 2;
      panelAnnotations.push(
        <g key="panel-total">
          <line x1={startX} y1={bottomLineY - 4} x2={startX} y2={bottomLineY + 4} stroke={COLOR} strokeWidth={0.8} />
          <line x1={endX} y1={bottomLineY - 4} x2={endX} y2={bottomLineY + 4} stroke={COLOR} strokeWidth={0.8} />
          <line x1={startX + 4} y1={bottomLineY} x2={endX - 4} y2={bottomLineY}
            stroke={COLOR} strokeWidth={1}
            markerStart="url(#sdl-arrowL)" markerEnd="url(#sdl-arrowR)" />
          <text x={midX} y={bottomLineY + 14}
            textAnchor="middle" fontSize={FONT_SIZE} fill={COLOR} fontWeight={600}>
            {total} {unit}
          </text>
        </g>
      );
    } else {
      // Multiple panels — show each panel width
      let xAcc = 0;
      for (let i = 0; i < panels; i++) {
        const pw = panelWidths[i] ?? 0;
        const fraction = total > 0 ? pw / total : 1 / panels;
        const pxWidth = fraction * previewWidth;
        const startX = ox + xAcc;
        const endX = ox + xAcc + pxWidth;
        const midX = (startX + endX) / 2;
        xAcc += pxWidth;

        panelAnnotations.push(
          <g key={`panel-${i}`}>
            <line x1={startX} y1={bottomLineY - 4} x2={startX} y2={bottomLineY + 4} stroke={COLOR} strokeWidth={0.8} />
            <line x1={endX} y1={bottomLineY - 4} x2={endX} y2={bottomLineY + 4} stroke={COLOR} strokeWidth={0.8} />
            <line x1={startX + 4} y1={bottomLineY} x2={endX - 4} y2={bottomLineY}
              stroke={COLOR} strokeWidth={0.8} strokeDasharray="3,2"
              markerStart="url(#sdl-arrowL)" markerEnd="url(#sdl-arrowR)" />
            <text x={midX} y={bottomLineY + 14}
              textAnchor="middle" fontSize={FONT_SIZE - 1} fill={COLOR} fontWeight={500}>
              {pw} {unit}
            </text>
          </g>
        );
      }
    }
  }

  return (
    <svg
      width={svgW}
      height={svgH}
      style={{
        position: 'absolute',
        left: -margin,
        top: -margin,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <defs>
        <marker id="sdl-arrowL" markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE} refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M${MARKER_SIZE},0 L0,${MARKER_SIZE / 2} L${MARKER_SIZE},${MARKER_SIZE}`} fill={COLOR} />
        </marker>
        <marker id="sdl-arrowR" markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX="0" refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE}`} fill={COLOR} />
        </marker>
      </defs>

      {/* Edge dimension lines */}
      {edges.map((edge, i) => {
        const { nx, ny } = getOutwardNormal(
          edge.px1, edge.py1, edge.px2, edge.py2,
          centerX, centerY
        );
        const off = OFFSET;
        // Offset line endpoints
        const lx1 = ox + edge.px1 + nx * off;
        const ly1 = oy + edge.py1 + ny * off;
        const lx2 = ox + edge.px2 + nx * off;
        const ly2 = oy + edge.py2 + ny * off;
        // Label midpoint, slightly further out
        const labelX = (lx1 + lx2) / 2 + nx * 12;
        const labelY = (ly1 + ly2) / 2 + ny * 12;
        // Calculate rotation for the label to align with the edge
        const angle = Math.atan2(ly2 - ly1, lx2 - lx1) * (180 / Math.PI);
        // Normalize angle to be readable (not upside down)
        const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

        return (
          <g key={`edge-${i}`}>
            {/* Extension lines from shape to dimension line */}
            <line
              x1={ox + edge.px1} y1={oy + edge.py1}
              x2={lx1} y2={ly1}
              stroke={COLOR} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5}
            />
            <line
              x1={ox + edge.px2} y1={oy + edge.py2}
              x2={lx2} y2={ly2}
              stroke={COLOR} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5}
            />
            {/* Dimension line */}
            <line
              x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={COLOR} strokeWidth={1.2}
              markerStart="url(#sdl-arrowL)" markerEnd="url(#sdl-arrowR)"
            />
            {/* Label */}
            <text
              x={labelX} y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={FONT_SIZE}
              fill={COLOR}
              fontWeight={600}
              transform={`rotate(${readableAngle}, ${labelX}, ${labelY})`}
            >
              {edge.realLen} {unit}
            </text>
          </g>
        );
      })}

      {/* Arch height annotation */}
      {shape?.type === 'arch' && (
        <g>
          <line
            x1={ox + previewWidth + OFFSET + 8}
            y1={oy}
            x2={ox + previewWidth + OFFSET + 8}
            y2={oy + (shape.archHeight ?? previewHeight * 0.3) / height * previewHeight}
            stroke={COLOR} strokeWidth={1.2} strokeDasharray="4,2"
          />
          <text
            x={ox + previewWidth + OFFSET + 18}
            y={oy + ((shape.archHeight ?? previewHeight * 0.3) / height * previewHeight) / 2}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize={FONT_SIZE - 1}
            fill={COLOR}
            fontWeight={500}
          >
            Arch: {Math.round(shape.archHeight ?? height * 0.3)} {unit}
          </text>
        </g>
      )}

      {/* Panel width annotations */}
      {panelAnnotations}
    </svg>
  );
};

export default ShapeDimensionLines;
