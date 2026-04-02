// ---------------------------------------------------------------------------
// Opening indicator rendering (returns React SVG elements)
// ---------------------------------------------------------------------------

import React from 'react';

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
): React.ReactNode {
  const color = isSliding ? '#ea580c' : '#16a34a';
  const dashArray = isSliding ? '6,4' : '3,2';
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

  return (
    <g key={keyPrefix}>
      {/* Dashed lines from handle to opening-side corners */}
      <line
        x1={handleX} y1={handleY} x2={corner1X} y2={corner1Y}
        stroke={color} strokeWidth={1} strokeDasharray={dashArray}
      />
      <line
        x1={handleX} y1={handleY} x2={corner2X} y2={corner2Y}
        stroke={color} strokeWidth={1} strokeDasharray={dashArray}
      />
      {/* Simple handle — lever follows opening direction */}
      <circle cx={handleX} cy={handleY} r={1.5}
        fill="#444" stroke="none" />
      <line
        x1={handleX} y1={handleY}
        x2={handleX + (direction === 'right' ? 10 : direction === 'left' ? -10 : 0)}
        y2={handleY + (direction === 'bottom' ? 10 : direction === 'top' ? -10 : 0)}
        stroke="#444" strokeWidth={0.7} strokeLinecap="round" />
    </g>
  );
}
