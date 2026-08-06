// ---------------------------------------------------------------------------
// ChainCanvas: renders a corner-window chain -- two or more segments joined by
// angled aluminium posts. Owns its own <svg>, viewBox, defs, corner posts and
// segment groups so ShapeCanvas can stay untouched for the common single-unit
// case. Later tasks extend this file with chain dimensions, an angle slider,
// and an erase overlay.
// ---------------------------------------------------------------------------

import React, { useId, useCallback, useRef, useState } from 'react';
import type { ShapeConfig } from '@/components/product-editor/types';
import type { Chain } from './utils/chain-model';
import { layoutChain } from './utils/chain-projection';
import { getGlassSvgDefs, getPrintModeRenderColors } from './utils/glass-color';
import { renderSegment } from './layers/SegmentLayers';
import { renderChainDimensions } from './layers/ChainDimensionLayer';
import { renderConnectorGhost } from './layers/ConnectorGhostLayer';
import { DIM_COLOR, MARKER_SIZE } from './utils/types';
import type { CanvasTool } from './utils/canvas-tools';
import { boundsOf, edgeAtPoint, getConnectorGhost } from './utils/connector-tool';
import ConnectorSlider from './ConnectorSlider';

export interface ChainCanvasProps {
  chain: Chain;
  /** Real shape of the root segment; attached segments always render as rectangles. */
  shape: ShapeConfig;
  height: number; // real-world height (mm), shared by every segment
  frameColor: string;
  glassType: string;
  customGlassTint?: string;
  isSliding: boolean;
  render3D: boolean;
  printMode: boolean;
  /** Index into chain.segments of the currently selected segment. */
  activeSegmentIndex?: number;
  /** Index into chain.connectors of the currently selected corner post. */
  activeConnectorIndex?: number | null;
  svgStyle?: React.CSSProperties;
  activeTool?: CanvasTool;
  onSegmentAttach?: (end: 'left' | 'right', width: number) => void;
  onSegmentSelect?: (index: number) => void;
  onConnectorSelect?: (index: number | null) => void;
  onConnectorAngleChange?: (index: number, angle: number) => void;
}

/**
 * Width of the leg whose corners reach furthest toward the given edge -- the
 * leg a newly attached segment copies its width from.
 */
function legWidthAtEdge(chain: Chain, layout: ReturnType<typeof layoutChain>, edge: 'left' | 'right'): number {
  let best = chain.segments[0];
  let bestX = edge === 'left' ? Infinity : -Infinity;
  layout.segments.forEach((s, i) => {
    const xs = s.corners.map((c) => c.x);
    const extreme = edge === 'left' ? Math.min(...xs) : Math.max(...xs);
    const isFurther = edge === 'left' ? extreme < bestX : extreme > bestX;
    if (isFurther) {
      bestX = extreme;
      best = chain.segments[i];
    }
  });
  return best.width;
}

