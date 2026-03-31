import React from 'react';
import OpeningDirectionSelector from '../OpeningDirectionSelector';
import type { OpeningDirection } from '../types';

interface OpeningsTabProps {
  panels: number;
  openingPanels: number[];
  openingDirections: Record<number, OpeningDirection>;
  type: 'window' | 'door';
  setOpeningPanels: (p: number[]) => void;
  setOpeningDirections: (d: Record<number, OpeningDirection>) => void;
}

const OpeningsTab: React.FC<OpeningsTabProps> = ({
  panels,
  openingPanels,
  openingDirections,
  type,
  setOpeningPanels,
  setOpeningDirections,
}) => {
  const handleDirectionChange = (index: number, direction: OpeningDirection) => {
    setOpeningDirections({
      ...openingDirections,
      [index]: direction
    });
  };

  return (
    <>
      <div className="control-group">
        <label>Opening Configuration</label>
        <div className="opening-config" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {Array.from({ length: panels }).map((_, index) => (
            <div key={index} className="panel-opening-config" style={{ padding: 8 }}>
              <div className="panel-opening-header">
                <div className="panel-opening-title">Panel {index + 1}</div>
                <label className="panel-opening-toggle">
                  <input
                    type="checkbox"
                    checked={openingPanels.includes(index)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOpeningPanels([...openingPanels, index]);
                        setOpeningDirections({
                          ...openingDirections,
                          [index]: 'left' // Default to left
                        });
                      } else {
                        setOpeningPanels(openingPanels.filter(p => p !== index));
                        const newDirections = { ...openingDirections };
                        delete newDirections[index];
                        setOpeningDirections(newDirections);
                      }
                    }}
                  />
                  <span className="toggle-label">Opening Panel</span>
                </label>
              </div>
              {openingPanels.includes(index) && (
                <OpeningDirectionSelector
                  index={index}
                  type={type}
                  openingDirections={openingDirections}
                  onDirectionChange={handleDirectionChange}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OpeningsTab;
