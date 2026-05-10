// ---------------------------------------------------------------------------
// Black & white SVG post-processor for PDF export.
//
// PDFs are intentionally rendered in B&W: all strokes -> black, all fills ->
// white/none. The on-screen canvas is unaffected — this transform runs only
// on the SVG produced by renderToStaticMarkup right before it's handed to
// svg2pdf.js, so user color choices remain on the canvas and are surfaced as
// *text* (color names) elsewhere in the PDF.
//
// Notes on visual distinction in B&W:
//   - Opening type stays distinguishable via stroke style:
//       Fixed         -> solid (no dasharray)
//       Casement      -> solid + swing arc (existing arc element)
//       Tilt & Turn   -> dashed (preserved via stroke-dasharray)
//       Sliding       -> long dash (preserved via stroke-dasharray)
//   - Casement vs Sliding indicator dasharrays in opening-indicators.tsx
//     ('3,2' vs '6,4') are preserved.
// ---------------------------------------------------------------------------

const BLACK = '#000000';
const FRAME_GRAY = '#333333';
const GLASS_GRAY = '#bdbdbd';

// Print-visibility tuning for opening-indicator dashed triangles.
// On-screen these are stroke-width=1 with dasharray '3,2' (hinged) / '6,4'
// (sliding). On paper, 1px hairlines on tiny dashes rasterize too faintly.
// We bump stroke-width to a print-safe minimum and lengthen dashes while
// preserving the hinged-vs-sliding ratio.
const PDF_DASH_MIN_STROKE_WIDTH = 1.4;
const DASH_REMAP: Record<string, string> = {
  '3,2': '4,2', // hinged (casement / tilt&turn)
  '6,4': '8,3', // sliding
};

/** Parse a dasharray attribute into a normalized comma-separated key. */
function normalizeDasharray(value: string): string {
  return value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',');
}

/**
 * Mutates an SVG DOM tree so it renders in pure black & white while
 * preserving stroke styles (dasharray/width) that distinguish opening types.
 *
 * Rules:
 *  - All strokes that aren't already 'none' -> black.
 *  - All fills -> 'none', EXCEPT for: <text>, <tspan>, the handle dot
 *    (rendered as <circle>/<path> with non-stroke fills), and arrow markers
 *    in <defs>. These keep a black fill so dimension arrows and labels stay
 *    legible.
 *  - Inline style="fill:...; stroke:...;" attributes are normalized too.
 *  - <filter> references on fills are stripped (filters can re-introduce
 *    color from the noise/gradient defs).
 */
export function applyBlackWhiteToSvg(svg: SVGElement): void {
  // Walk all descendants (including <defs> contents — markers need to stay).
  const all = svg.querySelectorAll('*');

  // Tags whose fill should remain black (so the mark is visible in B&W).
  const KEEP_FILL_BLACK = new Set(['text', 'tspan']);

  // Inside <marker> elements, paths/polygons are arrowheads — keep black fill.
  const isInsideMarker = (el: Element): boolean => {
    let p: Element | null = el.parentElement;
    while (p) {
      if (p.tagName.toLowerCase() === 'marker') return true;
      p = p.parentElement;
    }
    return false;
  };

  // Tiny <circle> elements without stroke are typically handle dots — keep
  // them as small filled black markers so handle position is still readable.
  const isHandleDot = (el: Element): boolean => {
    if (el.tagName.toLowerCase() !== 'circle') return false;
    const r = parseFloat(el.getAttribute('r') || '0');
    return r > 0 && r <= 3;
  };

  for (const el of Array.from(all)) {
    const tag = el.tagName.toLowerCase();

    // --- stroke ---
    // Frame/divider strokes go to dark gray. Strokes already authored as black
    // (incl. manual dash segments) and any dashed-attr line stay pure black.
    const strokeAttr = el.getAttribute('stroke');
    if (strokeAttr && strokeAttr !== 'none') {
      const lowerStroke = strokeAttr.toLowerCase();
      const isAuthoredBlack =
        lowerStroke === '#000' || lowerStroke === '#000000' || lowerStroke === 'black' || lowerStroke === 'rgb(0,0,0)';
      const isDashed = el.hasAttribute('stroke-dasharray');
      el.setAttribute('stroke', (isDashed || isAuthoredBlack) ? BLACK : FRAME_GRAY);
    }

    // --- print-visibility boost for dashed opening-indicator strokes ---
    // Any element carrying a stroke-dasharray is treated as an opening
    // indicator. Bump stroke-width so it survives raster print and remap
    // the dash pattern to longer, more print-legible dashes.
    const dashAttr = el.getAttribute('stroke-dasharray');
    if (dashAttr) {
      const key = normalizeDasharray(dashAttr);
      const remapped = DASH_REMAP[key];
      if (remapped) el.setAttribute('stroke-dasharray', remapped);

      const swAttr = el.getAttribute('stroke-width');
      const sw = swAttr ? parseFloat(swAttr) : NaN;
      if (!Number.isFinite(sw) || sw < PDF_DASH_MIN_STROKE_WIDTH) {
        el.setAttribute('stroke-width', String(PDF_DASH_MIN_STROKE_WIDTH));
      }
    }

    // --- fill ---
    const fillAttr = el.getAttribute('fill');
    const keepFill = KEEP_FILL_BLACK.has(tag) || isInsideMarker(el) || isHandleDot(el);

    if (keepFill) {
      if (fillAttr && fillAttr !== 'none') el.setAttribute('fill', BLACK);
    } else {
      // Glass / panel fills become a flat light gray. White (open-air) and
      // 'none' fills stay as-is so the open half of openings reads as paper.
      if (fillAttr && fillAttr !== 'none') {
        const lower = fillAttr.toLowerCase();
        const isWhite = lower === '#fff' || lower === '#ffffff' || lower === 'white' || lower === 'rgb(255,255,255)';
        if (!isWhite) {
          el.setAttribute('fill', GLASS_GRAY);
        }
      }
    }

    // --- filter (drops glass noise/tint filters) ---
    if (el.hasAttribute('filter')) {
      el.removeAttribute('filter');
    }

    // --- inline style override ---
    const style = el.getAttribute('style');
    if (style) {
      const cleaned = style
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((decl) => {
          const [propRaw, ...rest] = decl.split(':');
          const prop = propRaw.trim().toLowerCase();
          const val = rest.join(':').trim();
          if (prop === 'fill') {
            if (keepFill) return `fill:${BLACK}`;
            if (val === 'none') return 'fill:none';
            const lower = val.toLowerCase();
            const isWhite = lower === '#fff' || lower === '#ffffff' || lower === 'white' || lower === 'rgb(255,255,255)';
            return isWhite ? 'fill:#ffffff' : `fill:${GLASS_GRAY}`;
          }
          if (prop === 'stroke') {
            if (val === 'none') return 'stroke:none';
            const isDashedEl = el.hasAttribute('stroke-dasharray');
            return `stroke:${isDashedEl ? BLACK : FRAME_GRAY}`;
          }
          if (prop === 'filter') return ''; // drop
          return `${prop}:${val}`;
        })
        .filter(Boolean)
        .join(';');
      el.setAttribute('style', cleaned);
    }
  }
}
