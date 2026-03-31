import React from 'react';
import { GripHorizontal, Minus, MousePointer2 } from 'lucide-react';
import type { CanvasTool } from './utils/canvas-tools';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  lineOrientation: 'horizontal' | 'vertical';
  onLineOrientationChange: (o: 'horizontal' | 'vertical') => void;
  lineTarget: 'panel' | 'pane';
  onLineTargetChange: (t: 'panel' | 'pane') => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  onToolChange,
  lineOrientation,
  onLineOrientationChange,
  lineTarget,
  onLineTargetChange,
}) => {
  function toggleTool(tool: CanvasTool) {
    onToolChange(activeTool === tool ? null : tool);
  }

  const btnBase =
    'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors';
  const btnActive = 'border-violet-400 bg-violet-50 text-violet-700';
  const btnInactive = 'border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground';

  return (
    <div className="flex items-center gap-1.5">
      {/* Select (deselect tool) */}
      {activeTool && (
        <button
          type="button"
          className={`${btnBase} border-blue-400 bg-blue-50 text-blue-700`}
          onClick={() => onToolChange(null)}
          title="Deselect tool — return to default cursor"
        >
          <MousePointer2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Handle tool */}
      <button
        type="button"
        className={`${btnBase} ${activeTool === 'handle' ? btnActive : btnInactive}`}
        onClick={() => toggleTool('handle')}
        title="Handle tool -- click on a panel to place an opening indicator"
      >
        <GripHorizontal className="h-3.5 w-3.5" />
        <span>Handle</span>
      </button>

      {/* Line tool */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={`${btnBase} ${activeTool === 'line' ? btnActive : btnInactive}`}
          onClick={() => toggleTool('line')}
          title="Line tool -- click to split panels or add pane subdivisions"
        >
          <Minus className="h-3.5 w-3.5" />
          <span>Line</span>
        </button>
        {activeTool === 'line' && (
          <>
            {/* Panel / Pane target selector */}
            <div className="flex gap-0 rounded-md bg-muted p-0.5">
              <button
                type="button"
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  lineTarget === 'panel'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => onLineTargetChange('panel')}
              >
                Panel
              </button>
              <button
                type="button"
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  lineTarget === 'pane'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => onLineTargetChange('pane')}
              >
                Pane
              </button>
            </div>
            {/* H/V orientation selector -- only shown in Pane mode (Panel mode is always vertical) */}
            {lineTarget === 'pane' && (
              <div className="flex gap-0 rounded-md bg-muted p-0.5">
                <button
                  type="button"
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    lineOrientation === 'horizontal'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => onLineOrientationChange('horizontal')}
                >
                  H
                </button>
                <button
                  type="button"
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    lineOrientation === 'vertical'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => onLineOrientationChange('vertical')}
                >
                  V
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Arc tool */}
      <button
        type="button"
        className={`${btnBase} ${activeTool === 'arc' ? btnActive : btnInactive}`}
        onClick={() => toggleTool('arc')}
        title="Arc tool -- click to place a semicircular arc"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <path
            d="M2 12 A5 5 0 0 1 12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span>Arc</span>
      </button>
    </div>
  );
};

export default CanvasToolbar;
