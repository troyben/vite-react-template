// ---------------------------------------------------------------------------
// 3D side-view cutaway opening indicators (interior view).
// Renders fully INSIDE panel bounds to avoid clipping by canvas overflow.
// Hinged: cross-section wedge of door swung partially open with depth taper.
// Sliding: contained slid-panel quad with depth strip + slide arrow.
// Fill matches the panel glass colour; border darkened for visibility.
// ---------------------------------------------------------------------------

import React from 'react';

const HANDLE_COLOR = '#111';
const STROKE_WIDTH = 1.8;

const WEDGE_DEPTH = 0.55;   // free edge sits at this fraction across panel
const TAPER = 0.08;         // foreshortening taper of free edge (fraction of perpendicular dimension)
const INSET = 1;            // small inset from panel border

function renderHingedSideView(
  direction: string,
  left: number, right: number, top: number, bottom: number,
  pw: number, ph: number,
  keyPrefix: string,
  glassFill: string,
  frameColor: string,
): React.ReactNode {
  const l = left + INSET;
  const r = right - INSET;
  const t = top + INSET;
  const b = bottom - INSET;
  const ipw = r - l;
  const iph = b - t;

  let hinge: { x1: number; y1: number; x2: number; y2: number };
  let polygon: string;
  let diag1: { x1: number; y1: number; x2: number; y2: number };
  let diag2: { x1: number; y1: number; x2: number; y2: number };
  let handleX: number;
  let handleY: number;

  switch (direction) {
    case 'right': {
      const fx = r - ipw * WEDGE_DEPTH;
      const taper = iph * TAPER;
      hinge = { x1: r, y1: t, x2: r, y2: b };
      polygon = `${r},${t} ${fx},${t + taper} ${fx},${b - taper} ${r},${b}`;
      diag1 = { x1: r, y1: t, x2: fx, y2: t + taper };
      diag2 = { x1: r, y1: b, x2: fx, y2: b - taper };
      handleX = fx;
      handleY = (t + b) / 2;
      break;
    }
    case 'left': {
      const fx = l + ipw * WEDGE_DEPTH;
      const taper = iph * TAPER;
      hinge = { x1: l, y1: t, x2: l, y2: b };
      polygon = `${l},${t} ${fx},${t + taper} ${fx},${b - taper} ${l},${b}`;
      diag1 = { x1: l, y1: t, x2: fx, y2: t + taper };
      diag2 = { x1: l, y1: b, x2: fx, y2: b - taper };
      handleX = fx;
      handleY = (t + b) / 2;
      break;
    }
    case 'top': {
      const fy = t + iph * WEDGE_DEPTH;
      const taper = ipw * TAPER;
      hinge = { x1: l, y1: t, x2: r, y2: t };
      polygon = `${l},${t} ${l + taper},${fy} ${r - taper},${fy} ${r},${t}`;
      diag1 = { x1: l, y1: t, x2: l + taper, y2: fy };
      diag2 = { x1: r, y1: t, x2: r - taper, y2: fy };
      handleX = (l + r) / 2;
      handleY = fy;
      break;
    }
    case 'bottom':
    default: {
      const fy = b - iph * WEDGE_DEPTH;
      const taper = ipw * TAPER;
      hinge = { x1: l, y1: b, x2: r, y2: b };
      polygon = `${l},${b} ${l + taper},${fy} ${r - taper},${fy} ${r},${b}`;
      diag1 = { x1: l, y1: b, x2: l + taper, y2: fy };
      diag2 = { x1: r, y1: b, x2: r - taper, y2: fy };
      handleX = (l + r) / 2;
      handleY = fy;
      break;
    }
  }

  // Open-air rect: portion of pane NOT covered by wedge, painted white to clear
  // any glass fill beneath so the open part reads as air.
  let openHalf = '';
  switch (direction) {
    case 'right': {
      const fx = r - ipw * WEDGE_DEPTH;
      openHalf = `${l},${t} ${fx},${t} ${fx},${b} ${l},${b}`;
      break;
    }
    case 'left': {
      const fx = l + ipw * WEDGE_DEPTH;
      openHalf = `${fx},${t} ${r},${t} ${r},${b} ${fx},${b}`;
      break;
    }
    case 'top': {
      const fy = t + iph * WEDGE_DEPTH;
      openHalf = `${l},${fy} ${r},${fy} ${r},${b} ${l},${b}`;
      break;
    }
    case 'bottom':
    default: {
      const fy = b - iph * WEDGE_DEPTH;
      openHalf = `${l},${t} ${r},${t} ${r},${fy} ${l},${fy}`;
      break;
    }
  }

  return (
    <g key={keyPrefix}>
      <polygon points={openHalf} fill="#ffffff" stroke="none" />
      {/* Wedge fill — glass colour */}
      <polygon points={polygon} fill={glassFill} stroke="none" />
      {/* Slanted swing lines + free-edge frame (where the handle sits). Hinge
          side intentionally not stroked here — covered by hinge stripe below. */}
      <line x1={diag1.x1} y1={diag1.y1} x2={diag1.x2} y2={diag1.y2}
        stroke={frameColor} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <line x1={diag1.x2} y1={diag1.y2} x2={diag2.x2} y2={diag2.y2}
        stroke={frameColor} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <line x1={diag2.x1} y1={diag2.y1} x2={diag2.x2} y2={diag2.y2}
        stroke={frameColor} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      {/* Thick hinge stripe */}
      <line
        x1={hinge.x1} y1={hinge.y1} x2={hinge.x2} y2={hinge.y2}
        stroke={frameColor}
        strokeWidth={STROKE_WIDTH + 1.2}
        strokeLinecap="round"
      />
      <circle cx={hinge.x1} cy={hinge.y1} r={1.4} fill={frameColor} />
      <circle cx={hinge.x2} cy={hinge.y2} r={1.4} fill={frameColor} />
    </g>
  );
}

