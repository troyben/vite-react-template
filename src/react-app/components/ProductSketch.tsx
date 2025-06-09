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

  const renderDoorHandle = (isDoor: boolean) => {
    if (isDoor) {
      return (
        <div 
          className="door-handle"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            width: '20px',
            height: '40px',
            backgroundColor: frameColor,
            borderRadius: '4px',
            transform: 'translateY(-50%)',
            border: '2px solid rgba(0,0,0,0.2)'
          }}
        />
      );
    }
    return null;
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
              backgroundColor: frameColor,
              display: 'grid',
              gridTemplateColumns: `repeat(${panels}, 1fr)`,
              position: 'relative'
            }}
          >
            {Array.from({ length: panels }).map((_, panelIndex) => (
              <div 
                key={panelIndex}
                className="panel"
                style={{
                  border: '1px solid rgba(0,0,0,0.2)',
                  backgroundColor: glassType === 'clear' ? 'rgba(200,200,255,0.3)' : 
                    glassType === 'tinted' ? 'rgba(100,100,100,0.5)' :
                    glassType === 'frosted' ? 'rgba(255,255,255,0.8)' :
                    glassType === 'reflective' ? 'rgba(200,200,200,0.7)' :
                    customGlassTint + '80'
                }}
              />
            ))}
            {type === 'door' && renderDoorHandle(true)}
          </div>
        </div>

        <div className="controls-section">
          <div className="control-group">
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
            <div className="control-group">
              <label>Width (cm)</label>
              <input
                type="number"
                value={width}
                onChange={e => setWidth(Math.max(20, Math.min(500, Number(e.target.value))))}
                min={20}
                max={500}
              />
            </div>
            
            <div className="control-group">
              <label>Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(Math.max(20, Math.min(500, Number(e.target.value))))}
                min={20}
                max={500}
              />
            </div>
          </div>
          
          <div className="control-group">
            <label>Panels</label>
            <input
              type="range"
              min={1}
              max={6}
              value={panels}
              onChange={e => setPanels(Number(e.target.value))}
            />
            <span>{panels} panel{panels !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="control-group">
            <label>Frame Color</label>
            <select value={frameColor} onChange={e => setFrameColor(e.target.value)}>
              <option value="#777777">Silver</option>
              <option value="#FFFFFF">White</option>
              <option value="#000000">Black</option>
              <option value="#8B4513">Brown</option>
              <option value="custom">Custom...</option>
            </select>
            {frameColor === 'custom' && (
              <input
                type="color"
                value={frameColor === 'custom' ? '#777777' : frameColor}
                onChange={e => setFrameColor(e.target.value)}
              />
            )}
          </div>
          
          <div className="control-group">
            <label>Glass Type</label>
            <select
              value={glassType}
              onChange={e => setGlassType(e.target.value as typeof glassType)}
            >
              <option value="clear">Clear</option>
              <option value="tinted">Tinted</option>
              <option value="frosted">Frosted</option>
              <option value="reflective">Reflective</option>
              <option value="custom-tint">Custom Tint</option>
            </select>
            {glassType === 'custom-tint' && (
              <input
                type="color"
                value={customGlassTint}
                onChange={e => setCustomGlassTint(e.target.value)}
              />
            )}
          </div>

          <div className="control-group">
            <label>Opening Panels</label>
            <div className="panel-selector">
              {Array.from({ length: panels }).map((_, index) => (
                <div key={index} className="panel-select-item">
                  <input
                    type="checkbox"
                    checked={openingPanels.includes(index)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOpeningPanels([...openingPanels, index]);
                      } else {
                        setOpeningPanels(openingPanels.filter(p => p !== index));
                      }
                    }}
                  />
                  <label>Panel {index + 1}</label>
                </div>
              ))}
            </div>
          </div>

          {openingPanels.length > 0 && (
            <div className="control-group">
              <label>Opening Directions</label>
              <div className="directions-selector">
                {openingPanels.map(panelIndex => (
                  <div key={panelIndex} className="direction-select-item">
                    <label>Panel {panelIndex + 1}:</label>
                    <select
                      value={openingDirections[panelIndex] || 'left'}
                      onChange={(e) => {
                        setOpeningDirections({
                          ...openingDirections,
                          [panelIndex]: e.target.value as 'left' | 'right'
                        });
                      }}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel Divisions Controls */}
          <div className="control-group">
            <label>Panel Divisions</label>
            {Array.from({ length: panels }).map((_, panelIndex) => {
              const division = panelDivisions.find(d => d.panelIndex === panelIndex) || {
                panelIndex,
                horizontalCount: 1,
                verticalCount: 1
              };
              
              return (
                <div key={panelIndex} className="panel-division-controls">
                  <label>Panel {panelIndex + 1}</label>
                  <div className="division-inputs">
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
                    <span>×</span>
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
              );
            })}
          </div>

          {/* Opening Panes Controls */}
          <div className="control-group">
            <label>Opening Panes</label>
            {panelDivisions.map(division => {
              const rows = division.horizontalCount;
              const cols = division.verticalCount;
              
              return (
                <div key={division.panelIndex} className="pane-selector">
                  <label>Panel {division.panelIndex + 1}</label>
                  <div className="pane-grid" style={{ 
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '4px',
                    margin: '8px 0'
                  }}>
                    {Array.from({ length: rows * cols }).map((_, index) => {
                      const rowIndex = Math.floor(index / cols);
                      const colIndex = index % cols;
                      const isOpening = openingPanes.some(p => 
                        p.panelIndex === division.panelIndex && 
                        p.rowIndex === rowIndex && 
                        p.colIndex === colIndex
                      );
                      
                      return (
                        <div 
                          key={index}
                          className={`pane ${isOpening ? 'opening' : ''}`}
                          onClick={() => {
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
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '1px solid #ccc',
                            backgroundColor: isOpening ? '#e0e0e0' : 'transparent',
                            cursor: 'pointer'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
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