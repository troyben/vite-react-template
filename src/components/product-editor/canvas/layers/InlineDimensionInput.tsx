// ---------------------------------------------------------------------------
// The little number box that appears when a dimension label is clicked.
//
// Shared by the flat canvas and the chain canvas so the two cannot drift: an
// EditingDim already carries where to sit, what to show and what to do with
// the result, so neither caller needs its own copy of this markup.
// ---------------------------------------------------------------------------

import React, { useEffect, useRef } from 'react';
import type { EditingDim } from './DimensionLayers';

export interface InlineDimensionInputProps {
  editingDim: EditingDim;
  value: string;
  onValueChange: (v: string) => void;
  /** Commit the parsed value if it is a usable number, then close. */
  onCommit: () => void;
  onCancel: () => void;
}

const InlineDimensionInput: React.FC<InlineDimensionInputProps> = ({
  editingDim, value, onValueChange, onCommit, onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, [editingDim.key]);

  return (
    <foreignObject
      x={editingDim.x - 25}
      y={editingDim.y - 8}
      width={50}
      height={16}
      transform={editingDim.angle ? `rotate(${editingDim.angle}, ${editingDim.x}, ${editingDim.y})` : undefined}
    >
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') onCommit();
          else if (e.key === 'Escape') onCancel();
        }}
        onBlur={onCommit}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        autoFocus
        style={{
          width: '100%', height: '100%', fontSize: '7px',
          textAlign: 'center', border: '1px solid #7E88C3',
          borderRadius: '2px', outline: 'none', background: 'white',
          padding: '0 2px', boxSizing: 'border-box',
        }}
      />
    </foreignObject>
  );
};

export default InlineDimensionInput;
