// ---------------------------------------------------------------------------
// Opening indicator rendering (returns React SVG elements)
// ---------------------------------------------------------------------------

import React from 'react';

/**
 * Render a dashed stroke as a set of short solid <line> segments. Used in
 * print mode because some SVG -> PDF converters drop `stroke-dasharray` when
 * the SVG is rasterised at a very different scale than the viewBox.
 */
function manualDashedLine(
  x1: number, y1: number, x2: number, y2: number,
  dashLen: number, gapLen: number,
  stroke: string, strokeWidth: number,
  keyPrefix: string,
): React.ReactNode[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return [];
  const ux = dx / len;
  const uy = dy / len;
  const step = dashLen + gapLen;
  const segments: React.ReactNode[] = [];
  let i = 0;
  for (let d = 0; d < len; d += step) {
    const sx = x1 + ux * d;
    const sy = y1 + uy * d;
    const ed = Math.min(d + dashLen, len);
    const ex = x1 + ux * ed;
    const ey = y1 + uy * ed;
    segments.push(
      <line
        key={`${keyPrefix}-d${i}`}
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt"
      />,
    );
    i++;
  }
  return segments;
}

/**
 * Universal window/door opening indicator:
 * - Handle (dot) on the OPPOSITE side of opening direction
 * - Two dashed lines from handle to the two corners on the opening side
 * - Forms a triangle showing the swing path
 *
 * Example: "opens right" -> handle on left edge center, lines go to top-right and bottom-right corners.
 * For sliding: same triangle but with a different color and longer dashes.
 */
export function getOpeningIndicator(
  direction: string,
  isSliding: boolean,
  panelCx: number,
  panelCy: number,
  panelW: number,
  panelH: number,
  keyPrefix: string,
  printMode: boolean = false,
): React.ReactNode {
  const color = printMode ? '#000' : (isSliding ? '#ea580c' : '#16a34a');
  // Print sketches render at ~25x reduction (a 1000mm-wide pane drawn into a
  // 40mm PDF cell) so on-screen dash sizes shrink to invisible. Scale dashes +
  // stroke to a fraction of the panel dimension so they stay legible on paper.
  const minDim = Math.max(1, Math.min(panelW, panelH));
  const dashUnit = printMode ? minDim * 0.06 : 1;
  const dashArray = printMode
    ? (isSliding ? `${dashUnit * 1.6},${dashUnit * 0.8}` : `${dashUnit},${dashUnit * 0.55}`)
    : (isSliding ? '6,4' : '3,2');
  const dashStrokeWidth = printMode ? Math.max(2.2, minDim * 0.012) : 1;
  const handleR = printMode ? Math.max(2, minDim * 0.025) : 1.5;
  const inset = 1; // small inset from panel edges

  // Panel bounding box
  const left = panelCx - panelW / 2 + inset;
  const right = panelCx + panelW / 2 - inset;
  const top = panelCy - panelH / 2 + inset;
  const bottom = panelCy + panelH / 2 - inset;

  // Handle position (opposite side) and two target corners (opening side)
  let handleX: number, handleY: number;
  let corner1X: number, corner1Y: number;
  let corner2X: number, corner2Y: number;

  switch (direction) {
    case 'right': // opens right -> handle on left, lines to right corners
      handleX = left;
      handleY = panelCy;
      corner1X = right;
      corner1Y = top;
      corner2X = right;
      corner2Y = bottom;
      break;
    case 'left': // opens left -> handle on right, lines to left corners
      handleX = right;
      handleY = panelCy;
      corner1X = left;
      corner1Y = top;
      corner2X = left;
      corner2Y = bottom;
      break;
    case 'top': // opens top -> handle on bottom, lines to top corners
      handleX = panelCx;
      handleY = bottom;
      corner1X = left;
      corner1Y = top;
      corner2X = right;
      corner2Y = top;
      break;
    case 'bottom': // opens bottom -> handle on top, lines to bottom corners
    default:
      handleX = panelCx;
      handleY = top;
      corner1X = left;
      corner1Y = bottom;
      corner2X = right;
      corner2Y = bottom;
      break;
  }

  // Dashed lines: native stroke-dasharray on screen, manual segments in print
  // mode (svg2pdf can drop dasharray when scaled aggressively).
  let dashedLines: React.ReactNode;
  if (printMode) {
    const [dashLen, gapLen] = dashArray.split(',').map((s) => parseFloat(s));
    dashedLines = (
      <>
        {manualDashedLine(handleX, handleY, corner1X, corner1Y, dashLen, gapLen, color, dashStrokeWidth, `${keyPrefix}-l1`)}
        {manualDashedLine(handleX, handleY, corner2X, corner2Y, dashLen, gapLen, color, dashStrokeWidth, `${keyPrefix}-l2`)}
      </>
    );
  } else {
    dashedLines = (
      <>
        <line
          x1={handleX} y1={handleY} x2={corner1X} y2={corner1Y}
          stroke={color} strokeWidth={dashStrokeWidth} strokeDasharray={dashArray}
        />
        <line
          x1={handleX} y1={handleY} x2={corner2X} y2={corner2Y}
          stroke={color} strokeWidth={dashStrokeWidth} strokeDasharray={dashArray}
        />
      </>
    );
  }

  return (
    <g key={keyPrefix}>
      {dashedLines}
      {/* Simple handle — lever follows opening direction */}
      <circle cx={handleX} cy={handleY} r={handleR}
        fill={printMode ? '#000' : '#444'} stroke="none" />
      <line
        x1={handleX} y1={handleY}
        x2={handleX + (direction === 'right' ? 10 : direction === 'left' ? -10 : 0)}
        y2={handleY + (direction === 'bottom' ? 10 : direction === 'top' ? -10 : 0)}
        stroke={printMode ? '#000' : '#444'} strokeWidth={printMode ? 1.4 : 0.7} strokeLinecap="round" />
    </g>
  );
}