const ChainCanvas: React.FC<ChainCanvasProps> = ({
  chain,
  shape,
  height,
  frameColor,
  glassType,
  customGlassTint,
  isSliding,
  render3D,
  printMode,
  activeSegmentIndex,
  activeConnectorIndex,
  svgStyle,
  activeTool,
  onSegmentAttach,
  onSegmentSelect,
  onConnectorSelect,
  onConnectorAngleChange,
}) => {
  const uid = useId().replace(/:/g, '');
  const arrowLId = `chain-arrowL-${uid}`;
  const arrowRId = `chain-arrowR-${uid}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const [connectorEdge, setConnectorEdge] = useState<'left' | 'right' | null>(null);

  /** Convert mouse event coords to SVG viewBox coords. */
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

  // Shared with ShapeCanvas via getPrintModeRenderColors so the flat and
  // chain paths can't silently diverge on B&W PDF print rules.
  const {
    glassFill, glassFilter, glassHighlight,
    effectiveFrameColor, effectiveFrameStroke, effectiveDividerStroke,
  } = getPrintModeRenderColors(printMode, frameColor, glassType, uid);

  const layout = layoutChain(
    chain.segments.map((s) => s.width),
    height,
    chain.connectors.map((c) => ({ angle: c.angle, postWidth: c.postWidth })),
  );

  // Overall bounding box of every leg's projected corners -- the chain
  // equivalent of the flat path's svgVerts extents.
  const chainBounds = boundsOf(layout.segments.flatMap((s) => s.corners));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${layout.totalW} ${layout.totalH}`}
      style={{
        ...(svgStyle ?? { width: '100%', height: '88vh' }),
        cursor: activeTool ? 'crosshair' : undefined,
      }}
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={(e) => {
        if (activeTool !== 'connector') return;
        const pt = getSVGPoint(e);
        if (pt) setConnectorEdge(edgeAtPoint(chainBounds, pt.x, pt.y));
      }}
      onMouseLeave={() => setConnectorEdge(null)}
      onClick={(e) => {
        // Post hit-test always takes priority over tool dispatch: clicking an
        // existing corner post selects it, even while the connector tool is
        // active for placing a new one elsewhere.
        const pt = getSVGPoint(e);
        if (pt) {
          const hitPost = layout.posts.findIndex((post) => {
            const xs = post.corners.map((p) => p.x);
            const ys = post.corners.map((p) => p.y);
            return pt.x >= Math.min(...xs) - 4 && pt.x <= Math.max(...xs) + 4
              && pt.y >= Math.min(...ys) && pt.y <= Math.max(...ys);
          });
          if (hitPost >= 0) {
            onConnectorSelect?.(hitPost);
            return;
          }

          // Leg selection comes next, but only when no tool is active: a click
          // meant for the connector tool (or any future per-leg tool) should
          // dispatch to that tool, not get hijacked into re-selecting whatever
          // leg happens to be underneath the cursor.
          if (!activeTool) {
            const inPolygon = (p: { x: number; y: number }, poly: Array<{ x: number; y: number }>) => {
              let inside = false;
              for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
                if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
              }
              return inside;
            };
            const hitSeg = layout.segments.findIndex((s) => inPolygon(pt, s.corners));
            if (hitSeg >= 0) {
              onSegmentSelect?.(hitSeg);
              onConnectorSelect?.(null);
              return;
            }
          }
        }
        if (activeTool === 'connector' && connectorEdge && onSegmentAttach) {
          onSegmentAttach(connectorEdge, legWidthAtEdge(chain, layout, connectorEdge));
          setConnectorEdge(null);
        }
      }}
    >
      <defs>
        <marker id={arrowLId} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE} refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M${MARKER_SIZE},0 L0,${MARKER_SIZE / 2} L${MARKER_SIZE},${MARKER_SIZE}`} fill={DIM_COLOR} />
        </marker>
        <marker id={arrowRId} markerWidth={MARKER_SIZE} markerHeight={MARKER_SIZE}
          refX="0" refY={MARKER_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE}`} fill={DIM_COLOR} />
        </marker>
        {getGlassSvgDefs(glassType, uid, frameColor, customGlassTint)}
      </defs>

      {/* Corner posts, drawn behind the legs */}
      {layout.posts.map((post) => (
        <polygon
          key={`post-${post.index}`}
          points={post.corners.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={effectiveFrameColor}
          stroke={effectiveFrameColor}
          strokeWidth={effectiveDividerStroke}
        />
      ))}

      {/* Legs */}
      {chain.segments.map((segment, i) => renderSegment({
        segment,
        segmentIndex: i,
        matrix: layout.segments[i].matrix,
        drawW: layout.segments[i].drawW,
        drawH: layout.drawH,
        heightMm: height,
        shape: i === chain.rootIndex ? shape : { type: 'rectangle' },
        frameColor: effectiveFrameColor,
        frameStroke: effectiveFrameStroke,
        dividerStroke: effectiveDividerStroke,
        glassFill,
        glassFilter,
        glassHighlight,
        isSliding,
        render3D,
        printMode,
        uid,
        selected: i === activeSegmentIndex,
      }))}

      {renderChainDimensions({ chain, layout, heightMm: height, arrowLId, arrowRId })}

      {/* Connector tool ghost preview */}
      {activeTool === 'connector' && connectorEdge &&
        renderConnectorGhost(getConnectorGhost(
          chainBounds,
          connectorEdge,
          legWidthAtEdge(chain, layout, connectorEdge) * layout.scale,
        ))}

      {/* Angle slider for the selected corner post */}
      {activeConnectorIndex != null && layout.posts[activeConnectorIndex] && onConnectorAngleChange && (() => {
        const post = layout.posts[activeConnectorIndex];
        const cx = post.corners.reduce((s, p) => s + p.x, 0) / 4;
        const topY = Math.min(...post.corners.map((p) => p.y));
        const botY = Math.max(...post.corners.map((p) => p.y));
        return (
          <ConnectorSlider
            x={cx}
            y={topY}
            height={botY - topY}
            angle={chain.connectors[activeConnectorIndex].angle}
            onChange={(a) => onConnectorAngleChange(activeConnectorIndex, a)}
          />
        );
      })()}
    </svg>
  );
};

export default ChainCanvas;
