import type { DimensionLayersProps } from './DimensionLayers';
import { MARGIN, DIM_COLOR, DIM_FONT, DIM_OFFSET, DIM_LABEL_GAP } from '../utils/types';

/** Diameter annotation, rather than dimensions on each sampled arc segment. */
export function renderCircleDimension(props: DimensionLayersProps) {
  const { width, drawW, drawH, arrowLId, arrowRId, onWidthChange,
    editingDim, setEditingDim, setEditValue } = props;
  const left = MARGIN;
  const right = MARGIN + drawW;
  const centerY = MARGIN + drawH / 2;
  const lineY = MARGIN + drawH + DIM_OFFSET;
  const labelX = MARGIN + drawW / 2;
  const labelY = lineY + DIM_LABEL_GAP;
  return (
    <g data-circle-diameter="">
      <line x1={left} y1={centerY} x2={left} y2={lineY}
        stroke={DIM_COLOR} strokeWidth={0.5} strokeDasharray="2,2" />
      <line x1={right} y1={centerY} x2={right} y2={lineY}
        stroke={DIM_COLOR} strokeWidth={0.5} strokeDasharray="2,2" />
      <line x1={left} y1={lineY} x2={right} y2={lineY} stroke={DIM_COLOR} strokeWidth={1}
        markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
      {editingDim?.key !== 'circle-diameter' && (
        <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle"
          fontSize={DIM_FONT} fill={DIM_COLOR} fontWeight={700}
          style={{ cursor: onWidthChange ? 'pointer' : undefined }}
          onDoubleClick={(e) => {
            if (!onWidthChange) return;
            e.stopPropagation();
            setEditingDim({ key: 'circle-diameter', x: labelX, y: labelY, value: width, angle: 0, onCommit: onWidthChange });
            setEditValue(String(width));
          }}>
          Ø {width}
        </text>
      )}
    </g>
  );
}
