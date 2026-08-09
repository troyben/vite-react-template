// ---------------------------------------------------------------------------
// SegmentLayers: renders one leg of a corner-window chain inside its own
// transform group. Each segment has its own local draw space (drawW/drawH),
// so every existing flat renderer (glass, dividers, frame, openings) works
// unmodified -- it just draws into a <g transform="matrix(...)"> instead of
// the top-level SVG.
// ---------------------------------------------------------------------------

import React from 'react';
import type { ShapeConfig, Segment } from '@/components/product-editor/types';
import type { Matrix6 } from '../utils/chain-projection';
import { getRealVertices, scaleVertices, getShapePath } from '../utils/shape-path';
import { getPanelDividers, getPanelPolygonPoints, getPanelCenter } from '../utils/panels';
import { getOpeningIndicator } from '../utils/opening-indicators';
import { renderPaneGlass, renderSubdivisionLines, renderPaneOpenings } from './PaneLayers';
import type { PaneLayersProps } from './PaneLayers';

export interface SegmentRenderProps {
  segment: Segment;
  segmentIndex: number;
  matrix: Matrix6;
  /** Local draw-space width for this segment. */
  drawW: number;
  drawH: number;
  heightMm: number;
  shape: ShapeConfig;
  frameColor: string;
  frameStroke: number;
  dividerStroke: number;
  glassFill: string;
  glassFilter?: string;
  glassHighlight?: string;
  isSliding: boolean;
  render3D: boolean;
  printMode: boolean;
  /** Unique per segment, for the clipPath id. */
  uid: string;
  /** Selection outline, drawn when this segment is the active one. */
  selected: boolean;
}

export function renderSegment(props: SegmentRenderProps): React.ReactNode {
  const {
    segment, segmentIndex, matrix, drawW, drawH, heightMm, shape,
    frameColor, frameStroke, dividerStroke, glassFill, glassFilter, glassHighlight,
    isSliding, render3D, printMode, uid, selected,
  } = props;

  const widthMm = segment.width;
  const panels = segment.panels;
  const panelWidths = segment.panelWidths;
  const openingPanels = segment.openingPanels ?? [];
  const openingDirections = segment.openingDirections ?? {};

  const realVerts = getRealVertices(shape, widthMm, heightMm);
  const svgVerts = scaleVertices(realVerts, widthMm, heightMm, drawW, drawH);
  const path = getShapePath(shape, svgVerts, drawW, drawH, widthMm, heightMm);
  const dividers = getPanelDividers(shape, panels, panelWidths, svgVerts, drawW, drawH, widthMm, heightMm);
  const clipId = `seg-clip-${uid}-${segmentIndex}`;

  const paneProps: PaneLayersProps = {
    shape, panels, panelWidths, svgVerts, drawW, drawH,
    width: widthMm, height: heightMm,
    frameColor,
    panelDivisions: segment.panelDivisions,
    panelDivisionHeights: segment.panelDivisionHeights,
    panelDivisionWidths: segment.panelDivisionWidths,
    openingPanes: segment.openingPanes,
    removedSections: segment.removedSections,
    render3D, glassFill, printMode,
  };

  return (
    <g key={`segment-${segmentIndex}`} transform={`matrix(${matrix.join(' ')})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>

      {/* Glass */}
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: panels }).map((_, i) => {
          const pts = getPanelPolygonPoints(shape, i, panels, panelWidths, svgVerts, drawW, drawH, widthMm, heightMm);
          if (!pts) return null;
          if (openingPanels.includes(i) && render3D) return null;
          return (
            <React.Fragment key={`glass-${i}`}>
              <polygon points={pts} fill={glassFill} filter={glassFilter} stroke="none" />
              {glassHighlight && <polygon points={pts} fill={glassHighlight} stroke="none" />}
            </React.Fragment>
          );
        })}
        {renderPaneGlass(paneProps)}
      </g>

      {/* Panel dividers */}
      {dividers.map((d, i) => (
        <line key={`div-${i}`} x1={d.x} y1={d.topY} x2={d.x} y2={d.bottomY}
          stroke={frameColor} strokeWidth={dividerStroke} />
      ))}
      {renderSubdivisionLines(paneProps)}

      {/* Frame */}
      <path d={path} fill="none" stroke={frameColor} strokeWidth={frameStroke} strokeLinejoin="miter" />

      {/* Openings */}
      <g clipPath={`url(#${clipId})`}>
        {openingPanels.map((panelIdx) => {
          const dir = openingDirections[panelIdx];
          if (!dir) return null;
          const { cx, cy, w: pw, h: ph } = getPanelCenter(
            shape, panelIdx, panels, panelWidths, svgVerts, drawW, drawH, widthMm, heightMm,
          );
          return getOpeningIndicator(dir, isSliding, cx, cy, pw, ph, `seg-${segmentIndex}-opening-${panelIdx}`, printMode);
        })}
        {renderPaneOpenings(paneProps)}
      </g>

      {/* Selection outline */}
      {selected && (
        <path d={path} fill="none" stroke="#7c3aed" strokeWidth={2} strokeDasharray="6 4" opacity={0.9} />
      )}
    </g>
  );
}
