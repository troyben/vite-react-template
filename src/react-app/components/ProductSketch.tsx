import React, { useState } from 'react';
import '../styles/ProductSketch.css';

export interface ProductData {
  type: 'window' | 'door';
  doorType?: 'traditional' | 'modern' | 'sliding';
  width: number;
  height: number;
  panels: number;
  openingPanels?: number[];
  openingDirections?: Record<number, 'left' | 'right'>;
  frameColor?: string;
  glassType?: 'clear' | 'tinted' | 'frosted' | 'reflective' | 'custom-tint';
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
  }>;
  sketchSvg?: string;
}

interface ProductSketchProps {
  onSave: (data: ProductData) => void;
  onCancel: () => void;
  initialData?: ProductData;
}

const ProductSketch: React.FC<ProductSketchProps> = ({ onSave, onCancel, initialData }) => {
  // Basic product state
  const [type, setType] = useState<'window' | 'door'>(initialData?.type || 'window');
  const [doorType, setDoorType] = useState<'traditional' | 'modern' | 'sliding'>(
    initialData?.doorType || 'traditional'
  );
  const [width, setWidth] = useState<number>(initialData?.width || 100);
  const [height, setHeight] = useState<number>(initialData?.height || 100);
  const [panels, setPanels] = useState<number>(initialData?.panels || 1);

  // Panel and opening state
  const [openingPanels, setOpeningPanels] = useState<number[]>(
    initialData?.openingPanels || []
  );
  const [openingDirections, setOpeningDirections] = useState<Record<number, 'left' | 'right'>>(
    initialData?.openingDirections || {}
  );
  const [frameColor, setFrameColor] = useState<string>(initialData?.frameColor || '#777777');
  const [glassType, setGlassType] = useState<'clear' | 'tinted' | 'frosted' | 'reflective' | 'custom-tint'>(
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
  }>>(initialData?.openingPanes || []);

  const handleSave = () => {
    const data: ProductData = {
      type,
      doorType: type === 'door' ? doorType : undefined,
      width,
      height,
      panels,
      openingPanels,
      openingDirections,
      frameColor,
      glassType,
      customGlassTint: glassType === 'custom-tint' ? customGlassTint : undefined,
      panelDivisions,
      openingPanes
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

  const renderPanelDivisions = (panelIndex: number) => {
    const division = panelDivisions.find(d => d.panelIndex === panelIndex);
    if (!division) return null;

    return (
      <div
        className="panel-divisions"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
          gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
          height: '100%',
          gap: '2px'
        }}
      >
        {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, index) => {
          const rowIndex = Math.floor(index / division.verticalCount);
          const colIndex = index % division.verticalCount;
          const isOpening = openingPanes.some(p => 
            p.panelIndex === panelIndex && 
            p.rowIndex === rowIndex && 
            p.colIndex === colIndex
          );

          return (
            <div
              key={index}
              className={`panel-division ${isOpening ? 'opening' : ''}`}
              style={{
                border: '1px solid rgba(0,0,0,0.1)',
                backgroundColor: isOpening ? 'rgba(124, 93, 250, 0.1)' : 'transparent'
              }}
            />
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
        return `translateX(${openingDirection === 'left' ? '-50%' : '50%'})`;
      }
      return `rotateY(${openingDirection === 'left' ? '-30deg' : '30deg'})`;
    };

    const getGlassStyle = () => {
      switch (glassType) {
        case 'clear': return 'rgba(200, 200, 255, 0.3)';
        case 'tinted': return 'rgba(100, 100, 100, 0.5)';
        case 'frosted': return 'rgba(255, 255, 255, 0.8)';
        case 'reflective': return 'rgba(200, 200, 200, 0.7)';
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
          position: 'relative',
          transform: getTransform(),
          transformOrigin: openingDirection === 'left' ? 'left' : 'right',
          transition: `transform 0.3s ease${isSliding ? ', z-index 0s' : ''}`,
          zIndex: isSliding && isOpening ? 2 : 1,
          backgroundColor: getGlassStyle(),
          boxShadow: isOpening ? `2px 0 4px rgba(0,0,0,0.1)` : 'none'
        }}
      >
        {renderPanelDivisions(panelIndex)}
        {isOpening && (
          <div 
            className="handle"
            style={{
              position: 'absolute',
              [openingDirection === 'left' ? 'right' : 'left']: '10px',
              top: '50%',
              width: '4px',
              height: '40px',
              backgroundColor: frameColor,
              borderRadius: '2px',
              transform: 'translateY(-50%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="sketch-container">
      <div className="sketch-header">
        <h2>Product Configuration</h2>
      </div>

      <div className="sketch-body">
        <div className="product-preview">
          <div 
            className="product-frame"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              border: `3px solid ${frameColor}`,
              display: 'grid',
              gridTemplateColumns: `repeat(${panels}, 1fr)`,
              position: 'relative',
              borderRadius: type === 'door' && doorType === 'modern' ? '4px' : '0',
              perspective: '1000px',
              overflow: type === 'door' && doorType === 'sliding' ? 'hidden' : 'visible',
              gap: '2px',
              backgroundColor: frameColor,
              padding: '2px'
            }}
          >
            {Array.from({ length: panels }).map((_, index) => renderPanel(index))}
          </div>
          
          <div className="preview-info">
            <div className="preview-type">
              {type === 'door' ? `${doorType} Door` : 'Window'}
            </div>
            <div className="preview-dimensions">
              {width} × {height} cm
            </div>
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
                    onClick={() => setType('door')}
                  >
                    Door
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Panels</label>
                <select
                  value={panels}
                  onChange={(e) => setPanels(Number(e.target.value))}
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
          
          {type === 'door' && (
            <div className="control-group">
              <label>Door Type</label>
              <div className="button-group">
                <button 
                  className={`control-button ${doorType === 'traditional' ? 'active' : ''}`}
                  onClick={() => setDoorType('traditional')}
                >
                  Traditional
                </button>
                <button 
                  className={`control-button ${doorType === 'modern' ? 'active' : ''}`}
                  onClick={() => setDoorType('modern')}
                >
                  Modern
                </button>
                <button 
                  className={`control-button ${doorType === 'sliding' ? 'active' : ''}`}
                  onClick={() => setDoorType('sliding')}
                >
                  Sliding
                </button>
              </div>
            </div>
          )}
          
          <div className="dimensions">
            <div className="form-group">
              <label>Width (cm)</label>
              <input
                type="number"
                value={width}
                onChange={e => handleDimensionChange(e.target.value, 'width')}
                min="1"
                step="1"
                className="dimension-input"
              />
            </div>
            
            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={e => handleDimensionChange(e.target.value, 'height')}
                min="1"
                step="1"
                className="dimension-input"
              />
            </div>
          </div>
          
          {/* Frame Color and Glass Type in one row with improved styling */}
          <div className="form-row settings-row">
            <div className="form-group">
              <label>Frame Color</label>
              <div className="select-wrapper">
                <select 
                  value={frameColor} 
                  onChange={e => setFrameColor(e.target.value)}
                  className="styled-select"
                >
                  <option value="#777777">Silver</option>
                  <option value="#FFFFFF">White</option>
                  <option value="#000000">Black</option>
                  <option value="#8B4513">Brown</option>
                  <option value="custom">Custom...</option>
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
                  onChange={e => setGlassType(e.target.value as typeof glassType)}
                  className="styled-select"
                >
                  <option value="clear">Clear</option>
                  <option value="tinted">Tinted</option>
                  <option value="frosted">Frosted</option>
                  <option value="reflective">Reflective</option>
                  <option value="custom-tint">Custom Tint</option>
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
                  
                  {openingPanels.includes(index) && (
                    <div className="opening-direction-selector">
                      <button
                        type="button"
                        className={`direction-btn ${openingDirections[index] === 'left' ? 'active' : ''}`}
                        onClick={() => setOpeningDirections({
                          ...openingDirections,
                          [index]: 'left'
                        })}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Opens Left
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${openingDirections[index] === 'right' ? 'active' : ''}`}
                        onClick={() => setOpeningDirections({
                          ...openingDirections,
                          [index]: 'right'
                        })}
                      >
                        Opens Right
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Panel Divisions Controls */}
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
                      <div className="panel-config-preview">
                        <div 
                          className="mini-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
                            gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
                            gap: '2px',
                            padding: '4px',
                            background: '#DFE3FA',
                            borderRadius: '4px'
                          }}
                        >
                          {Array.from({ length: division.horizontalCount * division.verticalCount }).map((_, i) => (
                            <div key={i} className="mini-cell" />
                          ))}
                        </div>
                      </div>
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
                            const isOpening = openingPanes.some(p => 
                              p.panelIndex === division.panelIndex && 
                              p.rowIndex === rowIndex && 
                              p.colIndex === colIndex
                            );
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                className={`pane-toggle ${isOpening ? 'active' : ''}`}
                                onClick={(e) => {
                                  // Allow multiple selection with shift key
                                  if (!e.shiftKey && !isOpening) {
                                    // Clear other selections in same panel if not shift-clicking
                                    setOpeningPanes(openingPanes.filter(p => p.panelIndex !== division.panelIndex));
                                  }
                                  
                                  if (isOpening) {
                                    setOpeningPanes(openingPanes.filter(p => 
                                      !(p.panelIndex === division.panelIndex && 
                                        p.rowIndex === rowIndex && 
                                        p.colIndex === colIndex)
                                    ));
                                  } else {
                                    setOpeningPanes([...openingPanes, {
                                      panelIndex: division.panelIndex,
                                      rowIndex,
                                      colIndex
                                    }]);
                                  }
                                }}
                              />
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