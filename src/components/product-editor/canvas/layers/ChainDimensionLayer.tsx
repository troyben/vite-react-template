// ---------------------------------------------------------------------------
// ChainDimensionLayer: per-leg widths, one shared height, and an angle badge
// per joint for a corner-window chain.
//
// Drawn in root SVG coordinates, not inside a segment's transform group: that
// group is a shear+scale matrix, and text inside a sheared group is sheared
// too, stretching the glyphs. Labels are instead placed with a `rotate(...)`
// transform derived from the already-projected corners -- a rotation, never a
// shear, so the type stays clean.
// ---------------------------------------------------------------------------

import React from 'react';
import type { Point } from '../utils/types';
import {
  DIM_COLOR, DIM_FONT, DIM_LABEL_GAP, DIM_OFFSET, MARKER_SIZE,
  CHAIN_INNER_DIM_OFFSET, CHAIN_INNER_LABEL_GAP, CHAIN_LEG_DIM_OFFSET, CHAIN_LEG_DIM_OFFSET_PANES,
  CHAIN_LEG_LABEL_GAP, CHAIN_PANE_DIM_OFFSET, CHAIN_PANE_LABEL_GAP, CHAIN_ROW_DIM_GAP,
} from '../utils/types';
import {
  getRowTopFrac, getRowBottomFrac, getColLeftFrac, getColRightFrac,
  getRowRealHeight, getColRealWidth,
} from '../utils/pane-fractions';

/** Panel-width dimensions are quieter than the leg's own overall width. */
const INNER_DIM_COLOR = '#9CA3C3';
const INNER_DIM_FONT = 8;
/**
 * Shortest projected span that can carry a panel-width dimension: four digits
 * at INNER_DIM_FONT plus an arrowhead at each end.
 *
 * A leg turned away from the viewer is drawn far narrower than its real width,
 * so its panel dimensions can be asked to fit in a fraction of the room the
 * flat canvas always has. Below this they collide with each other and with the
 * leg's own width, which is worse than not showing them.
 */
const MIN_INNER_DIM_SPAN = 30;

/** How far a dimension line pulls back from an end that has a neighbour. */
const DIM_END_INSET = MARKER_SIZE + 3;
import type { ChainLayout } from '../utils/chain-projection';
import type { Chain } from '../utils/chain-model';
import { bendFromInterior, formatBend } from '../utils/chain-model';
import type { EditingDim } from './DimensionLayers';

export interface ChainDimensionProps {
  chain: Chain;
  layout: ChainLayout;
  heightMm: number;
  arrowLId: string;
  arrowRId: string;
  /**
   * Open the inline editor on a label. Omitted on read-only canvases (template
   * thumbnails, the PDF), which then render plain text as before.
   */
  onEditDim?: (d: EditingDim) => void;
  /** Commit a new width for one leg. */
  onLegWidthCommit?: (legIndex: number, widthMm: number) => void;
  /** Commit a new width for one panel of one leg. */
  onPanelWidthCommit?: (legIndex: number, panelIndex: number, widthMm: number) => void;
  /** Commit a new height for one pane row of one leg. */
  onRowHeightCommit?: (legIndex: number, panelIndex: number, rowIndex: number, heightMm: number) => void;
  /** Commit a new height. Shared by every leg in the chain. */
  onHeightCommit?: (heightMm: number) => void;
}

/** Angle of a segment on screen, in degrees, normalised so text is never upside down. */
function labelAngle(a: Point, b: Point): number {
  let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  return deg;
}

/** Unit normal pointing away from the shape, for offsetting the dimension line. */
function outwardNormal(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Rotate the direction 90 degrees; positive y is down in SVG, so this points below.
  const n = { x: -dy / len, y: dx / len };
  // A leg's sill always sits below its own frame in screen space (the height
  // "drop" only ever shifts corners down, never sideways -- see runCorners),
  // so the dimension line always belongs on the +y side. The fixed +90-degree
  // rotation above only lands there when the leg runs left-to-right on screen;
  // once a chain turns enough that a leg's projected base reverses direction
  // (happens well within the 1-359 degree range this feature allows -- e.g. a
  // 3rd leg after two same-direction 90-degree turns), the raw rotation flips
  // to the wrong side and the dimension cuts into the frame instead of sitting
  // outside it. Force it downward instead of trusting the rotation's sign.
  return n.y < 0 ? { x: -n.x, y: -n.y } : n;
}