function renderSlidingSideView(
  direction: string,
  left: number, right: number, top: number, bottom: number,
  pw: number, ph: number,
  keyPrefix: string,
  glassFill: string,
  frameColor: string,
): React.ReactNode {
  // Contained sliding indicator: half-panel shifted in slide direction with
  // depth strip showing it sits in front of the frame; arrow shows direction.
  const l = left + INSET;
  const r = right - INSET;
  const t = top + INSET;
  const b = bottom - INSET;
  const ipw = r - l;
  const iph = b - t;

  // Slid leaf covers half the pane on the side OPPOSITE the handle (= same as
  // direction value), full perpendicular dimension, recessed inward.
  const inset = Math.min(ipw, iph) * 0.015;
  let fx0: number, fx1: number, fy0: number, fy1: number;
  let handleX: number, handleY: number;
  switch (direction) {
    case 'right':
      // Slides RIGHT — leaf covers RIGHT half. Handle on LEFT (frame-side) edge.
      fx0 = l + ipw * 0.5; fx1 = r - inset;
      fy0 = t + inset; fy1 = b - inset;
      handleX = fx0 + ipw * 0.04; handleY = (fy0 + fy1) / 2;
      break;
    case 'left':
      fx0 = l + inset; fx1 = l + ipw * 0.5;
      fy0 = t + inset; fy1 = b - inset;
      handleX = fx1 - ipw * 0.04; handleY = (fy0 + fy1) / 2;
      break;
    case 'top':
      fy0 = t + inset; fy1 = t + iph * 0.5;
      fx0 = l + inset; fx1 = r - inset;
      handleX = (fx0 + fx1) / 2; handleY = fy1 - iph * 0.04;
      break;
    case 'bottom':
    default:
      fy0 = t + iph * 0.5; fy1 = b - inset;
      fx0 = l + inset; fx1 = r - inset;
      handleX = (fx0 + fx1) / 2; handleY = fy0 + iph * 0.04;
      break;
  }

  const front = `${fx0},${fy0} ${fx1},${fy0} ${fx1},${fy1} ${fx0},${fy1}`;
  // Recessed depth strips on top + frame-adjacent edge of slid leaf.
  const topStrip = `${fx0 - inset},${fy0 - inset} ${fx1 + inset},${fy0 - inset} ${fx1},${fy0} ${fx0},${fy0}`;
  const leftStrip = `${fx0 - inset},${fy0 - inset} ${fx0},${fy0} ${fx0},${fy1} ${fx0 - inset},${fy1 + inset}`;

  // Slide arrow centered in front face.
  const acx = (fx0 + fx1) / 2;
  const acy = (fy0 + fy1) / 2;
  const arrowSize = Math.min(ipw, iph) * 0.14;
  const head = Math.max(2.2, arrowSize * 0.35);
  // Arrow points toward direction value (where handle / slide motion points).
  let arrowPath = '';
  if (direction === 'right') {
    arrowPath = `M ${acx - arrowSize} ${acy} L ${acx + arrowSize} ${acy} M ${acx + arrowSize - head} ${acy - head} L ${acx + arrowSize} ${acy} L ${acx + arrowSize - head} ${acy + head}`;
  } else if (direction === 'left') {
    arrowPath = `M ${acx + arrowSize} ${acy} L ${acx - arrowSize} ${acy} M ${acx - arrowSize + head} ${acy - head} L ${acx - arrowSize} ${acy} L ${acx - arrowSize + head} ${acy + head}`;
  } else if (direction === 'top') {
    arrowPath = `M ${acx} ${acy + arrowSize} L ${acx} ${acy - arrowSize} M ${acx - head} ${acy - arrowSize + head} L ${acx} ${acy - arrowSize} L ${acx + head} ${acy - arrowSize + head}`;
  } else {
    arrowPath = `M ${acx} ${acy - arrowSize} L ${acx} ${acy + arrowSize} M ${acx - head} ${acy + arrowSize - head} L ${acx} ${acy + arrowSize} L ${acx + head} ${acy + arrowSize - head}`;
  }

  // Open-half rect — paint white to clear any panel glass beneath the open
  // portion so it reads as actual air, not tinted glass.
  let openHalf = '';
  switch (direction) {
    case 'right':
      openHalf = `${l},${t} ${l + ipw * 0.5},${t} ${l + ipw * 0.5},${b} ${l},${b}`;
      break;
    case 'left':
      openHalf = `${l + ipw * 0.5},${t} ${r},${t} ${r},${b} ${l + ipw * 0.5},${b}`;
      break;
    case 'top':
      openHalf = `${l},${t + iph * 0.5} ${r},${t + iph * 0.5} ${r},${b} ${l},${b}`;
      break;
    case 'bottom':
    default:
      openHalf = `${l},${t} ${r},${t} ${r},${t + iph * 0.5} ${l},${t + iph * 0.5}`;
      break;
  }

  return (
    <g key={keyPrefix}>
      <polygon points={openHalf} fill="#ffffff" stroke="none" />
      {/* Recessed depth strips (top + left) */}
      <polygon points={topStrip} fill={glassFill} stroke={frameColor} strokeWidth={STROKE_WIDTH * 0.6} opacity={0.65} />
      <polygon points={leftStrip} fill={glassFill} stroke={frameColor} strokeWidth={STROKE_WIDTH * 0.6} opacity={0.65} />
      {/* Inset front face (sliding leaf) */}
      <polygon points={front} fill={glassFill} stroke={frameColor} strokeWidth={STROKE_WIDTH} />
      <path d={arrowPath} stroke={frameColor} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/**
 * Bounding box for the active leaf area in 3D mode. Used to anchor the 2D
 * dashed indicator + handle to the 50% inner edge of the leaf rather than the
 * far panel edge.
 *  - Sliding: half the pane on the slide-direction side.
 *  - Hinged: WEDGE_DEPTH fraction of the pane on the hinge side.
 */
export function getOpening3DLeafBounds(
  direction: string,
  isSliding: boolean,
  panelCx: number,
  panelCy: number,
  panelW: number,
  panelH: number,
): { cx: number; cy: number; w: number; h: number } {
  const left = panelCx - panelW / 2;
  const right = panelCx + panelW / 2;
  const top = panelCy - panelH / 2;
  const bottom = panelCy + panelH / 2;

  if (isSliding) {
    // Leaf occupies half the pane on the direction-value side.
    if (direction === 'right') {
      return { cx: (left + panelW * 0.5 + right) / 2, cy: panelCy, w: panelW * 0.5, h: panelH };
    }
    if (direction === 'left') {
      return { cx: (left + (left + panelW * 0.5)) / 2, cy: panelCy, w: panelW * 0.5, h: panelH };
    }
    if (direction === 'top') {
      return { cx: panelCx, cy: (top + (top + panelH * 0.5)) / 2, w: panelW, h: panelH * 0.5 };
    }
    return { cx: panelCx, cy: ((top + panelH * 0.5) + bottom) / 2, w: panelW, h: panelH * 0.5 };
  }

  // Hinged — wedge fraction of pane on hinge (direction-value) side.
  const frac = WEDGE_DEPTH;
  if (direction === 'right') {
    const fx = right - panelW * frac;
    return { cx: (fx + right) / 2, cy: panelCy, w: panelW * frac, h: panelH };
  }
  if (direction === 'left') {
    const fx = left + panelW * frac;
    return { cx: (left + fx) / 2, cy: panelCy, w: panelW * frac, h: panelH };
  }
  if (direction === 'top') {
    const fy = top + panelH * frac;
    return { cx: panelCx, cy: (top + fy) / 2, w: panelW, h: panelH * frac };
  }
  const fy = bottom - panelH * frac;
  return { cx: panelCx, cy: (fy + bottom) / 2, w: panelW, h: panelH * frac };
}

export function getOpening3D(
  direction: string,
  isSliding: boolean,
  panelCx: number,
  panelCy: number,
  panelW: number,
  panelH: number,
  keyPrefix: string,
  glassFill: string = '#cfd8ec',
  frameColor: string = '#1f2937',
): React.ReactNode {
  const left = panelCx - panelW / 2;
  const right = panelCx + panelW / 2;
  const top = panelCy - panelH / 2;
  const bottom = panelCy + panelH / 2;
  if (isSliding) {
    return renderSlidingSideView(direction, left, right, top, bottom, panelW, panelH, keyPrefix, glassFill, frameColor);
  }
  return renderHingedSideView(direction, left, right, top, bottom, panelW, panelH, keyPrefix, glassFill, frameColor);
}
