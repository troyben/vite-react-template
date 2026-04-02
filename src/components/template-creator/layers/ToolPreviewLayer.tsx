// ---------------------------------------------------------------------------
// ToolPreviewLayer: renders the faded hover preview for the active canvas tool.
// Handles preview for handle placement, line splitting, and arc placement.
// ---------------------------------------------------------------------------

import React from 'react';
import type { CanvasTool } from '../utils/canvas-tools';
import type { CanvasGeometry } from '../utils/tool-interactions';
import { findPanelAtPoint, getDirectionFromPosition, computeLinePreview, computeArcPlacement } from '../utils/tool-interactions';
import { getOpeningIndicator } from '../utils/opening-indicators';

export interface ToolPreviewLayerProps {
  activeTool: CanvasTool;
  hoverPos: { x: number; y: number } | null;
  canvasGeo: CanvasGeometry;
  frameColor: string;
  isSliding: boolean;
  lineOrientation: 'horizontal' | 'vertical';
  lineTarget: 'panel' | 'pane';
}

export function renderToolPreview(props: ToolPreviewLayerProps): React.ReactNode {
  const { activeTool, hoverPos, canvasGeo, frameColor, isSliding, lineOrientation, lineTarget } = props;
  const { width, height, drawW, drawH } = canvasGeo;

  if (!hoverPos) return null;

  if (activeTool === 'handle') {
    const hit = findPanelAtPoint(canvasGeo, hoverPos.x, hoverPos.y);
    if (!hit) return null;
    if (hit.paneInfo) {
      const { paneInfo } = hit;
      const dir = getDirectionFromPosition(
        hoverPos.x, hoverPos.y,
        paneInfo.paneCx - paneInfo.paneW / 2,
        paneInfo.paneCy - paneInfo.paneH / 2,
        paneInfo.paneW, paneInfo.paneH,
      );
      return getOpeningIndicator(dir, isSliding, paneInfo.paneCx, paneInfo.paneCy, paneInfo.paneW, paneInfo.paneH, 'preview-handle');
    }
    const dir = getDirectionFromPosition(
      hoverPos.x, hoverPos.y,
      hit.panelCx - hit.panelW / 2,
      hit.panelCy - hit.panelH / 2,
      hit.panelW, hit.panelH,
    );
    return getOpeningIndicator(dir, isSliding, hit.panelCx, hit.panelCy, hit.panelW, hit.panelH, 'preview-handle');
  }

  if (activeTool === 'line') {
    const preview = computeLinePreview(canvasGeo, hoverPos.x, hoverPos.y, lineOrientation, lineTarget);
    if (!preview) return null;
    const isVert = Math.abs(preview.x1 - preview.x2) < 1;
    return (
      <g>
        <line
          x1={preview.x1} y1={preview.y1}
          x2={preview.x2} y2={preview.y2}
          stroke={frameColor} strokeWidth={1} strokeDasharray="3,2"
        />
        {isVert && preview.leftDim != null && preview.rightDim != null && (() => {
          const midY = (preview.y1 + preview.y2) / 2;
          const leftEdge = preview.x1 - (preview.leftDim / width) * drawW;
          const rightEdge = preview.x1 + (preview.rightDim / width) * drawW;
          return (
            <>
              <text x={(leftEdge + preview.x1) / 2} y={midY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill="#e040a0" fontWeight={700}>
                {preview.leftDim}
              </text>
              <text x={(preview.x1 + rightEdge) / 2} y={midY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill="#e040a0" fontWeight={700}>
                {preview.rightDim}
              </text>
            </>
          );
        })()}
        {!isVert && preview.topDim != null && preview.bottomDim != null && (() => {
          const midX = (preview.x1 + preview.x2) / 2;
          const topEdge = preview.y1 - (preview.topDim / height) * drawH;
          const bottomEdge = preview.y1 + (preview.bottomDim / height) * drawH;
          return (
            <>
              <text x={midX} y={(topEdge + preview.y1) / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill="#e040a0" fontWeight={700}>
                {preview.topDim}
              </text>
              <text x={midX} y={(preview.y1 + bottomEdge) / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill="#e040a0" fontWeight={700}>
                {preview.bottomDim}
              </text>
            </>
          );
        })()}
      </g>
    );
  }

  if (activeTool === 'arc') {
    const arc = computeArcPlacement(canvasGeo, hoverPos.x, hoverPos.y);
    if (!arc) return null;
    return (
      <path
        d={`M ${arc.cx - arc.rx} ${arc.cy} A ${arc.rx} ${arc.ry} 0 0 0 ${arc.cx + arc.rx} ${arc.cy}`}
        fill="none" stroke={frameColor} strokeWidth={1} strokeDasharray="3,2"
      />
    );
  }

  return null;
}
