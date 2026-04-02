// ---------------------------------------------------------------------------
// Section removal: outline computation, validation, and helpers
// ---------------------------------------------------------------------------

import { MARGIN } from './types';
import { getTopYAtX, getBottomYAtX } from './boundaries';
import type { ShapeConfig } from '@/components/product-sketch/types';
import type { Point } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectionId {
  panelIndex: number;
  rowIndex: number;
  colIndex: number;
}

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isSectionRemoved(
  removed: SectionId[],
  pi: number,
  ri: number,
  ci: number,
): boolean {
  return removed.some(
    (s) => s.panelIndex === pi && s.rowIndex === ri && s.colIndex === ci,
  );
}

function rd(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Cell rectangle computation (draw-space coordinates)
// ---------------------------------------------------------------------------

export function computeCellRects(
  panels: number,
  panelWidths: number[],
  panelDivisions: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }> | undefined,
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }> | undefined,
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }> | undefined,
  totalWidth: number,
  totalHeight: number,
  drawW: number,
  drawH: number,
  shape: ShapeConfig,
  svgVerts: Point[],
): Map<string, Rect> {
  const result = new Map<string, Rect>();
  const widthSum = panelWidths.reduce((a, b) => a + b, 0) || totalWidth;

  let accW = 0;
  for (let pi = 0; pi < panels; pi++) {
    const pw = panelWidths[pi] ?? totalWidth / panels;
    const div = panelDivisions?.find((d) => d.panelIndex === pi);
    const rows = div?.horizontalCount ?? 1;
    const cols = div?.verticalCount ?? 1;
    const divH = panelDivisionHeights?.find((h) => h.panelIndex === pi);
    const divW = panelDivisionWidths?.find((w) => w.panelIndex === pi);

    let accCW = 0;
    for (let ci = 0; ci < cols; ci++) {
      const cw = divW?.colWidths?.[ci] ?? pw / cols;

      let accRH = 0;
      for (let ri = 0; ri < rows; ri++) {
        const rh = divH?.rowHeights?.[ri] ?? totalHeight / rows;

        const x0 = rd(MARGIN + ((accW + accCW) / widthSum) * drawW);
        const x1 = rd(MARGIN + ((accW + accCW + cw) / widthSum) * drawW);

        // Use shape boundary for top/bottom edges
        const midX = (x0 + x1) / 2;
        const shapeTop = getTopYAtX(midX, svgVerts, shape, drawW, drawH, totalWidth, totalHeight);
        const shapeBot = getBottomYAtX(midX, svgVerts);
        const shapeH = shapeBot - shapeTop;

        const y0 = rd(shapeTop + (accRH / totalHeight) * shapeH);
        const y1 = rd(shapeTop + ((accRH + rh) / totalHeight) * shapeH);

        result.set(`${pi}-${ri}-${ci}`, { x0, y0, x1, y1 });
        accRH += rh;
      }
      accCW += cw;
    }
    accW += pw;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Micro-grid via coordinate compression
// ---------------------------------------------------------------------------

function buildMicroGrid(
  cellRects: Map<string, Rect>,
  removedSet: Set<string>,
): { grid: boolean[][]; xs: number[]; ys: number[] } {
  const xSet = new Set<number>();
  const ySet = new Set<number>();

  for (const r of cellRects.values()) {
    xSet.add(r.x0);
    xSet.add(r.x1);
    ySet.add(r.y0);
    ySet.add(r.y1);
  }

  const xs = Array.from(xSet).sort((a, b) => a - b);
  const ys = Array.from(ySet).sort((a, b) => a - b);

  const rows = ys.length - 1;
  const cols = xs.length - 1;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );

  for (const [key, rect] of cellRects) {
    if (removedSet.has(key)) continue;

    // Find micro-cell range this cell covers
    const x0i = xs.findIndex((v) => Math.abs(v - rect.x0) < 0.1);
    const x1i = xs.findIndex((v) => Math.abs(v - rect.x1) < 0.1);
    const y0i = ys.findIndex((v) => Math.abs(v - rect.y0) < 0.1);
    const y1i = ys.findIndex((v) => Math.abs(v - rect.y1) < 0.1);

    if (x0i < 0 || x1i < 0 || y0i < 0 || y1i < 0) continue;

    for (let r = y0i; r < y1i; r++) {
      for (let c = x0i; c < x1i; c++) {
        grid[r][c] = true;
      }
    }
  }

  return { grid, xs, ys };
}

// ---------------------------------------------------------------------------
// Boundary tracing on a micro-grid → SVG path
// ---------------------------------------------------------------------------

function traceBoundary(
  grid: boolean[][],
  xs: number[],
  ys: number[],
): string {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return '';

  const isPresent = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c];

  // Collect directed boundary edges (clockwise around present cells).
  // Edge: from vertex (fromC, fromR) to vertex (toC, toR) in grid-vertex space.
  // Grid-vertex (c, r) maps to SVG point (xs[c], ys[r]).
  interface Edge {
    toC: number;
    toR: number;
    dx: number;
    dy: number;
  }

  const edgesByStart = new Map<string, Edge[]>();
  const vKey = (c: number, r: number) => `${c},${r}`;

  const addEdge = (
    fc: number,
    fr: number,
    tc: number,
    tr: number,
  ) => {
    const key = vKey(fc, fr);
    if (!edgesByStart.has(key)) edgesByStart.set(key, []);
    edgesByStart.get(key)!.push({ toC: tc, toR: tr, dx: tc - fc, dy: tr - fr });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      if (!isPresent(r - 1, c)) addEdge(c, r, c + 1, r); // Top → right
      if (!isPresent(r, c + 1)) addEdge(c + 1, r, c + 1, r + 1); // Right → down
      if (!isPresent(r + 1, c)) addEdge(c + 1, r + 1, c, r + 1); // Bottom → left
      if (!isPresent(r, c - 1)) addEdge(c, r + 1, c, r); // Left → up
    }
  }

  if (edgesByStart.size === 0) return '';

  // Find starting vertex: topmost row, then leftmost column
  let startC = 0,
    startR = 0;
  let bestY = Infinity,
    bestX = Infinity;
  for (const key of edgesByStart.keys()) {
    const [c, r] = key.split(',').map(Number);
    const sy = ys[r],
      sx = xs[c];
    if (sy < bestY || (sy === bestY && sx < bestX)) {
      bestY = sy;
      bestX = sx;
      startC = c;
      startR = r;
    }
  }

  // Walk the boundary using right-hand rule (clockwise)
  const path: string[] = [`M ${xs[startC]} ${ys[startR]}`];
  let curC = startC,
    curR = startR;
  // Initial direction: going right (top edge of topmost-leftmost cell)
  let prevDx = 1,
    prevDy = 0;
  const visitedEdges = new Set<string>();
  let steps = 0;
  const maxSteps = edgesByStart.size * 4; // safety limit

  while (steps++ < maxSteps) {
    const edges = edgesByStart.get(vKey(curC, curR));
    if (!edges || edges.length === 0) break;

    // CW rotation in screen-space (y-down): (dx,dy) → (-dy, dx)
    const rotations = [
      { dx: -prevDy, dy: prevDx }, // Right turn (CW 90°)
      { dx: prevDx, dy: prevDy }, // Straight
      { dx: prevDy, dy: -prevDx }, // Left turn (CCW 90°)
      { dx: -prevDx, dy: -prevDy }, // U-turn
    ];

    let chosen: Edge | null = null;
    for (const rot of rotations) {
      const match = edges.find(
        (e) => e.dx === rot.dx && e.dy === rot.dy,
      );
      if (match) {
        const eKey = `${curC},${curR}->${match.toC},${match.toR}`;
        if (!visitedEdges.has(eKey)) {
          chosen = match;
          visitedEdges.add(eKey);
          break;
        }
      }
    }

    if (!chosen) break;

    path.push(`L ${xs[chosen.toC]} ${ys[chosen.toR]}`);
    prevDx = chosen.dx;
    prevDy = chosen.dy;
    curC = chosen.toC;
    curR = chosen.toR;

    if (curC === startC && curR === startR) break;
  }

  path.push('Z');
  return path.join(' ');
}

