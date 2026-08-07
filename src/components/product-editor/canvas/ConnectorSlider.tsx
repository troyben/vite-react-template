import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_BEND,
  bendFromInterior,
  formatBend,
  interiorFromBend,
} from './utils/chain-model';

export interface ConnectorSliderProps {
  x: number;
  y: number;
  height: number;
  /** Stored interior angle. The slider presents it as a signed bend. */
  angle: number;
  onChange: (angle: number) => void;
}

// Sizes are SVG user units. The chain's draw height is always BASE_DRAW_HEIGHT
// (180), so these are effectively a fixed fraction of the drawn window -- the
// handle is about a tenth of the frame's height at any zoom.
const TRACK_W = 17;
const HANDLE_W = 11;
const HANDLE_H = 15;
const MIN_TRACK_H = 90;
const DOT = 2;

/**
 * Vertical bend control anchored to a corner post: a hairline track with a
 * grip handle the user drags. Centre is 0 — the legs are inline. Dragging up
 * swings the attached leg toward the top of the screen, down toward the
 * bottom.
 *
 * Rendered in a foreignObject so the drag can work in real DOM pixels. Drag
 * maths runs against the track's client rect rather than local coordinates,
 * so it stays correct however the SVG viewBox is scaled.
 */
const ConnectorSlider: React.FC<ConnectorSliderProps> = ({ x, y, height, angle, onChange }) => {
  const trackH = Math.max(height, MIN_TRACK_H);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const bend = bendFromInterior(angle);
  // Bend +MAX_BEND sits at the top of the track, -MAX_BEND at the bottom,
  // 0 exactly halfway.
  const handleTop = ((MAX_BEND - bend) / (2 * MAX_BEND)) * (trackH - HANDLE_H);

  const emitFromClientY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const usable = rect.height - (HANDLE_H / trackH) * rect.height;
    if (usable <= 0) return;
    const offset = clientY - rect.top - ((HANDLE_H / trackH) * rect.height) / 2;
    const fraction = Math.min(1, Math.max(0, offset / usable));
    onChange(interiorFromBend(Math.round(MAX_BEND - fraction * 2 * MAX_BEND)));
  }, [onChange, trackH]);

  // Track the pointer on window so a fast drag that leaves the handle keeps
  // working, and so releasing anywhere ends the drag.
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => { e.preventDefault(); emitFromClientY(e.clientY); };
    const up = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragging, emitFromClientY]);

  const nudge = (delta: number) => {
    onChange(interiorFromBend(Math.min(MAX_BEND, Math.max(-MAX_BEND, bend + delta))));
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <foreignObject x={x - TRACK_W / 2} y={y} width={TRACK_W} height={trackH}>
      <div
        ref={trackRef}
        style={{ position: 'relative', width: TRACK_W, height: trackH, boxSizing: 'border-box' }}
        onMouseDown={stop}
        onClick={stop}
        onMouseMove={stop}
      >
        {/* Hairline track */}
        <div
          style={{
            position: 'absolute', left: '50%', top: 0, width: 1, height: '100%',
            background: '#9ca3af', transform: 'translateX(-0.5px)',
          }}
        />
        {/* Centre tick — where the legs are inline */}
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', width: 6, height: 1,
            background: '#c4c8d0', transform: 'translate(-50%, -0.5px)',
          }}
        />

        {/* Grip handle */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Corner bend in degrees. Up bends toward the top of the screen."
          aria-valuemin={-MAX_BEND}
          aria-valuemax={MAX_BEND}
          aria-valuenow={Math.round(bend)}
          aria-valuetext={formatBend(bend)}
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setDragging(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); nudge(1); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); nudge(-1); }
            else if (e.key === 'Home') { e.preventDefault(); e.stopPropagation(); onChange(interiorFromBend(0)); }
          }}
          style={{
            position: 'absolute', left: '50%', top: handleTop,
            width: HANDLE_W, height: HANDLE_H, marginLeft: -HANDLE_W / 2,
            display: 'grid',
            gridTemplateColumns: `${DOT}px ${DOT}px`, gridTemplateRows: `${DOT}px ${DOT}px ${DOT}px`,
            gap: DOT, alignContent: 'center', justifyContent: 'center',
            background: '#2c2f36', borderRadius: 3.5,
            boxShadow: dragging ? '0 0 0 1.5px rgba(124,58,237,0.55)' : '0 1px 2px rgba(0,0,0,0.35)',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none', outline: 'none',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} style={{ width: DOT, height: DOT, borderRadius: '50%', background: '#9aa0ab' }} />
          ))}
        </div>

        {/* Readout, pinned beside the handle so it follows the drag */}
        <div
          style={{
            position: 'absolute', left: TRACK_W / 2 + HANDLE_W / 2 + 3,
            top: handleTop + HANDLE_H / 2 - 4.5,
            fontSize: 7, fontWeight: 600, lineHeight: '9px',
            color: '#4c1d95', whiteSpace: 'nowrap', pointerEvents: 'none',
          }}
        >
          {formatBend(bend)}
        </div>
      </div>
    </foreignObject>
  );
};

export default ConnectorSlider;
