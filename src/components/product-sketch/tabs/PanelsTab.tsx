import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import type { OpeningDirection, ActiveHingeSelector } from '../types';

interface OpeningPane {
  panelIndex: number;
  rowIndex: number;
  colIndex: number;
  openingDirection?: OpeningDirection;
  openingType?: 'hinged' | 'sliding';
}

interface PanelsTabProps {
  panels: number;
  height: number;
  unit: string;
  panelWidths: number[];
  panelDivisions: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  panelDivisionHeights: Array<{ panelIndex: number; rowHeights: number[] }>;
  panelDivisionWidths: Array<{ panelIndex: number; colWidths: number[] }>;
  openingPanes: OpeningPane[];
  activeHingeSelector: ActiveHingeSelector | null;
  setPanelDivisions: (d: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>) => void;
  setPanelDivisionHeights: (h: Array<{ panelIndex: number; rowHeights: number[] }>) => void;
  setPanelDivisionWidths: (w: Array<{ panelIndex: number; colWidths: number[] }>) => void;
  setOpeningPanes: (updater: ((prev: OpeningPane[]) => OpeningPane[]) | OpeningPane[]) => void;
  setActiveHingeSelector: (s: ActiveHingeSelector | null) => void;
}

const PanelsTab: React.FC<PanelsTabProps> = ({
  panels,
  height,
  unit,
  panelWidths,
  panelDivisions,
  panelDivisionHeights,
  panelDivisionWidths,
  openingPanes,
  activeHingeSelector,
  setPanelDivisions,
  setPanelDivisionHeights,
  setPanelDivisionWidths,
  setOpeningPanes,
  setActiveHingeSelector,
}) => {
  const findPane = (panelIndex: number, rowIndex: number, colIndex: number) =>
    openingPanes.find(
      (p) => p.panelIndex === panelIndex && p.rowIndex === rowIndex && p.colIndex === colIndex,
    );

  const isSelected = (panelIndex: number, rowIndex: number, colIndex: number) =>
    activeHingeSelector?.panelIndex === panelIndex &&
    activeHingeSelector?.rowIndex === rowIndex &&
    activeHingeSelector?.colIndex === colIndex;

  const togglePane = (panelIndex: number, rowIndex: number, colIndex: number) => {
    const existing = findPane(panelIndex, rowIndex, colIndex);
    if (existing) {
      // Remove from openingPanes
      setOpeningPanes((prev: OpeningPane[]) =>
        prev.filter(
          (p) => !(p.panelIndex === panelIndex && p.rowIndex === rowIndex && p.colIndex === colIndex),
        ),
      );
      // Clear selector if this pane was selected
      if (isSelected(panelIndex, rowIndex, colIndex)) {
        setActiveHingeSelector(null);
      }
    } else {
      // Add with defaults
      setOpeningPanes((prev: OpeningPane[]) => [
        ...prev,
        { panelIndex, rowIndex, colIndex, openingDirection: 'left', openingType: 'hinged' },
      ]);
      setActiveHingeSelector({ panelIndex, rowIndex, colIndex });
    }
  };

  const selectPane = (panelIndex: number, rowIndex: number, colIndex: number) => {
    const existing = findPane(panelIndex, rowIndex, colIndex);
    if (!existing) return;
    if (isSelected(panelIndex, rowIndex, colIndex)) {
      setActiveHingeSelector(null);
    } else {
      setActiveHingeSelector({ panelIndex, rowIndex, colIndex });
    }
  };

  const updatePaneDirection = (direction: OpeningDirection) => {
    if (!activeHingeSelector) return;
    const { panelIndex, rowIndex, colIndex } = activeHingeSelector;
    setOpeningPanes((prev: OpeningPane[]) =>
      prev.map((p) =>
        p.panelIndex === panelIndex && p.rowIndex === rowIndex && p.colIndex === colIndex
          ? { ...p, openingDirection: direction }
          : p,
      ),
    );
  };

  const updatePaneType = (openingType: 'hinged' | 'sliding') => {
    if (!activeHingeSelector) return;
    const { panelIndex, rowIndex, colIndex } = activeHingeSelector;
    setOpeningPanes((prev: OpeningPane[]) =>
      prev.map((p) =>
        p.panelIndex === panelIndex && p.rowIndex === rowIndex && p.colIndex === colIndex
          ? { ...p, openingType }
          : p,
      ),
    );
  };

  // Get the currently selected pane data (if any)
  const selectedPaneData = activeHingeSelector
    ? findPane(activeHingeSelector.panelIndex, activeHingeSelector.rowIndex, activeHingeSelector.colIndex)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium">Panel Configuration</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set grid size per panel, then click panes to configure openings.
        </p>
      </div>

      {Array.from({ length: panels }).map((_, panelIndex) => {
        const division = panelDivisions.find((d) => d.panelIndex === panelIndex) || {
          panelIndex,
          horizontalCount: 1,
          verticalCount: 1,
        };
        const rows = division.horizontalCount;
        const cols = division.verticalCount;

        return (
          <div key={panelIndex} className="space-y-2 rounded-lg border p-3">
            {/* Panel header with rows/cols inputs */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Panel {panelIndex + 1}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] text-muted-foreground">Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={rows}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(4, Number(e.target.value) || 1));
                      setPanelDivisions([
                        ...panelDivisions.filter((d) => d.panelIndex !== panelIndex),
                        { panelIndex, horizontalCount: val, verticalCount: cols },
                      ]);
                      // Auto-initialize row heights for this panel
                      if (val > 1) {
                        const avg = Math.round(height / val);
                        const newRowHeights = Array(val).fill(avg);
                        newRowHeights[val - 1] = height - avg * (val - 1);
                        setPanelDivisionHeights([
                          ...panelDivisionHeights.filter((h) => h.panelIndex !== panelIndex),
                          { panelIndex, rowHeights: newRowHeights },
                        ]);
                      } else {
                        // Single row -- remove entry
                        setPanelDivisionHeights(
                          panelDivisionHeights.filter((h) => h.panelIndex !== panelIndex),
                        );
                      }
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
                    value={cols}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(4, Number(e.target.value) || 1));
                      setPanelDivisions([
                        ...panelDivisions.filter((d) => d.panelIndex !== panelIndex),
                        { panelIndex, horizontalCount: rows, verticalCount: val },
                      ]);
                      // Auto-initialize column widths for this panel
                      const pw = panelWidths[panelIndex] ?? 1000;
                      if (val > 1) {
                        const avg = Math.round(pw / val);
                        const newColWidths = Array(val).fill(avg);
                        newColWidths[val - 1] = pw - avg * (val - 1);
                        setPanelDivisionWidths([
                          ...panelDivisionWidths.filter((w) => w.panelIndex !== panelIndex),
                          { panelIndex, colWidths: newColWidths },
                        ]);
                      } else {
                        // Single column -- remove entry
                        setPanelDivisionWidths(
                          panelDivisionWidths.filter((w) => w.panelIndex !== panelIndex),
                        );
                      }
                    }}
                    className="h-7 w-12 text-center text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Visual pane grid */}
            {(rows > 1 || cols > 1) && (
              <div
                className="grid gap-1 rounded-md border bg-muted/30 p-2"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
                {Array.from({ length: rows * cols }).map((_, idx) => {
                  const rowIdx = Math.floor(idx / cols);
                  const colIdx = idx % cols;
                  const pane = findPane(panelIndex, rowIdx, colIdx);
                  const isOpen = !!pane;
                  const isSel = isSelected(panelIndex, rowIdx, colIdx);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isOpen) {
                          selectPane(panelIndex, rowIdx, colIdx);
                        } else {
                          togglePane(panelIndex, rowIdx, colIdx);
                        }
                      }}
                      className={`
                        relative flex items-center justify-center rounded-sm
                        min-h-[36px] text-[10px] font-medium transition-all
                        ${isOpen
                          ? isSel
                            ? 'bg-emerald-100 border-2 border-blue-500 text-emerald-800'
                            : 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-white border border-gray-200 text-muted-foreground hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="leading-none">
                        {rowIdx + 1},{colIdx + 1}
                      </span>
                      {isOpen && (
                        <span className="absolute top-0.5 right-0.5 text-[8px] text-emerald-600">
                          {pane?.openingType === 'sliding' ? 'S' : 'H'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Row height inputs */}
            {rows > 1 && (() => {
              const divH = panelDivisionHeights.find((h) => h.panelIndex === panelIndex);
              const rowHeights = divH?.rowHeights ?? Array(rows).fill(Math.round(height / rows));
              return (
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Row Heights ({unit})</Label>
                  <div className={`grid gap-1.5 ${rows >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {Array.from({ length: rows }).map((_, r) => {
                      const isLast = r === rows - 1;
                      return (
                        <div key={r} className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground">Row {r + 1}</span>
                          <Input
                            type="number"
                            min={1}
                            step="any"
                            value={rowHeights[r] ?? ''}
                            onChange={(e) => {
                              if (isLast) return;
                              const val = e.target.value;
                              if (val === '') return;
                              const num = parseFloat(val);
                              if (isNaN(num) || num < 0) return;
                              const newHeights = [...rowHeights];
                              newHeights[r] = num;
                              // Recalculate last row
                              const sumExceptLast = newHeights.slice(0, -1).reduce((a, b) => a + b, 0);
                              newHeights[rows - 1] = Math.max(height - sumExceptLast, 0);
                              setPanelDivisionHeights([
                                ...panelDivisionHeights.filter((h) => h.panelIndex !== panelIndex),
                                { panelIndex, rowHeights: newHeights },
                              ]);
                            }}
                            disabled={isLast}
                            className={`h-7 text-center text-sm ${
                              isLast ? 'bg-muted/50 text-muted-foreground' : ''
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Last row auto-adjusts. Total: <span className="font-semibold text-foreground">{rowHeights.reduce((a, b) => a + b, 0)}</span> {unit}
                  </p>
                </div>
              );
            })()}

            {/* Column width inputs */}
            {cols > 1 && (() => {
              const pw = panelWidths[panelIndex] ?? 1000;
              const divW = panelDivisionWidths.find((w) => w.panelIndex === panelIndex);
              const colWidths = divW?.colWidths ?? Array(cols).fill(Math.round(pw / cols));
              return (
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Column Widths ({unit})</Label>
                  <div className={`grid gap-1.5 ${cols >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {Array.from({ length: cols }).map((_, c) => {
                      const isLast = c === cols - 1;
                      return (
                        <div key={c} className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground">Col {c + 1}</span>
                          <Input
                            type="number"
                            min={1}
                            step="any"
                            value={colWidths[c] ?? ''}
                            onChange={(e) => {
                              if (isLast) return;
                              const val = e.target.value;
                              if (val === '') return;
                              const num = parseFloat(val);
                              if (isNaN(num) || num < 0) return;
                              const newWidths = [...colWidths];
                              newWidths[c] = num;
                              // Recalculate last column
                              const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
                              newWidths[cols - 1] = Math.max(pw - sumExceptLast, 0);
                              setPanelDivisionWidths([
                                ...panelDivisionWidths.filter((w) => w.panelIndex !== panelIndex),
                                { panelIndex, colWidths: newWidths },
                              ]);
                            }}
                            disabled={isLast}
                            className={`h-7 text-center text-sm ${
                              isLast ? 'bg-muted/50 text-muted-foreground' : ''
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Last col auto-adjusts. Total: <span className="font-semibold text-foreground">{colWidths.reduce((a, b) => a + b, 0)}</span> {unit}
                  </p>
                </div>
              );
            })()}

            {/* Pane count summary */}
            {(rows > 1 || cols > 1) && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>
                  {openingPanes.filter((p) => p.panelIndex === panelIndex).length} of{' '}
                  {rows * cols} panes opening
                </span>
                {openingPanes.some((p) => p.panelIndex === panelIndex) && (
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 underline"
                    onClick={() => {
                      setOpeningPanes((prev: OpeningPane[]) =>
                        prev.filter((p) => p.panelIndex !== panelIndex),
                      );
                      if (activeHingeSelector?.panelIndex === panelIndex) {
                        setActiveHingeSelector(null);
                      }
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Selected pane configuration */}
      {selectedPaneData && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <div className="text-xs font-semibold text-blue-800">
            Pane ({activeHingeSelector!.rowIndex + 1}, {activeHingeSelector!.colIndex + 1})
            &mdash; Panel {activeHingeSelector!.panelIndex + 1}
          </div>

          {/* Direction picker */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium text-blue-700">Direction</Label>
            <div className="grid grid-cols-4 gap-1">
              {([
                { dir: 'left' as const, icon: ArrowLeft, label: 'Left' },
                { dir: 'right' as const, icon: ArrowRight, label: 'Right' },
                { dir: 'top' as const, icon: ArrowUp, label: 'Top' },
                { dir: 'bottom' as const, icon: ArrowDown, label: 'Bottom' },
              ]).map(({ dir, icon: Icon, label }) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => updatePaneDirection(dir)}
                  className={`
                    flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors
                    ${selectedPaneData.openingDirection === dir
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Opening type toggle */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium text-blue-700">Opening Type</Label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => updatePaneType('hinged')}
                className={`
                  rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                  ${selectedPaneData.openingType !== 'sliding'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Hinged
              </button>
              <button
                type="button"
                onClick={() => updatePaneType('sliding')}
                className={`
                  rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                  ${selectedPaneData.openingType === 'sliding'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Sliding
              </button>
            </div>
          </div>

          {/* Remove opening button */}
          <button
            type="button"
            onClick={() => togglePane(
              activeHingeSelector!.panelIndex,
              activeHingeSelector!.rowIndex,
              activeHingeSelector!.colIndex,
            )}
            className="w-full rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Remove Opening
          </button>
        </div>
      )}
    </div>
  );
};

export default PanelsTab;
