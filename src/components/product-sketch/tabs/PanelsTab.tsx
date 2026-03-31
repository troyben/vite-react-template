import React from 'react';
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
  openingPanes,
  activeHingeSelector,
  setPanelDivisions,
  setOpeningPanes,
  setActiveHingeSelector,
}) => {
  return (
    <>
      <div className="control-group">
        <label>Panel Configuration</label>
        <div className="panel-config-grid">
          {Array.from({ length: panels }).map((_, panelIndex) => {
            const division = panelDivisions.find(d => d.panelIndex === panelIndex) || {
              panelIndex,
              horizontalCount: 1,
              verticalCount: 1
            };
            return (
              <div key={panelIndex} className="panel-config-card">
                <div className="panel-config-header">
                  <div className="panel-config-title">Panel {panelIndex + 1}</div>
                </div>
                <div className="division-controls">
                  <div className="division-input-group">
                    <label>Rows</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={division.horizontalCount}
                      onChange={(e) => {
                        const newDivisions = [...panelDivisions.filter(d => d.panelIndex !== panelIndex)];
                        newDivisions.push({
                          panelIndex,
                          horizontalCount: Number(e.target.value),
                          verticalCount: division.verticalCount
                        });
                        setPanelDivisions(newDivisions);
                      }}
                    />
                  </div>
                  <span className="division-separator">&times;</span>
                  <div className="division-input-group">
                    <label>Columns</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={division.verticalCount}
                      onChange={(e) => {
                        const newDivisions = [...panelDivisions.filter(d => d.panelIndex !== panelIndex)];
                        newDivisions.push({
                          panelIndex,
                          horizontalCount: division.horizontalCount,
                          verticalCount: Number(e.target.value)
                        });
                        setPanelDivisions(newDivisions);
                      }}
                    />
                  </div>
                </div>
                {division.horizontalCount > 1 || division.verticalCount > 1 ? (
                  <div className="opening-panes-grid">
                    <label>Opening Panes (select multiple)</label>
                    <div className="panes-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
                      gap: '2px'
                    }}>
                      {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, index) => {
                        const rowIndex = Math.floor(index / division.verticalCount);
                        const colIndex = index % division.verticalCount;
                        const foundPane = openingPanes.find(p =>
                          p.panelIndex === division.panelIndex &&
                          p.rowIndex === rowIndex &&
                          p.colIndex === colIndex
                        );
                        const isOpening = !!foundPane;
                        return (
                          <div key={index} className="pane-config">
                            <button
                              type="button"
                              className={`pane-toggle ${isOpening ? 'active' : ''}`}
                              onClick={() => {
                                if (isOpening) {
                                  setOpeningPanes((prev: Array<{
                                    panelIndex: number;
                                    rowIndex: number;
                                    colIndex: number;
                                    openingDirection?: OpeningDirection;
                                  }>) => prev.filter(p =>
                                    !(p.panelIndex === division.panelIndex &&
                                      p.rowIndex === rowIndex &&
                                      p.colIndex === colIndex)
                                  ));
                                  setActiveHingeSelector(null);
                                } else {
                                  setActiveHingeSelector({
                                    panelIndex: division.panelIndex,
                                    rowIndex,
                                    colIndex
                                  });
                                }
                              }}
                            >
                              <span className="pane-toggle-inner" />
                            </button>
                            {activeHingeSelector?.panelIndex === division.panelIndex &&
                              activeHingeSelector.rowIndex === rowIndex &&
                              activeHingeSelector.colIndex === colIndex && (
                              <div className="pane-direction-controls">
                                <h4 className="direction-title">Hinge Side</h4>
                                <div className="direction-buttons-grid">
                                  <button
                                    className={`direction-btn top ${foundPane?.openingDirection === 'top' ? 'active' : ''}`}
                                    onClick={() => {
                                      setOpeningPanes((prev: Array<{
                                        panelIndex: number;
                                        rowIndex: number;
                                        colIndex: number;
                                        openingDirection?: OpeningDirection;
                                      }>) => [...prev, {
                                        panelIndex: division.panelIndex,
                                        rowIndex,
                                        colIndex,
                                        openingDirection: 'top' as const
                                      }]);
                                      setActiveHingeSelector(null);
                                    }}
                                    title="Hinged from Top"
                                  >
                                    <span className="hinge-indicator">{'\u27E1'}</span>
                                    <span className="arrow">{'\u2193'}</span>
                                  </button>
                                  <button
                                    className={`direction-btn right ${foundPane?.openingDirection === 'right' ? 'active' : ''}`}
                                    onClick={() => {
                                      setOpeningPanes((prev: Array<{
                                        panelIndex: number;
                                        rowIndex: number;
                                        colIndex: number;
                                        openingDirection?: OpeningDirection;
                                      }>) => [...prev, {
                                        panelIndex: division.panelIndex,
                                        rowIndex,
                                        colIndex,
                                        openingDirection: 'right' as const
                                      }]);
                                      setActiveHingeSelector(null);
                                    }}
                                    title="Hinged from Right"
                                  >
                                    <span className="hinge-indicator">{'\u27E1'}</span>
                                    <span className="arrow">{'\u2190'}</span>
                                  </button>
                                  <button
                                    className={`direction-btn bottom ${foundPane?.openingDirection === 'bottom' ? 'active' : ''}`}
                                    onClick={() => {
                                      setOpeningPanes((prev: Array<{
                                        panelIndex: number;
                                        rowIndex: number;
                                        colIndex: number;
                                        openingDirection?: OpeningDirection;
                                      }>) => [...prev, {
                                        panelIndex: division.panelIndex,
                                        rowIndex,
                                        colIndex,
                                        openingDirection: 'bottom' as const
                                      }]);
                                      setActiveHingeSelector(null);
                                    }}
                                    title="Hinged from Bottom"
                                  >
                                    <span className="hinge-indicator">{'\u27E1'}</span>
                                    <span className="arrow">{'\u2191'}</span>
                                  </button>
                                  <button
                                    className={`direction-btn left ${foundPane?.openingDirection === 'left' ? 'active' : ''}`}
                                    onClick={() => {
                                      setOpeningPanes((prev: Array<{
                                        panelIndex: number;
                                        rowIndex: number;
                                        colIndex: number;
                                        openingDirection?: OpeningDirection;
                                      }>) => [...prev, {
                                        panelIndex: division.panelIndex,
                                        rowIndex,
                                        colIndex,
                                        openingDirection: 'left' as const
                                      }]);
                                      setActiveHingeSelector(null);
                                    }}
                                    title="Hinged from Left"
                                  >
                                    <span className="hinge-indicator">{'\u27E1'}</span>
                                    <span className="arrow">{'\u2192'}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <small className="pane-help-text">Hold Shift to select multiple panes</small>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default PanelsTab;
