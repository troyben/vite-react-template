// ---------------------------------------------------------------------------
// Glass style utilities — Glassmorphism for CSS + SVG simulation
// ---------------------------------------------------------------------------

import React from 'react';

// -- Internal helpers --------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

// -- Legacy (kept for any remaining consumers) -------------------------------

export function getGlassColor(
  glassType: string,
  frameColor: string,
  customTint?: string,
): string {
  switch (glassType) {
    case 'clear':
      return frameColor === '#C0C0C0'
        ? 'rgba(200,210,255,0.3)'
        : 'rgba(200,200,255,0.3)';
    case 'frosted':
      return 'rgba(255,255,255,0.8)';
    case 'custom-tint':
      return `${customTint || '#AEEEEE'}80`;
    default:
      return 'rgba(200,200,255,0.3)';
  }
}

// -- SVG defs (gradients + filters) ------------------------------------------

export function getGlassSvgDefs(
  glassType: string,
  uid: string,
  _frameColor: string,
  customTint?: string,
): React.ReactNode {
  const h = React.createElement;
  const frag = React.Fragment;

  // Shared noise filter builder — both clear and frosted use noise particles,
  // just at different intensities.
  function noiseFilter(id: string, freq: string, octaves: string, noiseAlpha: number, seed: string) {
    return h('filter', { id, x: '0%', y: '0%', width: '100%', height: '100%' },
      h('feTurbulence', {
        type: 'fractalNoise', baseFrequency: freq, numOctaves: octaves, seed, result: 'noise',
      }),
      h('feColorMatrix', { type: 'saturate', values: '0', in: 'noise', result: 'gray' }),
      // Extract just the alpha channel of noise at desired intensity
      h('feComponentTransfer', { in: 'gray', result: 'particles' },
        h('feFuncR', { type: 'linear', slope: '0', intercept: '1' }),
        h('feFuncG', { type: 'linear', slope: '0', intercept: '1' }),
        h('feFuncB', { type: 'linear', slope: '0', intercept: '1' }),
        h('feFuncA', { type: 'linear', slope: String(noiseAlpha), intercept: '0' }),
      ),
      // Clip particles to the shape
      h('feComposite', { in: 'particles', in2: 'SourceGraphic', operator: 'in', result: 'clipped' }),
      // Merge: original fill + particles on top
      h('feMerge', null,
        h('feMergeNode', { in: 'SourceGraphic' }),
        h('feMergeNode', { in: 'clipped' }),
      ),
    );
  }

  switch (glassType) {
    // Clear = blue-grey glassmorphism with light particles
    case 'clear':
      return h(frag, null,
        h('linearGradient', {
          id: `glass-clear-${uid}`,
          x1: '0%', y1: '0%', x2: '0%', y2: '100%',
          gradientUnits: 'objectBoundingBox',
        },
          h('stop', { offset: '0%', stopColor: 'rgba(190,200,225,0.50)' }),
          h('stop', { offset: '50%', stopColor: 'rgba(210,218,240,0.60)' }),
          h('stop', { offset: '100%', stopColor: 'rgba(195,205,230,0.50)' }),
        ),
        noiseFilter(`glass-clear-filter-${uid}`, '0.45', '3', 0.06, '1'),
      );

    // Frosted = dark shade so white particles are clearly visible
    case 'frosted':
      return h(frag, null,
        h('linearGradient', {
          id: `glass-frosted-${uid}`,
          x1: '0%', y1: '0%', x2: '0%', y2: '100%',
          gradientUnits: 'objectBoundingBox',
        },
          h('stop', { offset: '0%', stopColor: 'rgba(140,150,175,0.45)' }),
          h('stop', { offset: '50%', stopColor: 'rgba(155,165,190,0.55)' }),
          h('stop', { offset: '100%', stopColor: 'rgba(145,155,180,0.45)' }),
        ),
        noiseFilter(`glass-frosted-filter-${uid}`, '0.8', '5', 0.28, '3'),
      );

    // Custom tint = tinted glassmorphism
    case 'custom-tint': {
      const tint = customTint || '#AEEEEE';
      return h(frag, null,
        h('linearGradient', {
          id: `glass-tint-${uid}`,
          x1: '0%', y1: '0%', x2: '0%', y2: '100%',
          gradientUnits: 'objectBoundingBox',
        },
          h('stop', { offset: '0%', stopColor: hexToRgba(tint, 0.20) }),
          h('stop', { offset: '50%', stopColor: hexToRgba(tint, 0.35) }),
          h('stop', { offset: '100%', stopColor: hexToRgba(tint, 0.22) }),
        ),
        // Highlight overlay for glass shimmer
        h('linearGradient', {
          id: `glass-tint-hl-${uid}`,
          x1: '0%', y1: '0%', x2: '100%', y2: '100%',
          gradientUnits: 'objectBoundingBox',
        },
          h('stop', { offset: '0%', stopColor: 'transparent' }),
          h('stop', { offset: '40%', stopColor: 'rgba(255,255,255,0.18)' }),
          h('stop', { offset: '50%', stopColor: 'rgba(255,255,255,0.04)' }),
          h('stop', { offset: '100%', stopColor: 'transparent' }),
        ),
        noiseFilter(`glass-tint-filter-${uid}`, '0.5', '3', 0.05, '5'),
      );
    }

    default:
      return null;
  }
}

