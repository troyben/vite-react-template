import React, { useState } from 'react';
import '../styles/ProductSketch.css';

type OpeningDirection = 'left' | 'right' | 'top' | 'bottom';  // Keep this type but restrict usage for doors
type Unit = 'cm' | 'mm' | 'm';
type GlassType = 'clear' | 'frosted' | 'custom-tint';  // Update type definition

export interface ProductData {
  type: 'window' | 'door';
  doorType?: 'hinged' | 'sliding';
  width: number;
  height: number;
  panels: number;
  openingPanels?: number[];
  openingDirections?: Record<number, OpeningDirection>;
  frameColor?: string;
  glassType?: GlassType;
  customGlassTint?: string;
  panelDivisions?: Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>;
  openingPanes?: Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>;
  sketchSvg?: string;
  unit: Unit;
  panelWidths?: number[]; // New: width for each panel (cm, mm, m)
  panelDivisionHeights?: Array<{ panelIndex: number; rowHeights: number[] }>; // New: heights for each row in each panel
}

interface ProductSketchProps {
  onSave: (data: ProductData) => void;
  onCancel: () => void;
  initialData?: ProductData;
}

const ProductSketch: React.FC<ProductSketchProps> = ({ onSave, onCancel, initialData }) => {
  // Basic product state
  const [type, setType] = useState<'window' | 'door'>(initialData?.type || 'window');
  const [doorType, setDoorType] = useState<'hinged' | 'sliding'>(
    initialData?.type === 'door' ? (initialData?.doorType || 'hinged') : 'hinged'
  );
  const [width, setWidth] = useState<number>(initialData?.width || 1000);
  const [height, setHeight] = useState<number>(initialData?.height || 1000);
  const [panels, setPanels] = useState<number>(initialData?.panels || 1);
  const [unit, setUnit] = useState<Unit>(initialData?.unit || 'mm');

  // Panel and opening state
  const [openingPanels, setOpeningPanels] = useState<number[]>(
    initialData?.openingPanels || []
  );
  const [openingDirections, setOpeningDirections] = useState<Record<number, OpeningDirection>>(
    initialData?.openingDirections || {} as Record<number, OpeningDirection>
  );
  const [frameColor, setFrameColor] = useState<string>(initialData?.frameColor || '#C0C0C0');
  const [glassType, setGlassType] = useState<GlassType>(
    initialData?.glassType || 'clear'
  );
  const [customGlassTint, setCustomGlassTint] = useState<string>(
    initialData?.customGlassTint || '#FFFFFF'
  );
  const [panelDivisions, setPanelDivisions] = useState<Array<{
    panelIndex: number;
    horizontalCount: number;
    verticalCount: number;
  }>>(initialData?.panelDivisions || []);
  const [openingPanes, setOpeningPanes] = useState<Array<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
    openingDirection?: OpeningDirection;
  }>>(initialData?.openingPanes || []);
  
  const [activeHingeSelector, setActiveHingeSelector] = useState<{
    panelIndex: number;
    rowIndex: number;
    colIndex: number;
  } | null>(null);

  // New: panel widths state
  const [panelWidths, setPanelWidths] = useState<number[]>(
    initialData?.panelWidths && initialData.panelWidths.length === panels
      ? initialData.panelWidths
      : Array(panels).fill(Math.round((initialData?.width || 100) / panels))
  );

  // New: panel division heights state
  const [panelDivisionHeights] = useState<Array<{ panelIndex: number; rowHeights: number[] }>>(
    initialData?.panelDivisionHeights || []
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<'dimensions' | 'appearance' | 'openings' | 'divisions'>('dimensions');

  const handleSave = () => {
    // New: total width/height from panelWidths/panelDivisionHeights
    const totalWidth = panelWidths.reduce((a, b) => a + b, 0);
    const newPanelDivisionHeights = panelDivisionHeights.map(h => ({
      ...h,
      rowHeights: h.rowHeights.slice()
    }));
    const data: ProductData = {
      type,
      doorType: type === 'door' ? doorType : undefined,
      width: totalWidth,
      height,
      panels,
      openingPanels,
      openingDirections,
      frameColor,
      glassType,
      customGlassTint: glassType === 'custom-tint' ? customGlassTint : undefined,
      panelDivisions,
      openingPanes,
      unit,
      panelWidths: panelWidths.slice(),
      panelDivisionHeights: newPanelDivisionHeights
    };
    onSave(data);
  };

  const handleDimensionChange = (value: string, dimension: 'width' | 'height') => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    if (dimension === 'width') {
      setWidth(numValue);
    } else {
      setHeight(numValue);
    }
  };

  // Update renderPanelDivisions function
  const renderPanelDivisions = (panelIndex: number) => {
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
            const baseTransform = 'perspective(500px)';
            switch (openingPane.openingDirection) {
              case 'left': return `${baseTransform} translateZ(0) rotateY(-45deg) translateX(0%)`;
              case 'right': return `${baseTransform} translateZ(0) rotateY(45deg) translateX(40%)`;
              case 'top': return `${baseTransform} translateZ(0) rotateX(55deg) translateY(0%)`;
              case 'bottom': return `${baseTransform} translateZ(0) rotateX(-45deg) translateY(40%)`;
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

  const renderPanel = (panelIndex: number) => {
    const isOpening = openingPanels.includes(panelIndex);
    const openingDirection = openingDirections[panelIndex];
    const isSliding = type === 'door' && doorType === 'sliding';

    // Calculate transform based on conditions
    const getTransform = () => {
      if (!isOpening) return 'none';
      if (isSliding) {
        if (openingDirection === 'left' || openingDirection === 'right') {
          return `translateX(${openingDirection === 'left' ? '-50%' : '50%'})`;
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
        key={panelIndex}
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
        {renderPanelDivisions(panelIndex)}
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

  const renderOpeningDirectionSelector = (index: any) => {
    // Only show relevant opening directions based on product type
    return (
      <div className="opening-direction-selector">
        {type === 'window' && (
          <>
            <button
              type="button"
              className={`direction-btn ${openingDirections[index] === 'top' ? 'active' : ''}`}
              onClick={() => setOpeningDirections({
                ...openingDirections,
                [index]: 'top'
              })}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 18L12 6M12 6L6 12M12 6L18 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className={`direction-btn ${openingDirections[index] === 'bottom' ? 'active' : ''}`}
              onClick={() => setOpeningDirections({
                ...openingDirections,
                [index]: 'bottom'
              })}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6L12 18M12 18L6 12M12 18L18 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
        <button
          type="button"
          className={`direction-btn ${openingDirections[index] === 'left' ? 'active' : ''}`}
          onClick={() => setOpeningDirections({
            ...openingDirections,
            [index]: 'left'
          })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 18L6 12L18 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          type="button"
          className={`direction-btn ${openingDirections[index] === 'right' ? 'active' : ''}`}
          onClick={() => setOpeningDirections({
            ...openingDirections,
            [index]: 'right'
          })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 12L6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  };

  // Ensure doorType is set to 'hinged' when switching to door type
  const handleTypeChange = (newType: 'window' | 'door') => {
    setType(newType);
    if (newType === 'door') {
      setDoorType('hinged');
    }
  };

  // Update setPanels to properly initialize divisions and auto-divide panel widths
  const handlePanelCountChange = (newCount: number) => {
    setPanels(newCount);
    // Initialize divisions for new panels
    const existingDivisions = [...panelDivisions];
    for (let i = 0; i < newCount; i++) {
      if (!existingDivisions.find(d => d.panelIndex === i)) {
        existingDivisions.push({
          panelIndex: i,
          horizontalCount: 1,
          verticalCount: 1
        });
      }
    }
    setPanelDivisions(existingDivisions);

    // Auto-divide panel widths equally
    const avg = Math.round(width / newCount);
    const widths = Array(newCount).fill(avg);
    // Adjust last panel to ensure sum matches width exactly
    if (newCount > 0) {
      widths[newCount - 1] = width - avg * (newCount - 1);
    }
    setPanelWidths(widths);
  };

  // Helper to keep panelWidths sum in sync with total width
  const syncPanelWidths = (newWidths: number[], totalWidth: number) => {
    const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
    const lastWidth = Math.max(totalWidth - sumExceptLast, 1);
    return [...newWidths.slice(0, -1), lastWidth];
  };

  // When panels or width changes, update panelWidths
  React.useEffect(() => {
    setPanelWidths((prev) => {
      let arr = prev.slice(0, panels);
      if (arr.length < panels) {
        // Fill new panels with equal width
        const missing = panels - arr.length;
        arr = [...arr, ...Array(missing).fill(Math.round(width / panels))];
      }
      // Always sync last panel
      return syncPanelWidths(arr, width);
    });
    // eslint-disable-next-line
  }, [panels, width]);

  // When user edits a panel width (except last), update last panel to keep sum = width
  const handlePanelWidthChange = (panelIndex: number, value: string) => {
    let num = parseInt(value);
    if (isNaN(num) || num <= 0) return;
    let newWidths = [...panelWidths];
    if (panelIndex === panels - 1) {
      // Last panel: just set, but clamp so sum doesn't exceed width
      const sumExceptLast = newWidths.slice(0, -1).reduce((a, b) => a + b, 0);
      num = Math.max(width - sumExceptLast, 1);
      newWidths[panelIndex] = num;
    } else {
      newWidths[panelIndex] = num;
      newWidths = syncPanelWidths(newWidths, width);
    }
    setPanelWidths(newWidths);
  };

  // --- Dimension Lines for Preview ---
  const renderDimensionLines = () => {
    const frameWidth = panels < 4 ? 400 : 800;
    const frameHeight = 500;
    const offset = 10;

    // Panel widths in px: always divide frameWidth equally, regardless of panelWidths values
    const panelPixelWidths = Array(panels).fill(frameWidth / panels);

    // Calculate x positions for panel boundaries (fixed equal parts)
    let acc = 0;
    const panelBoundaries = panelPixelWidths.map((w, i) => {
      const start = acc;
      acc += w;
      return { start, end: acc, width: w, index: i };
    });

    return (
      <>
        {/* Panel widths dimension lines at the top, close to the frame */}
        <div
          className="dimension-label dimension-label-panel-widths"
          style={{
            position: 'absolute',
            left: '50%',
            top: `calc(50% - ${frameHeight / 2 + 18}px)`,
            transform: `translateX(-50%)`,
            width: `${frameWidth}px`,
            height: '24px',
            pointerEvents: 'none',
            zIndex: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: 0 }}>
            {panelBoundaries.map((panel, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${panel.start}px`,
                    top: "-5px",
                    width: `${panel.width}px`,
                    height: 0,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Panel width line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: `${panel.width}px`,
                      height: 0,
                      borderTop: '1.5px dashed #BDBDBD',
                      top: 0,
                    }}
                  />
                  {/* Left mini arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: -6,
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderRight: '7px solid #BDBDBD',
                    }}
                  />
                  {/* Right mini arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${panel.width - 7}px`,
                      top: -6,
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: '7px solid #BDBDBD',
                    }}
                  />
                  {/* Panel width label centered above the line */}
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: "-25px",
                      transform: 'translateX(-50%)',
                      background: '#fff',
                      color: '#7E88C3',
                      fontWeight: 500,
                      fontSize: 13,
                      padding: '0 8px',
                      borderRadius: 3,
                      border: '1px solid #DFE3FA',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {panelWidths[i]} {unit}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* Bottom horizontal dimension (width) */}
        <div
          className="dimension-label dimension-label-bottom"
          style={{
            position: 'absolute',
            left: '50%',
            top: `calc(50% + ${frameHeight / 2 + offset}px)`,
            transform: `translateX(-50%)`,
            width: `${frameWidth}px`,
            height: '24px',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: 0 }}>
            {/* Line */}
            <div
              className="dimension-line"
              style={{
                width: '100%',
                height: 0,
                borderTop: '2px solid #7E88C3',
                position: 'absolute',
                top: 10,
                left: 0,
              }}
            />
            {/* Left arrow */}
            <div
              className="dimension-arrow"
              style={{
                position: 'absolute',
                left: 0,
                top: 2,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '10px solid #7E88C3',
              }}
            />
            {/* Right arrow */}
            <div
              className="dimension-arrow"
              style={{
                position: 'absolute',
                right: 0,
                top: 2,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '10px solid #7E88C3',
              }}
            />
            {/* Label centered below the line */}
            <span
              className="dimension-text"
              style={{
                position: 'absolute',
                left: '50%',
                top: 16,
                transform: 'translateX(-50%)',
                background: '#fff',
                color: '#7E88C3',
                fontWeight: 600,
                fontSize: 15,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid #DFE3FA',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap'
              }}
            >
              {width} {unit}
            </span>
          </div>
        </div>
        {/* Left vertical dimension (height) */}
        <div
          className="dimension-label dimension-label-left"
          style={{
            position: 'absolute',
            left: `calc(50% - ${frameWidth / 1.6 + offset}px)`,
            top: '50%',
            transform: `translateY(-50%)`,
            height: `${frameHeight}px`,
            width: '32px',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', height: '100%', width: 0 }}>
            {/* Line */}
            <div
              className="dimension-line"
              style={{
                height: '100%',
                width: 0,
                borderLeft: '2px solid #7E88C3',
                position: 'absolute',
                left: 10,
                top: 0,
              }}
            />
            {/* Top arrow */}
            <div
              className="dimension-arrow"
              style={{
                position: 'absolute',
                left: 2,
                top: 0,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '10px solid #7E88C3',
              }}
            />
            {/* Bottom arrow */}
            <div
              className="dimension-arrow"
              style={{
                position: 'absolute',
                left: 2,
                bottom: 0,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #7E88C3',
              }}
            />
            {/* Label at left of line, vertically centered and rotated */}
            <span
              className="dimension-text"
              style={{
                position: 'absolute',
                left: 25,
                top: '50%',
                transform: 'translate(-100%, -50%) rotate(-90deg)',
                background: '#fff',
                color: '#7E88C3',
                fontWeight: 600,
                fontSize: 15,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid #DFE3FA',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap',
              }}
            >
              {height} {unit}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="sketch-container">
      <div className="sketch-header">
        <h2>Product Configuration</h2>
      </div>

      <div className="sketch-body">
        <div className="product-preview" style={{ position: 'relative', overflow: 'visible' }}>
          {/* --- Dimension Lines --- */}
          {renderDimensionLines()}
          {/* --- End Dimension Lines --- */}
          <div 
            className="product-frame"
            style={{
              width: `${panels < 4 ? "400px" : "800px"}`,
              height: '500px',
              border: `4px solid ${frameColor}`,
              position: 'relative',
              borderRadius: '0',
              perspective: '2000px',
              backgroundColor: frameColor === '#C0C0C0' ? '#E5E5E5' : frameColor,
              padding: 0,
              transform: "scale(1)",
              transformOrigin: 'center center',
              boxSizing: 'border-box',
              display: 'flex'
            }}
          >
            {/* Render panels as equal parts, filling the entire width */}
            {Array.from({ length: panels }).map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'block',
                  position: 'relative'
                }}
              >
                {renderPanel(index)}
              </div>
            ))}
          </div>
        </div>

        <div className="controls-section">
          <div className="control-group">
            <div className="form-row">
              <div className="form-group">
                <label>Product Type</label>
                <div className="button-group">
                  <button 
                    className={`control-button ${type === 'window' ? 'active' : ''}`}
                    onClick={() => setType('window')}
                  >
                    Window
                  </button>
                  <button 
                    className={`control-button ${type === 'door' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('door')}
                  >
                    Door
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Panels</label>
                <select
                  value={panels}
                  onChange={(e) => handlePanelCountChange(Number(e.target.value))}
                  className="styled-select"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Panel' : 'Panels'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Door Type Selector (only for doors) */}
          {type === 'door' && (
            <div className="control-group">
              <label>Door Type</label>
              <div className="door-type-selector">
                <button
                  type="button"
                  className={`door-type-btn${doorType === 'hinged' ? ' active' : ''}`}
                  onClick={() => setDoorType('hinged')}
                >
                  Hinged
                </button>
                <button
                  type="button"
                  className={`door-type-btn${doorType === 'sliding' ? ' active' : ''}`}
                  onClick={() => setDoorType('sliding')}
                >
                  Sliding
                </button>
              </div>
            </div>
          )}

          {/* --- Tabs UI --- */}
          <div className="sketch-tabs">
            <div className="sketch-tabs-header" style={{ display: 'flex', gap: 8 }}>
              <button
                className={`sketch-tab-btn${activeTab === 'dimensions' ? ' active' : ''}`}
                onClick={() => setActiveTab('dimensions')}
                type="button"
                title="Dimensions"
              >
                <img
                  src="/ruler.png"
                  alt="Dimensions"
                  style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                />
              </button>
              <button
                className={`sketch-tab-btn${activeTab === 'appearance' ? ' active' : ''}`}
                onClick={() => setActiveTab('appearance')}
                type="button"
                title="Appearance"
              >
                <img
                  src="/painting.png"
                  alt="Appearance"
                  style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                />
              </button>
              <button
                className={`sketch-tab-btn${activeTab === 'openings' ? ' active' : ''}`}
                onClick={() => setActiveTab('openings')}
                type="button"
                title="Configurations"
              >
                <img
                  src="/cogs.png"
                  alt="Configurations"
                  style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                />
              </button>
            </div>
            <div className="sketch-tabs-content" style={{ marginTop: 8 }}>
              {activeTab === 'dimensions' && (
                <>
                  <div className="dimensions">
                    <div className="dimensions-header">
                      <label>Dimensions</label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as Unit)}
                        className="unit-select"
                      >
                        <option value="mm">millimeters</option>
                        <option value="cm">centimeters</option>
                        <option value="m">meters</option>
                      </select>
                    </div>
                    <div className="dimensions-inputs">
                      <div className="form-group">
                        <label>Width ({unit})</label>
                        <input
                          type="number"
                          value={width}
                          onChange={e => setWidth(Number(e.target.value))}
                          step="0.1"
                          className="dimension-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Height ({unit})</label>
                        <input
                          type="number"
                          value={height}
                          onChange={e => handleDimensionChange(e.target.value, 'height')}
                          step="0.1"
                          className="dimension-input"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Panel Widths */}
                  <div className="control-group">
                    <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' }}>
                      Panel Widths ({unit})
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                        background: '#f9fafe',
                        borderRadius: 6,
                        padding: '10px 8px',
                        border: '1px solid #DFE3FA',
                        alignItems: 'center'
                      }}
                    >
                      {Array.from({ length: panels }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 60,
                            marginRight: 4
                          }}
                        >
                          <label
                            style={{
                              fontSize: 12,
                              color: '#7E88C3',
                              marginBottom: 2,
                              fontWeight: 500
                            }}
                          >
                            P{i + 1}
                          </label>
                          <input
                            type="number"
                            min={0.01}
                            step="any"
                            value={panelWidths[i] || ''}
                            onChange={e => handlePanelWidthChange(i, e.target.value)}
                            style={{
                              width: 60,
                              textAlign: 'center',
                              fontWeight: 600,
                              background: i === panels - 1 && panels > 1 ? '#f3f3f3' : 'white',
                              border: i === panels - 1 && panels > 1 ? '1px solid #e0e0e0' : '1px solid #DFE3FA',
                              color: i === panels - 1 && panels > 1 ? '#b0b0b0' : '#373B53',
                              borderRadius: 4,
                              outline: 'none',
                              fontSize: 14,
                              padding: '4px 0'
                            }}
                            disabled={i === panels - 1 && panels > 1}
                          />
                        </div>
                      ))}
                      <div
                        style={{
                          marginLeft: 12,
                          fontSize: 13,
                          color: '#7E88C3',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Total: <span style={{ color: '#373B53', fontWeight: 700 }}>{panelWidths.reduce((a, b) => a + b, 0)}</span> {unit}
                      </div>
                    </div>
                    <small style={{ color: '#7E88C3', fontSize: 12 }}>
                      Set each panel width. Last panel auto-adjusts to match total width.
                    </small>
                  </div>
                </>
              )}

              {activeTab === 'appearance' && (
                <div className="form-row settings-row">
                  <div className="form-group">
                    <label>Frame Color</label>
                    <div className="select-wrapper">
                      <select 
                        value={frameColor} 
                        onChange={e => setFrameColor(e.target.value)}
                        className="styled-select"
                      >
                        <option value="#C0C0C0">Natural/Silver</option>
                        <option value="#4F4F4F">Charcoal Grey</option>
                        <option value="#CD7F32">Bronze</option>
                      </select>
                    </div>
                    {frameColor === 'custom' && (
                      <input
                        type="color"
                        value={frameColor === 'custom' ? '#777777' : frameColor}
                        onChange={e => setFrameColor(e.target.value)}
                        className="color-picker"
                      />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Glass Type</label>
                    <div className="select-wrapper">
                      <select
                        value={glassType}
                        onChange={e => setGlassType(e.target.value as GlassType)}
                        className="styled-select"
                      >
                        <option value="clear">Clear</option>
                        <option value="frosted">Frosted</option>
                        <option value="custom-tint">Custom Tinted</option>
                      </select>
                    </div>
                    {glassType === 'custom-tint' && (
                      <input
                        type="color"
                        value={customGlassTint}
                        onChange={e => setCustomGlassTint(e.target.value)}
                        className="color-picker"
                      />
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'openings' && (
                <>
                  <div className="control-group">
                    <label>Opening Configuration</label>
                    <div className="opening-config">
                      {Array.from({ length: panels }).map((_, index) => (
                        <div key={index} className="panel-opening-config">
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
                          {openingPanels.includes(index) && renderOpeningDirectionSelector(index)}
                        </div>
                      ))}
                    </div>
                  </div>
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
                              <span className="division-separator">×</span>
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
                                              setOpeningPanes(prev => prev.filter(p => 
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
                                                  setOpeningPanes(prev => [...prev, {
                                                    panelIndex: division.panelIndex,
                                                    rowIndex,
                                                    colIndex,
                                                    openingDirection: 'top' as const
                                                  }]);
                                                  setActiveHingeSelector(null);
                                                }}
                                                title="Hinged from Top"
                                              >
                                                <span className="hinge-indicator">⟡</span>
                                                <span className="arrow">↓</span>
                                              </button>
                                              <button
                                                className={`direction-btn right ${foundPane?.openingDirection === 'right' ? 'active' : ''}`}
                                                onClick={() => {
                                                  setOpeningPanes(prev => [...prev, {
                                                    panelIndex: division.panelIndex,
                                                    rowIndex,
                                                    colIndex,
                                                    openingDirection: 'right' as const
                                                  }]);
                                                  setActiveHingeSelector(null);
                                                }}
                                                title="Hinged from Right"
                                              >
                                                <span className="hinge-indicator">⟡</span>
                                                <span className="arrow">←</span>
                                              </button>
                                              <button
                                                className={`direction-btn bottom ${foundPane?.openingDirection === 'bottom' ? 'active' : ''}`}
                                                onClick={() => {
                                                  setOpeningPanes(prev => [...prev, {
                                                    panelIndex: division.panelIndex,
                                                    rowIndex,
                                                    colIndex,
                                                    openingDirection: 'bottom' as const
                                                  }]);
                                                  setActiveHingeSelector(null);
                                                }}
                                                title="Hinged from Bottom"
                                              >
                                                <span className="hinge-indicator">⟡</span>
                                                <span className="arrow">↑</span>
                                              </button>
                                              <button
                                                className={`direction-btn left ${foundPane?.openingDirection === 'left' ? 'active' : ''}`}
                                                onClick={() => {
                                                  setOpeningPanes(prev => [...prev, {
                                                    panelIndex: division.panelIndex,
                                                    rowIndex,
                                                    colIndex,
                                                    openingDirection: 'left' as const
                                                  }]);
                                                  setActiveHingeSelector(null);
                                                }}
                                                title="Hinged from Left"
                                              >
                                                <span className="hinge-indicator">⟡</span>
                                                <span className="arrow">→</span>
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
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sketch-footer">
        <button className="button-secondary" onClick={onCancel}>Cancel</button>
        <button className="button-primary" onClick={handleSave}>Save Design</button>
      </div>
    </div>
  );
};

export default ProductSketch;