export function renderChainDimensions(props: ChainDimensionProps): React.ReactNode {
  const {
    chain, layout, heightMm, arrowLId, arrowRId,
    onEditDim, onLegWidthCommit, onPanelWidthCommit, onRowHeightCommit, onHeightCommit,
  } = props;
  // A pane column row sits between the panel widths and the leg's own width,
  // so the outer row moves out whenever any leg has one.
  const anyPaneColumns = chain.segments.some((seg) =>
    (seg.panelDivisions ?? []).some((d) => d.verticalCount > 1));
  const legDimOffset = anyPaneColumns ? CHAIN_LEG_DIM_OFFSET_PANES : CHAIN_LEG_DIM_OFFSET;
  const editable = Boolean(onEditDim);
  // Double-click to edit, the same gesture the flat canvas uses. A single
  // click has to stay free for selecting the leg underneath.
  const editProps = (open: () => void) => (editable
    ? {
      style: { cursor: 'pointer' as const },
      onDoubleClick: (e: React.MouseEvent) => { e.stopPropagation(); open(); },
    }
    : {});

  return (
    <g className="chain-dimensions">
      {/* Per-leg width, drawn along that leg's own slanted sill */}
      {chain.segments.map((segment, i) => {
        const corners = layout.segments[i].corners;
        const bl = corners[3];
        const br = corners[2];
        const n = outwardNormal(bl, br);

        // Neighbouring legs meet at a corner post, but their dimension lines
        // leave the sill at different angles and converge in front of it --
        // close enough for the two arrowheads to touch. Pull each line back
        // from the ends that have a neighbour. The outermost ends keep their
        // full reach, so the chain's extremes still read exactly.
        const len = Math.hypot(br.x - bl.x, br.y - bl.y) || 1;
        const u = { x: (br.x - bl.x) / len, y: (br.y - bl.y) / len };
        const cap = len * 0.4;
        const startInset = i > 0 ? Math.min(DIM_END_INSET, cap) : 0;
        const endInset = i < chain.segments.length - 1 ? Math.min(DIM_END_INSET, cap) : 0;

        // Everything on this sill is stacked outward along the same normal, so
        // the panel widths and the leg's own width cannot cross each other on a
        // slanted leg the way two screen-y offsets would.
        const along = (t: number, out: number) => ({
          x: bl.x + (br.x - bl.x) * t + n.x * out,
          y: bl.y + (br.y - bl.y) * t + n.y * out,
        });

        const a = {
          x: bl.x + n.x * legDimOffset + u.x * startInset,
          y: bl.y + n.y * legDimOffset + u.y * startInset,
        };
        const b = {
          x: br.x + n.x * legDimOffset - u.x * endInset,
          y: br.y + n.y * legDimOffset - u.y * endInset,
        };
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const deg = labelAngle(a, b);
        // Sit the label beyond its own line, not between line and frame: the
        // panel-width row now occupies that space.
        const label = {
          x: mid.x + n.x * CHAIN_LEG_LABEL_GAP,
          y: mid.y + n.y * CHAIN_LEG_LABEL_GAP,
        };

        // Panel widths, nearer the sill than the leg's own width.
        const widths = segment.panelWidths ?? [];
        const totalW = widths.reduce((sum, w) => sum + w, 0) || segment.width || 1;
        const panelDims: React.ReactNode[] = [];
        // All or nothing: a partial breakdown that shows one panel and hides
        // its neighbour reads as a wrong measurement rather than a missing one.
        const sillLen = Math.hypot(br.x - bl.x, br.y - bl.y);
        const shortest = widths.length
          ? Math.min(...widths.map((w) => (w / totalW) * sillLen))
          : 0;
        const roomForPanelDims = shortest >= MIN_INNER_DIM_SPAN;
        if (segment.panels > 1 && widths.length > 1 && roomForPanelDims) {
          let acc = 0;
          widths.forEach((pw, panelIndex) => {
            const t0 = acc / totalW;
            const t1 = (acc + pw) / totalW;
            acc += pw;
            // Pull the outermost panel dimensions back from a joint for the
            // same reason the leg's own width line is pulled back: the next
            // leg's row leaves at a different angle and the arrowheads meet.
            const headInset = panelIndex === 0 ? startInset : 0;
            const tailInset = panelIndex === widths.length - 1 ? endInset : 0;
            const pa0 = along(t0, CHAIN_INNER_DIM_OFFSET);
            const pb0 = along(t1, CHAIN_INNER_DIM_OFFSET);
            const pa = { x: pa0.x + u.x * headInset, y: pa0.y + u.y * headInset };
            const pb = { x: pb0.x - u.x * tailInset, y: pb0.y - u.y * tailInset };
            const pmid = along((t0 + t1) / 2, CHAIN_INNER_DIM_OFFSET + CHAIN_INNER_LABEL_GAP);
            const pdeg = labelAngle(pa, pb);
            panelDims.push(
              <g key={`chain-dim-pw-${i}-${panelIndex}`}>
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={INNER_DIM_COLOR} strokeWidth={0.6}
                  markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
                <text
                  x={pmid.x} y={pmid.y}
                  transform={`rotate(${pdeg}, ${pmid.x}, ${pmid.y})`}
                  fill={INNER_DIM_COLOR} fontSize={INNER_DIM_FONT} fontWeight={700}
                  textAnchor="middle" dominantBaseline="middle"
                  {...editProps(() => onEditDim?.({
                    key: `chain-pw-${i}-${panelIndex}`,
                    x: pmid.x, y: pmid.y, angle: pdeg,
                    value: Math.round(pw),
                    onCommit: (v) => onPanelWidthCommit?.(i, panelIndex, v),
                  }))}
                >
                  {Math.round(pw)}
                </text>
              </g>,
            );
          });
        }

        // Pane dimensions inside a subdivided panel: column widths along the
        // sill, row heights vertical. Verticals survive the projection intact,
        // so a row height can be drawn as a plain vertical line even on a leg
        // that is sheared away from the viewer.
        const paneDims: React.ReactNode[] = [];
        const tl = corners[0];
        const tr = corners[1];
        const topAt = (t: number) => ({ x: tl.x + (tr.x - tl.x) * t, y: tl.y + (tr.y - tl.y) * t });
        for (const div of segment.panelDivisions ?? []) {
          const { panelIndex, horizontalCount, verticalCount } = div;
          if (horizontalCount <= 1 && verticalCount <= 1) continue;
          const before = widths.slice(0, panelIndex).reduce((sum, w) => sum + w, 0);
          const pw = widths[panelIndex] ?? 0;
          const tLeft = before / totalW;
          const tRight = (before + pw) / totalW;

          if (verticalCount > 1) {
            for (let c = 0; c < verticalCount; c++) {
              const cl = tLeft + getColLeftFrac(segment.panelDivisionWidths, panelIndex, c, verticalCount) * (tRight - tLeft);
              const cr = tLeft + getColRightFrac(segment.panelDivisionWidths, panelIndex, c, verticalCount) * (tRight - tLeft);
              if ((cr - cl) * sillLen < MIN_INNER_DIM_SPAN) continue;
              const ca = along(cl, CHAIN_PANE_DIM_OFFSET);
              const cb = along(cr, CHAIN_PANE_DIM_OFFSET);
              const cmid = along((cl + cr) / 2, CHAIN_PANE_DIM_OFFSET + CHAIN_PANE_LABEL_GAP);
              const cdeg = labelAngle(ca, cb);
              paneDims.push(
                <g key={`chain-dim-col-${i}-${panelIndex}-${c}`}>
                  <line x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
                    stroke={INNER_DIM_COLOR} strokeWidth={0.6} strokeDasharray="1.5,1.5"
                    markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
                  <text x={cmid.x} y={cmid.y}
                    transform={`rotate(${cdeg}, ${cmid.x}, ${cmid.y})`}
                    fill={INNER_DIM_COLOR} fontSize={INNER_DIM_FONT - 1} fontWeight={700}
                    textAnchor="middle" dominantBaseline="middle">
                    {getColRealWidth(segment.panelDivisionWidths, widths, panelIndex, c, verticalCount)}
                  </text>
                </g>,
              );
            }
          }

          if (horizontalCount > 1) {
            // Row heights hang off the panel's right edge, over the glass of
            // whatever is next -- except when that edge is the leg's own end
            // and another leg is joined there, where the space belongs to the
            // corner post. Flip inside the panel instead.
            const atLegEnd = panelIndex === widths.length - 1;
            const hasNeighbourRight = i < chain.segments.length - 1;
            const inward = atLegEnd && hasNeighbourRight;
            const edgeTop = topAt(tRight);
            const edgeBottom = along(tRight, 0);
            const dimX = edgeTop.x + (inward ? -CHAIN_ROW_DIM_GAP : CHAIN_ROW_DIM_GAP);
            const labelX = dimX + (inward ? -7 : 7);
            const panelH = edgeBottom.y - edgeTop.y;
            for (let r = 0; r < horizontalCount; r++) {
              const rowTop = edgeTop.y + getRowTopFrac(segment.panelDivisionHeights, panelIndex, r, horizontalCount) * panelH;
              const rowBottom = edgeTop.y + getRowBottomFrac(segment.panelDivisionHeights, panelIndex, r, horizontalCount) * panelH;
              if (rowBottom - rowTop < MIN_INNER_DIM_SPAN) continue;
              const rowMidY = (rowTop + rowBottom) / 2;
              const realH = getRowRealHeight(segment.panelDivisionHeights, panelIndex, r, horizontalCount, heightMm);
              paneDims.push(
                <g key={`chain-dim-row-${i}-${panelIndex}-${r}`}>
                  <line x1={dimX} y1={rowTop} x2={dimX} y2={rowBottom}
                    stroke={INNER_DIM_COLOR} strokeWidth={0.6} strokeDasharray="1.5,1.5"
                    markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
                  <text x={labelX} y={rowMidY}
                    transform={`rotate(-90, ${labelX}, ${rowMidY})`}
                    fill={INNER_DIM_COLOR} fontSize={INNER_DIM_FONT - 1} fontWeight={700}
                    textAnchor="middle" dominantBaseline="middle"
                    {...editProps(() => onEditDim?.({
                      key: `chain-rh-${i}-${panelIndex}-${r}`,
                      x: labelX, y: rowMidY, angle: -90,
                      value: Math.round(realH),
                      onCommit: (v) => onRowHeightCommit?.(i, panelIndex, r, v),
                    }))}>
                    {realH}
                  </text>
                </g>,
              );
            }
          }
        }

        return (
          <g key={`chain-dim-w-${i}`}>
            {panelDims}
            {paneDims}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={DIM_COLOR} strokeWidth={1}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            <text
              x={label.x} y={label.y}
              transform={`rotate(${deg}, ${label.x}, ${label.y})`}
              fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle"
              {...editProps(() => onEditDim?.({
                key: `chain-w-${i}`,
                x: label.x, y: label.y, angle: deg,
                value: Math.round(segment.width),
                onCommit: (v) => onLegWidthCommit?.(i, v),
              }))}
            >
              {Math.round(segment.width)}
            </text>
          </g>
        );
      })}

      {/* Shared height, once, at the far left of the whole chain */}
      {(() => {
        const allCorners = layout.segments.flatMap((s) => s.corners);
        const leftMost = allCorners.reduce((best, p) => (p.x < best.x ? p : best), allCorners[0]);
        const topY = Math.min(...allCorners.filter((p) => Math.abs(p.x - leftMost.x) < 0.5).map((p) => p.y));
        const bottomY = Math.max(...allCorners.filter((p) => Math.abs(p.x - leftMost.x) < 0.5).map((p) => p.y));
        const x = leftMost.x - DIM_OFFSET;
        const midY = (topY + bottomY) / 2;
        return (
          <g key="chain-dim-h">
            <line x1={x} y1={topY} x2={x} y2={bottomY}
              stroke={DIM_COLOR} strokeWidth={1}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            <text
              x={x - DIM_LABEL_GAP} y={midY}
              transform={`rotate(-90, ${x - DIM_LABEL_GAP}, ${midY})`}
              fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle"
              {...editProps(() => onEditDim?.({
                key: 'chain-h',
                x: x - DIM_LABEL_GAP, y: midY, angle: -90,
                value: Math.round(heightMm),
                onCommit: (v) => onHeightCommit?.(v),
              }))}
            >
              {Math.round(heightMm)}
            </text>
          </g>
        );
      })()}

      {/* Angle badge at each joint */}
      {chain.connectors.map((connector, i) => {
        const post = layout.posts[i];
        if (!post) return null;
        const cx = post.corners.reduce((s, p) => s + p.x, 0) / 4;
        const topY = Math.min(...post.corners.map((p) => p.y));
        const y = topY - DIM_OFFSET * 0.6;
        return (
          <g key={`chain-angle-${i}`}>
            <rect x={cx - 20} y={y - 10} width={40} height={16} rx={8}
              fill="#ffffff" stroke={DIM_COLOR} strokeWidth={1} />
            <text x={cx} y={y + 2} fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle">
              {formatBend(bendFromInterior(connector.angle))}
            </text>
          </g>
        );
      })}
    </g>
  );
}
