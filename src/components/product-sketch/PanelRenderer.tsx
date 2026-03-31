import React from 'react';
import PanelDivisions from './PanelDivisions';
import type { OpeningDirection, ActiveHingeSelector } from './types';

interface PanelRendererProps {
  panelIndex: number;
  panels: number;
  openingPanels: number[];
  openingDirections: Record<number, OpeningDirection>;
  isSliding: boolean;
  frameColor: string;
  glassType: string;
  customGlassTint: string;
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
  type: 'window' | 'door';
  doorType: 'hinged' | 'sliding';
  windowType: 'hinged' | 'sliding';
  activeHingeSelector: ActiveHingeSelector | null;
}

const PanelRenderer: React.FC<PanelRendererProps> = ({
  panelIndex,
  panels,
  openingPanels,
  openingDirections,
  isSliding,
  frameColor,
  glassType,
  customGlassTint,
  panelDivisions,
  openingPanes,
  type,
  doorType,
  windowType,
  activeHingeSelector,
}) => {
  const isOpening = openingPanels.includes(panelIndex);
  const openingDirection = openingDirections[panelIndex];

  // Calculate transform based on conditions
  const getTransform = () => {
    if (!isOpening) return 'none';
    if (isSliding) {
      if (openingDirection === 'left' || openingDirection === 'right') {
        return `translateX(${openingDirection === 'left' ? '-50%' : '50%'})`;
      }
      if (openingDirection === 'top' || openingDirection === 'bottom') {
        return `translateY(${openingDirection === 'top' ? '-50%' : '50%'})`;
      }
      return 'none';
    }

    // Improved perspective transforms with adjusted values
    switch (openingDirection) {
      case 'left': return 'perspective(2000px) translate3d(-2%, 0, 20px) rotateY(-25deg) scaleX(0.97)';
      case 'right': return 'perspective(2000px) translate3d(2%, 0, 20px) rotateY(25deg) scaleX(0.97)';
      case 'top': return 'perspective(2000px) translate3d(0, 0%, 10px) rotateX(65deg) scaleY(1)';
      case 'bottom': return 'perspective(2000px) translate3d(0, 2%, 50px) rotateX(-45deg) scaleY(0.85)';
      default: return 'none';
    }
  };

  // Calculate z-index based on panel position and opening state
  const getZIndex = () => {
    if (!isOpening) return 1;
    if (isSliding) return 2;
    // Adjust z-index based on opening direction and panel position
    switch (openingDirection) {
      case 'left': return panelIndex === 0 ? 2 : 3;
      case 'right': return panelIndex === panels - 1 ? 2 : 3;
      case 'top': return 3;
      case 'bottom': return 2;
      default: return 1;
    }
  };

  const getGlassStyle = () => {
    switch (glassType) {
      case 'clear':
        return frameColor === '#C0C0C0'
          ? 'rgba(220, 225, 255, 0.15)' // Lighter, more subtle blue for silver frame
          : 'rgba(200, 200, 255, 0.3)';
      case 'frosted': return 'rgba(255, 255, 255, 0.8)';
      case 'custom-tint': return `${customGlassTint}80`;
      default: return 'transparent';
    }
  };

  return (
    <div
      className={`panel ${isOpening ? 'opening' : ''}`}
      style={{
        border: `2px solid ${frameColor}`,
        position: 'absolute',
        top: 0,
        width: '100%',
        height: '100%',
        transform: getTransform(),
        transformOrigin: openingDirection === 'left' ? 'left center' :
                      openingDirection === 'right' ? 'right center' :
                      openingDirection === 'top' ? 'center top' : 'center bottom',
        transition: 'transform 0.3s ease, z-index 0s',
        zIndex: getZIndex(),
        backgroundColor: getGlassStyle(),
        boxShadow: isOpening ? '2px 2px 8px rgba(0,0,0,0.2)' : 'none',
        margin: 0,
        boxSizing: 'border-box'
      }}
    >
      <PanelDivisions
        panelIndex={panelIndex}
        panelDivisions={panelDivisions}
        openingPanes={openingPanes}
        openingPanels={openingPanels}
        type={type}
        doorType={doorType}
        windowType={windowType}
        frameColor={frameColor}
        glassType={glassType}
        customGlassTint={customGlassTint}
        activeHingeSelector={activeHingeSelector}
      />
      {isOpening && (
        <div
          className="handle"
          style={{
            position: 'absolute',
            backgroundColor: frameColor,
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            ...(openingDirection === 'left' || openingDirection === 'right' ? {
              [openingDirection === 'left' ? 'right' : 'left']: '10%',
              top: '50%',
              width: '4px',
              height: '40px',
              transform: 'translateY(-50%)'
            } : {
              [openingDirection === 'top' ? 'bottom' : 'top']: '10%',
              left: '50%',
              width: '40px',
              height: '4px',
              transform: 'translateX(-50%)'
            })
          }}
        />
      )}
    </div>
  );
};

export default PanelRenderer;
