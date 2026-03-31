import React from 'react';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { OpeningDirection } from './types';

interface OpeningDirectionSelectorProps {
  index: number;
  type: 'window' | 'door';
  openingDirections: Record<number, OpeningDirection>;
  onDirectionChange: (index: number, direction: OpeningDirection) => void;
}

const OpeningDirectionSelector: React.FC<OpeningDirectionSelectorProps> = ({
  index,
  type,
  openingDirections,
  onDirectionChange,
}) => {
  // Only show relevant opening directions based on product type
  return (
    <div className="opening-direction-selector">
      {type === 'window' && (
        <>
          <button
            type="button"
            className={`direction-btn ${openingDirections[index] === 'top' ? 'active' : ''}`}
            onClick={() => onDirectionChange(index, 'top')}
          >
            <ArrowUp className="w-6 h-6" strokeWidth={3} />
          </button>
          <button
            type="button"
            className={`direction-btn ${openingDirections[index] === 'bottom' ? 'active' : ''}`}
            onClick={() => onDirectionChange(index, 'bottom')}
          >
            <ArrowDown className="w-6 h-6" strokeWidth={3} />
          </button>
        </>
      )}
      <button
        type="button"
        className={`direction-btn ${openingDirections[index] === 'left' ? 'active' : ''}`}
        onClick={() => onDirectionChange(index, 'left')}
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={3} />
      </button>
      <button
        type="button"
        className={`direction-btn ${openingDirections[index] === 'right' ? 'active' : ''}`}
        onClick={() => onDirectionChange(index, 'right')}
      >
        <ChevronRight className="w-6 h-6" strokeWidth={3} />
      </button>
    </div>
  );
};

export default OpeningDirectionSelector;
