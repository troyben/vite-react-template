// ---------------------------------------------------------------------------
// ChainCanvas: renders a corner-window chain -- two or more segments joined by
// angled aluminium posts. Owns its own <svg>, viewBox, defs, corner posts and
// segment groups so ShapeCanvas can stay untouched for the common single-unit
// case. Later tasks extend this file with chain dimensions, an angle slider,
// and an erase overlay.
// ---------------------------------------------------------------------------

import React, { useId } from 'react';
import type { ShapeConfig } from '@/components/product-editor/types';
import type { Chain } from './utils/chain-model';
import { layoutChain } from './utils/chain-projection';
import { getGlassSvgDefs, getPrintModeRenderColors } from './utils/glass-color';
import { renderSegment } from './layers/SegmentLayers';

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
  svgStyle?: React.CSSProperties;
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
  svgStyle,
}) => {
  const uid = useId().replace(/:/g, '');

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

  return (
    <svg
      viewBox={`0 0 ${layout.totalW} ${layout.totalH}`}
      style={svgStyle ?? { width: '100%', height: '88vh' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>{getGlassSvgDefs(glassType, uid, frameColor, customGlassTint)}</defs>

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
    </svg>
  );
};

export default ChainCanvas;
