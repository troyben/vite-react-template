import React from 'react';
import type { OpeningDirection, ActiveHingeSelector } from './types';

interface PanelDivisionsProps {
  panelIndex: number;
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
    openingType?: 'hinged' | 'sliding';
  }>;
  openingPanels: number[];
  type: 'window' | 'door';
  doorType: 'hinged' | 'sliding';
  windowType: 'hinged' | 'sliding';
  frameColor: string;
  glassType: string;
  customGlassTint: string;
  activeHingeSelector: ActiveHingeSelector | null;
}

const PanelDivisions: React.FC<PanelDivisionsProps> = ({
  panelIndex,
  panelDivisions,
  openingPanes,
  openingPanels,
  type,
  doorType,
  windowType,
  frameColor,
  activeHingeSelector,
}) => {
  const division = panelDivisions.find(d => d.panelIndex === panelIndex) || {
    panelIndex,
    horizontalCount: 1,
    verticalCount: 1
  };

  // Choose division border color based on frame color
  const getDivisionBorderColor = () => {
    if (frameColor === '#4F4F4F') return '#BDBDBD'; // Light grey for dark frame
    if (frameColor === '#CD7F32') return '#A67C52'; // Slightly lighter bronze
    // Default: subtle grey for silver or others
    return 'rgba(0,0,0,0.18)';
  };

  return (
    <div
      className="panel-divisions"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
        gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
        height: '100%',
        width: '100%',
        gap: '2px',
        position: 'absolute',
        top: 0,
        left: 0,
        padding: '2px',
        boxSizing: 'border-box'
      }}
    >
      {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, index) => {
        const rowIndex = Math.floor(index / division.verticalCount);
        const colIndex = index % division.verticalCount;
        const openingPane = openingPanes.find(p =>
          p.panelIndex === panelIndex &&
          p.rowIndex === rowIndex &&
          p.colIndex === colIndex
        ) as (typeof openingPanes)[number] | undefined;
        const isOpening = !!openingPane;

        const getTransform = () => {
          if (!openingPane?.openingDirection) return 'none';
          // Use per-pane openingType to determine sliding vs hinged animation
          if (openingPane.openingType === 'sliding') {
            switch (openingPane.openingDirection) {
              case 'left': return 'translateX(-50%)';
              case 'right': return 'translateX(50%)';
              case 'top': return 'translateY(-50%)';
              case 'bottom': return 'translateY(50%)';
              default: return 'none';
            }
          }
          // Hinged effect
          const baseTransform = 'perspective(600px)';
          switch (openingPane.openingDirection) {
            case 'left': return `${baseTransform} translateZ(0) rotateY(-45deg) translateX(0%)`;
            case 'right': return `${baseTransform} translateZ(0) rotateY(45deg) translateX(0%)`;
            case 'top': return `${baseTransform} translateZ(0) rotateX(55deg) translateY(0%)`;
            case 'bottom': return `${baseTransform} translateZ(0) rotateX(-45deg) translateY(0%)`;
            default: return 'none';
          }
        };

        const getTransformOrigin = () => {
          if (!openingPane?.openingDirection) return 'center';
          switch (openingPane.openingDirection) {
            case 'left': return '0 50%';
            case 'right': return '100% 50%';
            case 'top': return '50% 0';
            case 'bottom': return '50% 100%';
            default: return 'center';
          }
        };

        return (
          <div
            key={index}
            className={`panel-division ${isOpening ? 'opening' : ''}`}
            style={{
              border: `1px solid ${getDivisionBorderColor()}`,
              backgroundColor: isOpening
                ? 'rgba(124, 93, 250, 0.15)'
                : (!openingPanels.includes(panelIndex) && frameColor === '#C0C0C0')
                  ? 'rgba(0,0,0,0.05)'
                  : 'transparent',
              transform: getTransform(),
              transformOrigin: getTransformOrigin(),
              transition: 'all 0.3s ease',
              position: 'relative',
              boxSizing: 'border-box',
              boxShadow: isOpening
                ? '0 0 10px rgba(0,0,0,0.2)'
                : 'none',
              backfaceVisibility: 'hidden'
            }}
          >
            {isOpening && (
              <div
                className="pane-handle"
                style={{
                  position: 'absolute',
                  width: openingPane?.openingDirection === 'left' || openingPane?.openingDirection === 'right' ? '3px' : '20px',
                  height: openingPane?.openingDirection === 'top' || openingPane?.openingDirection === 'bottom' ? '3px' : '20px',
                  backgroundColor: frameColor,
                  borderRadius: '1px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  zIndex: 2,
                  ...{
                    left: openingPane?.openingDirection === 'right' ? '10%' :
                          openingPane?.openingDirection === 'left' ? '90%' : '50%',
                    top: openingPane?.openingDirection === 'bottom' ? '10%' :
                         openingPane?.openingDirection === 'top' ? '90%' : '50%',
                    transform: 'translate(-50%, -50%)'
                  }
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PanelDivisions;
