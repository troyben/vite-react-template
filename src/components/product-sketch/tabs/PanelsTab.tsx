import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OpeningDirection, ActiveHingeSelector } from '../types';

interface PanelsTabProps {
  panels: number;
  panelDivisions: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  openingPanes: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>;
  activeHingeSelector: ActiveHingeSelector | null;
  setPanelDivisions: (d: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>) => void;
  setOpeningPanes: (updater: ((prev: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>) => Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>) | Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>) => void;
  setActiveHingeSelector: (s: ActiveHingeSelector | null) => void;
}

const PanelsTab: React.FC<PanelsTabProps> = ({
  panels,
  panelDivisions,
  setPanelDivisions,
}) => {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Panel Configuration</Label>
      <p className="text-xs text-muted-foreground">Set rows and columns for each panel's pane grid.</p>

      <div className="space-y-2">
        {Array.from({ length: panels }).map((_, panelIndex) => {
          const division = panelDivisions.find((d) => d.panelIndex === panelIndex) || {
            panelIndex,
            horizontalCount: 1,
            verticalCount: 1,
          };

          return (
            <div key={panelIndex} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-xs font-medium">Panel {panelIndex + 1}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] text-muted-foreground">Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={division.horizontalCount}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(4, Number(e.target.value) || 1));
                      setPanelDivisions([
                        ...panelDivisions.filter((d) => d.panelIndex !== panelIndex),
                        { panelIndex, horizontalCount: val, verticalCount: division.verticalCount },
                      ]);
                    }}
                    className="h-7 w-12 text-center text-sm"
                  />
                </div>
                <span className="text-xs text-muted-foreground">x</span>
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] text-muted-foreground">Cols</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={division.verticalCount}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(4, Number(e.target.value) || 1));
                      setPanelDivisions([
                        ...panelDivisions.filter((d) => d.panelIndex !== panelIndex),
                        { panelIndex, horizontalCount: division.horizontalCount, verticalCount: val },
                      ]);
                    }}
                    className="h-7 w-12 text-center text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PanelsTab;
