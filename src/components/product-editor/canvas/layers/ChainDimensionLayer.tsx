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
import { DIM_COLOR, DIM_FONT, DIM_LABEL_GAP, DIM_OFFSET } from '../utils/types';
import type { ChainLayout } from '../utils/chain-projection';
import type { Chain } from '../utils/chain-model';
import { bendFromInterior, formatBend } from '../utils/chain-model';

export interface ChainDimensionProps {
  chain: Chain;
  layout: ChainLayout;
  heightMm: number;
  arrowLId: string;
  arrowRId: string;
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
  const { chain, layout, heightMm, arrowLId, arrowRId } = props;

  return (
    <g className="chain-dimensions">
      {/* Per-leg width, drawn along that leg's own slanted sill */}
      {chain.segments.map((segment, i) => {
        const corners = layout.segments[i].corners;
        const bl = corners[3];
        const br = corners[2];
        const n = outwardNormal(bl, br);
        const a = { x: bl.x + n.x * DIM_OFFSET, y: bl.y + n.y * DIM_OFFSET };
        const b = { x: br.x + n.x * DIM_OFFSET, y: br.y + n.y * DIM_OFFSET };
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const deg = labelAngle(a, b);
        return (
          <g key={`chain-dim-w-${i}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={DIM_COLOR} strokeWidth={1}
              markerStart={`url(#${arrowLId})`} markerEnd={`url(#${arrowRId})`} />
            <text
              x={mid.x} y={mid.y - DIM_LABEL_GAP}
              transform={`rotate(${deg}, ${mid.x}, ${mid.y - DIM_LABEL_GAP})`}
              fill={DIM_COLOR} fontSize={DIM_FONT} textAnchor="middle"
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