// -- SVG fill reference ------------------------------------------------------

export function getGlassSvgFill(glassType: string, uid: string): string {
  switch (glassType) {
    case 'clear':    return `url(#glass-clear-${uid})`;
    case 'frosted':  return `url(#glass-frosted-${uid})`;
    case 'custom-tint': return `url(#glass-tint-${uid})`;
    default:         return `url(#glass-clear-${uid})`;
  }
}

// -- SVG filter reference (all glass types now use a noise filter) -----------

export function getGlassSvgFilter(glassType: string, uid: string): string | undefined {
  switch (glassType) {
    case 'clear':    return `url(#glass-clear-filter-${uid})`;
    case 'frosted':  return `url(#glass-frosted-filter-${uid})`;
    case 'custom-tint': return `url(#glass-tint-filter-${uid})`;
    default:         return undefined;
  }
}

// -- SVG highlight (only custom-tint gets a second overlay polygon) ----------

export function getGlassSvgHighlight(glassType: string, uid: string): string | undefined {
  if (glassType === 'custom-tint') return `url(#glass-tint-hl-${uid})`;
  return undefined;
}

// -- CSS glassmorphism style (returns React.CSSProperties) -------------------

export function getGlassCssStyle(
  glassType: string,
  _frameColor: string,
  customTint?: string,
): React.CSSProperties {
  switch (glassType) {
    // Clear = blue-grey glassmorphism with light blur
    case 'clear':
      return {
        background: 'linear-gradient(135deg, rgba(190,200,225,0.40) 0%, rgba(210,218,240,0.50) 50%, rgba(195,205,230,0.40) 100%)',
        backdropFilter: 'blur(10px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.30), 0 1px 4px rgba(0,0,0,0.05)',
      };

    // Frosted = dark shade + heavy particles so they pop
    case 'frosted':
      return {
        background: [
          'repeating-conic-gradient(rgba(255,255,255,0.10) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px',
          'linear-gradient(135deg, rgba(140,150,175,0.40) 0%, rgba(155,165,190,0.50) 50%, rgba(145,155,180,0.40) 100%)',
        ].join(', '),
        backdropFilter: 'blur(18px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.10)',
      };

    // Custom tint = tinted glassmorphism
    case 'custom-tint': {
      const tint = customTint || '#AEEEEE';
      return {
        background: [
          `linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.15) 45%, transparent 55%)`,
          `linear-gradient(180deg, ${hexToRgba(tint, 0.20)} 0%, ${hexToRgba(tint, 0.35)} 50%, ${hexToRgba(tint, 0.22)} 100%)`,
        ].join(', '),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: `inset 0 0 0 1px ${hexToRgba(tint, 0.20)}, 0 1px 4px rgba(0,0,0,0.05)`,
      };
    }

    default:
      return { background: 'transparent' };
  }
}