// ---------------------------------------------------------------------------
// Main entry: compute section outline SVG path
// ---------------------------------------------------------------------------

export function computeSectionOutlinePath(
  panels: number,
  panelWidths: number[],
  panelDivisions: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }> | undefined,
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }> | undefined,
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }> | undefined,
  totalWidth: number,
  totalHeight: number,
  drawW: number,
  drawH: number,
  shape: ShapeConfig,
  svgVerts: Point[],
  removedSections: SectionId[],
): string | null {
  if (removedSections.length === 0) return null;

  const cellRects = computeCellRects(
    panels,
    panelWidths,
    panelDivisions,
    panelDivisionHeights,
    panelDivisionWidths,
    totalWidth,
    totalHeight,
    drawW,
    drawH,
    shape,
    svgVerts,
  );

  const removedSet = new Set(
    removedSections.map((s) => `${s.panelIndex}-${s.rowIndex}-${s.colIndex}`),
  );

  const { grid, xs, ys } = buildMicroGrid(cellRects, removedSet);
  return traceBoundary(grid, xs, ys);
}

// ---------------------------------------------------------------------------
// Validation: contiguity + minimum count
// ---------------------------------------------------------------------------

export function validateRemoval(
  panels: number,
  panelDivisions: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }> | undefined,
  currentRemoved: SectionId[],
  proposed: SectionId,
  openingPanels: number[],
  openingPanes?: Array<{ panelIndex: number; rowIndex: number; colIndex: number }>,
): boolean {
  // Check if target section has an opening on it
  const hasOpening =
    openingPanels.includes(proposed.panelIndex) ||
    openingPanes?.some(
      (p) =>
        p.panelIndex === proposed.panelIndex &&
        p.rowIndex === proposed.rowIndex &&
        p.colIndex === proposed.colIndex,
    );
  if (hasOpening) return false;

  // Build all present cells after proposed removal
  const removedSet = new Set(
    [...currentRemoved, proposed].map(
      (s) => `${s.panelIndex}-${s.rowIndex}-${s.colIndex}`,
    ),
  );

  const present: string[] = [];
  for (let pi = 0; pi < panels; pi++) {
    const div = panelDivisions?.find((d) => d.panelIndex === pi);
    const rows = div?.horizontalCount ?? 1;
    const cols = div?.verticalCount ?? 1;
    for (let ri = 0; ri < rows; ri++) {
      for (let ci = 0; ci < cols; ci++) {
        const key = `${pi}-${ri}-${ci}`;
        if (!removedSet.has(key)) present.push(key);
      }
    }
  }

  // Must keep at least one section
  if (present.length === 0) return false;

  // Contiguity check via BFS
  const presentSet = new Set(present);
  const visited = new Set<string>();
  const queue = [present[0]];
  visited.add(present[0]);

  const getNeighborKeys = (key: string): string[] => {
    const [pi, ri, ci] = key.split('-').map(Number);
    const neighbors: string[] = [];
    const div = panelDivisions?.find((d) => d.panelIndex === pi);
    const rows = div?.horizontalCount ?? 1;
    const cols = div?.verticalCount ?? 1;

    // Same panel: adjacent row/col
    if (ri > 0) neighbors.push(`${pi}-${ri - 1}-${ci}`);
    if (ri < rows - 1) neighbors.push(`${pi}-${ri + 1}-${ci}`);
    if (ci > 0) neighbors.push(`${pi}-${ri}-${ci - 1}`);
    if (ci < cols - 1) neighbors.push(`${pi}-${ri}-${ci + 1}`);

    // Cross-panel: connect edge columns of adjacent panels
    if (ci === 0 && pi > 0) {
      const prevDiv = panelDivisions?.find((d) => d.panelIndex === pi - 1);
      const prevCols = prevDiv?.verticalCount ?? 1;
      const prevRows = prevDiv?.horizontalCount ?? 1;
      for (let pr = 0; pr < prevRows; pr++) {
        neighbors.push(`${pi - 1}-${pr}-${prevCols - 1}`);
      }
    }
    if (ci === cols - 1 && pi < panels - 1) {
      const nextDiv = panelDivisions?.find((d) => d.panelIndex === pi + 1);
      const nextRows = nextDiv?.horizontalCount ?? 1;
      for (let nr = 0; nr < nextRows; nr++) {
        neighbors.push(`${pi + 1}-${nr}-0`);
      }
    }

    return neighbors;
  };

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const n of getNeighborKeys(curr)) {
      if (presentSet.has(n) && !visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }

  return visited.size === present.length;
}

