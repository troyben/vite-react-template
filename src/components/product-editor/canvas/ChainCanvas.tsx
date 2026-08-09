// ---------------------------------------------------------------------------
// ChainCanvas: renders a corner-window chain -- two or more segments joined by
// angled aluminium posts. Owns its own <svg>, viewBox, defs, corner posts and
// segment groups so ShapeCanvas can stay untouched for the common single-unit
// case. Later tasks extend this file with chain dimensions, an angle slider,
// and an erase overlay.
// ---------------------------------------------------------------------------

import React, { useId, useCallback, useEffect, useRef, useState } from 'react';
import type { ShapeConfig } from '@/components/product-editor/types';
import type { Chain } from './utils/chain-model';
import { nudgeBend } from './utils/chain-model';
import { layoutChain } from './utils/chain-projection';
import { getGlassSvgDefs, getPrintModeRenderColors } from './utils/glass-color';
import { renderSegment } from './layers/SegmentLayers';
import { renderChainDimensions } from './layers/ChainDimensionLayer';
import { renderConnectorGhost } from './layers/ConnectorGhostLayer';
import { DIM_COLOR, MARKER_SIZE } from './utils/types';
import type { CanvasTool } from './utils/canvas-tools';
import { boundsOf, edgeAtPoint, getConnectorGhost } from './utils/connector-tool';
import { findConnectorAtPoint, getConnectorCascadeHighlight, getHighlightGeometry } from './utils/remove-tools';
import { renderToolPreview } from './layers/ToolPreviewLayer';
import ConnectorSlider from './ConnectorSlider';
import { useChainTools, type SegmentToolHandlers } from './useChainTools';
import { legAtPoint } from './utils/chain-interaction';
import type { PlacedArc } from './utils/canvas-tools';
import type { EditingDim } from './layers/DimensionLayers';
import InlineDimensionInput from './layers/InlineDimensionInput';

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
  onConnectorRemove?: (index: number) => void;
  lineOrientation?: 'horizontal' | 'vertical';
  lineTarget?: 'panel' | 'pane';
  customArcs?: PlacedArc[];
  /**
   * Canvas callbacks bound to a given leg. The chain path edits the leg under
   * the pointer, so it asks for that leg's handlers at the moment of the click
   * rather than holding one pre-bound set.
   */
  segmentTools?: (segmentIndex: number) => SegmentToolHandlers;
  /** Commit a new shared height from the chain's height label. */
  onHeightChange?: (heightMm: number) => void;
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
  onConnectorRemove,
  lineOrientation = 'horizontal',
  lineTarget = 'panel',
  customArcs,
  segmentTools,
  onHeightChange,
}) => {
  const uid = useId().replace(/:/g, '');
  const arrowLId = `chain-arrowL-${uid}`;
  const arrowRId = `chain-arrowR-${uid}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const [connectorEdge, setConnectorEdge] = useState<'left' | 'right' | null>(null);
  const [removeConnectorTarget, setRemoveConnectorTarget] = useState<number | null>(null);
  const [editingDim, setEditingDim] = useState<EditingDim | null>(null);
  const [editValue, setEditValue] = useState('');

  // Take focus when a post is selected so the arrow keys have somewhere to
  // land. Without this the shortcut depends on whatever the surrounding page
  // last focused -- which is body on the template page but the portalled popup
  // inside the quotation dialog, where the window-level fallback never sees
  // the key.
  useEffect(() => {
    if (activeConnectorIndex != null) svgRef.current?.focus({ preventScroll: true });
  }, [activeConnectorIndex]);

  const openDimEditor = (d: EditingDim) => {
    setEditingDim(d);
    setEditValue(String(d.value));
  };

  // Same commit rule as the flat canvas: a positive number applies, anything
  // else just closes the box.
  const commitDimEdit = () => {
    if (editingDim) {
      const num = parseFloat(editValue);
      if (!isNaN(num) && num > 0) editingDim.onCommit(num);
    }
    setEditingDim(null);
  };

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

  const paintOrder = layout.segments
    .slice()
    .sort((a, b) => b.depth - a.depth)
    .map((s) => s.index);

  // Handle / line / arc / erase, routed to whichever leg the pointer is over.
  const tools = useChainTools({
    chain, shape, layout, heightMm: height,
    activeTool, lineOrientation, lineTarget, customArcs, segmentTools,
  });

  /** Wrap per-leg content in that leg's transform so it lands on the leg. */
  const inLeg = (legIndex: number, key: string, content: React.ReactNode) => (
    <g key={key} transform={`matrix(${layout.segments[legIndex].matrix.join(' ')})`}>{content}</g>
  );

  return (
    <svg
      ref={svgRef}
      // Marks this subtree as owning the arrow-key shortcut, so ProductEditor's
      // window-level fallback stands down rather than nudging a second time.
      data-chain-canvas=""
      tabIndex={-1}
      viewBox={`0 0 ${layout.totalW} ${layout.totalH}`}
      style={{
        ...(svgStyle ?? { width: '100%', height: '88vh' }),
        cursor: tools.cursor,
        outline: 'none',
      }}
      onKeyDown={(e) => {
        if (activeConnectorIndex == null || !onConnectorAngleChange) return;
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        const connector = chain.connectors[activeConnectorIndex];
        if (!connector) return;
        e.preventDefault();
        onConnectorAngleChange(activeConnectorIndex, nudgeBend(connector.angle, e.key === 'ArrowUp' ? 1 : -1));
      }}
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={(e) => {
        const pt = getSVGPoint(e);
        if (!pt) return;
        if (activeTool === 'connector') {
          setConnectorEdge(edgeAtPoint(chainBounds, pt.x, pt.y));
          return;
        }
        if (activeTool === 'remove') {
          // A post under the pointer wins: erasing it takes the whole cascade,
          // so the per-leg highlight would advertise a smaller deletion than
          // the click actually performs.
          const post = findConnectorAtPoint(layout, pt.x, pt.y);
          setRemoveConnectorTarget(post);
          if (post != null) {
            tools.clearHover();
            return;
          }
        }
        tools.handlePointerMove(pt);
      }}
      onMouseLeave={() => {
        setConnectorEdge(null);
        setRemoveConnectorTarget(null);
        tools.clearHover();
      }}
      onContextMenu={(e) => {
        const pt = getSVGPoint(e);
        if (!pt) return;
        if (tools.handleContextMenu(pt)) e.preventDefault();
      }}
      onClick={(e) => {
        // Post hit-test always takes priority over tool dispatch: clicking an
        // existing corner post selects it -- or, with the erase tool active,
        // deletes the post and its cascade -- even while another tool is
        // active for placing new geometry elsewhere.
        const pt = getSVGPoint(e);
        if (pt) {
          const hitPost = findConnectorAtPoint(layout, pt.x, pt.y);
          if (hitPost != null) {
            if (activeTool === 'remove') {
              onConnectorRemove?.(hitPost);
              setRemoveConnectorTarget(null);
            } else {
              onConnectorSelect?.(hitPost);
              // Also grab focus here, not only when the selected index changes:
              // re-clicking the post that is already selected has to bring the
              // keyboard back after focus has wandered elsewhere.
              svgRef.current?.focus({ preventScroll: true });
            }
            return;
          }

          // Then the per-leg tools -- handle, line, arc, erase -- which act on
          // the leg under the pointer rather than the selected one.
          if (tools.handleToolClick(pt)) return;

          // Plain selection last, and only with no tool active: a click meant
          // for a tool should not get hijacked into re-selecting whatever leg
          // happens to be underneath the cursor.
          if (!activeTool) {
            const hitSeg = legAtPoint(layout, pt);
            if (hitSeg != null) {
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

      {/* Legs, furthest first, so a nearer leg covers a further one rather
          than the other way round on the shapes that cannot be fully
          separated by any view angle (see solveView). */}
      {paintOrder.map((i) => renderSegment({
        segment: chain.segments[i],
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

      {renderChainDimensions({
        chain, layout, heightMm: height, arrowLId, arrowRId,
        // Editing is only offered when there is somewhere to send the result.
        onEditDim: segmentTools || onHeightChange ? openDimEditor : undefined,
        onLegWidthCommit: (legIndex, widthMm) => segmentTools?.(legIndex).onWidthChange?.(widthMm),
        onPanelWidthCommit: (legIndex, panelIndex, widthMm) =>
          segmentTools?.(legIndex).onPanelWidthChange?.(panelIndex, widthMm),
        onHeightCommit: onHeightChange,
      })}

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

      {/* Tool preview -- the ghost divider, handle or arc about to be placed --
          drawn inside the hovered leg's own transform group, so the same flat
          renderer the single-unit canvas uses lands correctly on a leg that is
          sheared away from the viewer. */}
      {tools.hover && activeTool && activeTool !== 'remove' && activeTool !== 'connector' &&
        inLeg(tools.hover.legIndex, 'tool-preview', (
          <g opacity={0.3}>
            {renderToolPreview({
              activeTool,
              hoverPos: tools.hover.local,
              canvasGeo: tools.geometryFor(tools.hover.legIndex),
              frameColor: effectiveFrameColor,
              isSliding,
              lineOrientation,
              lineTarget,
              render3D,
              glassFill,
            })}
          </g>
        ))}

      {/* What the erase tool is about to remove from a leg. */}
      {activeTool === 'remove' && tools.removeTarget &&
        inLeg(tools.removeTarget.legIndex, 'remove-highlight',
          getHighlightGeometry(tools.removeTarget.item, tools.removeContextFor(tools.removeTarget.legIndex)))}

      {/* What a right-click would remove, for the non-erase tools. */}
      {activeTool && activeTool !== 'remove' && tools.sameKindTarget &&
        inLeg(tools.sameKindTarget.legIndex, 'samekind-highlight',
          getHighlightGeometry(tools.sameKindTarget.item, tools.removeContextFor(tools.sameKindTarget.legIndex)))}

      {/* Erase-tool cascade preview: the hovered post plus every segment and
          post beyond it. Rendered last so the red shading is never hidden
          behind glass, frames, or the dimension layers. */}
      {activeTool === 'remove' && removeConnectorTarget != null &&
        getConnectorCascadeHighlight(chain, layout, removeConnectorTarget)}

      {editingDim && (
        <InlineDimensionInput
          editingDim={editingDim}
          value={editValue}
          onValueChange={setEditValue}
          onCommit={commitDimEdit}
          onCancel={() => setEditingDim(null)}
        />
      )}
    </svg>
  );
};

export default ChainCanvas;
