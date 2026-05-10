import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { OpeningDirection } from '../types';

interface OpeningsTabProps {
  panels: number;
  openingPanels: number[];
  openingDirections: Record<number, OpeningDirection>;
  type: 'window' | 'door';
  setOpeningPanels: (p: number[]) => void;
  setOpeningDirections: (d: Record<number, OpeningDirection>) => void;
}

const DIRECTIONS: { dir: OpeningDirection; Icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>; label: string }[] = [
  { dir: 'left', Icon: ArrowLeft, label: 'Left' },
  { dir: 'right', Icon: ArrowRight, label: 'Right' },
  { dir: 'top', Icon: ArrowUp, label: 'Top' },
  { dir: 'bottom', Icon: ArrowDown, label: 'Bottom' },
];

const OpeningsTab: React.FC<OpeningsTabProps> = ({
  panels,
  openingPanels,
  openingDirections,
  type,
  setOpeningPanels,
  setOpeningDirections,
}) => {
  const handleToggle = (index: number) => {
    if (openingPanels.includes(index)) {
      setOpeningPanels(openingPanels.filter((p) => p !== index));
      const newDirections = { ...openingDirections };
      delete newDirections[index];
      setOpeningDirections(newDirections);
    } else {
      setOpeningPanels([...openingPanels, index]);
      setOpeningDirections({
        ...openingDirections,
        [index]: 'left',
      });
    }
  };

  const handleDirectionChange = (index: number, direction: OpeningDirection) => {
    setOpeningDirections({
      ...openingDirections,
      [index]: direction,
    });
  };

  // Filter directions based on product type
  const availableDirections = type === 'window'
    ? DIRECTIONS
    : DIRECTIONS.filter((d) => d.dir === 'left' || d.dir === 'right');

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Opening Configuration</Label>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: panels }).map((_, index) => {
          const isOpen = openingPanels.includes(index);
          return (
            <div
              key={index}
              className={`rounded-lg border p-3 transition-colors ${
                isOpen ? 'border-violet-200 bg-violet-50/30' : 'border-muted'
              }`}
            >
              {/* Header with toggle */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Panel {index + 1}</span>
                <Switch
                  size="sm"
                  checked={isOpen}
                  onCheckedChange={() => handleToggle(index)}
                />
              </div>

              {/* Direction selector */}
              {isOpen && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground">Direction</span>
                  <div className="flex gap-1">
                    {availableDirections.map(({ dir, Icon }) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => handleDirectionChange(index, dir)}
                        className={`p-1.5 rounded transition-colors ${
                          openingDirections[index] === dir
                            ? 'bg-violet-100 text-violet-700'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        title={`Open ${dir}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OpeningsTab;
