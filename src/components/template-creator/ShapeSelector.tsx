import type { ShapeType } from '@/components/product-sketch/types';

interface ShapeSelectorProps {
  selected: ShapeType;
  onSelect: (shape: ShapeType) => void;
}

const shapes: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'rectangle',
    label: 'Rectangle',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="32" height="24" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    type: 'arch',
    label: 'Arch',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 36V16C4 8.268 11.163 2 20 2C28.837 2 36 8.268 36 16V36H4Z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    type: 'trapezoid',
    label: 'Trapezoid',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 8H30L36 32H4L10 8Z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    type: 'l-shape',
    label: 'L-Shape',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H24V18H36V36H4V4Z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    type: 'triangle',
    label: 'Triangle',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4L36 36H4L20 4Z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    type: 'pentagon',
    label: 'Pentagon',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 3L37 15.5L30.5 36H9.5L3 15.5L20 3Z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    type: 'hexagon',
    label: 'Hexagon',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H30L38 20L30 36H10L2 20L10 4Z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
];

const ShapeSelector: React.FC<ShapeSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {shapes.map(({ type, label, icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors ${
            selected === type
              ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
              : 'bg-muted/50 hover:bg-muted text-muted-foreground'
          }`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ShapeSelector;