// ---------------------------------------------------------------------------
// Effective bounding dimensions (real-world mm, no SVG dependency)
// ---------------------------------------------------------------------------

/** Compute the real-world bounding width/height of remaining (non-removed) cells. */
export function computeEffectiveBounds(
  panels: number,
  panelWidths: number[],
  panelDivisions: Array<{ panelIndex: number; horizontalCount: number; verticalCount: number }> | undefined,
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }> | undefined,
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }> | undefined,
  totalHeight: number,
  removedSections: SectionId[],
): { width: number; height: number } {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  let accW = 0;
  for (let pi = 0; pi < panels; pi++) {
    const pw = panelWidths[pi] ?? 0;
    const div = panelDivisions?.find((d) => d.panelIndex === pi);
    const rows = div?.horizontalCount ?? 1;
    const cols = div?.verticalCount ?? 1;
    const divH = panelDivisionHeights?.find((h) => h.panelIndex === pi);
    const divW = panelDivisionWidths?.find((w) => w.panelIndex === pi);

    let accCW = 0;
    for (let ci = 0; ci < cols; ci++) {
      const cw = divW?.colWidths?.[ci] ?? pw / cols;
      let accRH = 0;
      for (let ri = 0; ri < rows; ri++) {
        const rh = divH?.rowHeights?.[ri] ?? totalHeight / rows;
        if (!isSectionRemoved(removedSections, pi, ri, ci)) {
          minX = Math.min(minX, accW + accCW);
          maxX = Math.max(maxX, accW + accCW + cw);
          minY = Math.min(minY, accRH);
          maxY = Math.max(maxY, accRH + rh);
        }
        accRH += rh;
      }
      accCW += cw;
    }
    accW += pw;
  }

  if (minX === Infinity) return { width: 0, height: 0 };
  return {
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

// ---------------------------------------------------------------------------
// Outline vertex utilities (for dimension recalculation)
// ---------------------------------------------------------------------------

/** Parse an SVG path string (M/L/Z only) into an array of Points. */
export function parseOutlineVertices(pathD: string): Point[] {
  const verts: Point[] = [];
  const commands = pathD.match(/[ML]\s+[\d.eE+-]+\s+[\d.eE+-]+/g);
  if (!commands) return verts;
  for (const cmd of commands) {
    const parts = cmd.trim().split(/\s+/);
    verts.push({ x: parseFloat(parts[1]), y: parseFloat(parts[2]) });
  }
  // traceBoundary emits an explicit L back to the start vertex before Z,
  // which duplicates the first point. Strip it so callers see a clean open ring.
  if (verts.length > 1) {
    const first = verts[0];
    const last = verts[verts.length - 1];
    if (Math.abs(first.x - last.x) < 0.01 && Math.abs(first.y - last.y) < 0.01) {
      verts.pop();
    }
  }
  return verts;
}

/** Convert SVG draw-space vertices to real-world mm coordinates. */
export function svgVertsToReal(
  svgOutlineVerts: Point[],
  drawW: number,
  drawH: number,
  width: number,
  height: number,
): Point[] {
  return svgOutlineVerts.map((v) => ({
    x: Math.round(((v.x - MARGIN) / drawW) * width),
    y: Math.round(((v.y - MARGIN) / drawH) * height),
  }));
}

/** Merge consecutive collinear vertices (axis-aligned segments). */
export function mergeCollinearVertices(verts: Point[]): Point[] {
  if (verts.length <= 2) return verts;
  const result: Point[] = [verts[0]];
  for (let i = 1; i < verts.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = verts[i];
    const next = verts[i + 1];
    const sameX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
    const sameY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
    if (!sameX && !sameY) result.push(curr);
  }
  result.push(verts[verts.length - 1]);
  // Check wrap-around: if last, first, second are collinear, remove the duplicate start
  if (result.length > 2) {
    const last = result[result.length - 1];
    const first = result[0];
    const second = result[1];
    const wrapX = Math.abs(last.x - first.x) < 0.5 && Math.abs(first.x - second.x) < 0.5;
    const wrapY = Math.abs(last.y - first.y) < 0.5 && Math.abs(first.y - second.y) < 0.5;
    if (wrapX || wrapY) {
      result[0] = last;
      result.pop();
    }
  }
  return result;
}
