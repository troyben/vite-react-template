import React from 'react';
import '../../styles/ProductSketch.css';
import { useProductSketchState } from './useProductSketchState';
import FramePreview from './FramePreview';
import DimensionsTab from './tabs/DimensionsTab';
import AppearanceTab from './tabs/AppearanceTab';
import OpeningsTab from './tabs/OpeningsTab';
import PanelsTab from './tabs/PanelsTab';
import type { ProductSketchProps } from './types';

const ProductSketch: React.FC<ProductSketchProps> = (props) => {
  const state = useProductSketchState(props);

  return (
    <div className="product-modal-overlay" onClick={state.handleOverlayClick}>
      <div className="sketch-modal-inner">
        <div className="sketch-container">
          <div className="sketch-header">
            <h2>Product Configuration</h2>
          </div>

          <div className="sketch-body">
        <FramePreview
          panels={state.panels}
          panelWidths={state.panelWidths}
          width={state.width}
          height={state.height}
          unit={state.unit}
          isSliding={state.isSliding}
          frameColor={state.frameColor}
          glassType={state.glassType}
          customGlassTint={state.customGlassTint}
          openingPanels={state.openingPanels}
          openingDirections={state.openingDirections}
          panelDivisions={state.panelDivisions}
          openingPanes={state.openingPanes}
          type={state.type}
          doorType={state.doorType}
          windowType={state.windowType}
          activeHingeSelector={state.activeHingeSelector}
        />

        <div className="controls-section">
          <div className="control-group">
            <div className="form-row">
              <div className="form-group">
                <label>Product Type</label>
                <div className="button-group">
                  <button
                    className={`control-button ${state.type === 'window' ? 'active' : ''}`}
                    onClick={() => state.setType('window')}
                  >
                    Window
                  </button>
                  <button
                    className={`control-button ${state.type === 'door' ? 'active' : ''}`}
                    onClick={() => state.handleTypeChange('door')}
                  >
                    Door
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Panels</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={state.panels}
                  onChange={e => state.handlePanelCountChange(Number(e.target.value))}
                  className="styled-select"
                  style={{ width: 80 }}
                />
              </div>
            </div>
          </div>

          {/* Door/Window Type Selector */}
          <div className="control-group">
            <label>{state.type === 'door' ? 'Door Type' : 'Window Type'}</label>
            <div className="door-type-selector">
              {state.type === 'door' ? (
                <>
                  <button
                    type="button"
                    className={`door-type-btn${state.doorType === 'hinged' ? ' active' : ''}`}
                    onClick={() => state.setDoorType('hinged')}
                  >
                    Hinged
                  </button>
                  <button
                    type="button"
                    className={`door-type-btn${state.doorType === 'sliding' ? ' active' : ''}`}
                    onClick={() => state.setDoorType('sliding')}
                  >
                    Sliding
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`door-type-btn${state.windowType === 'hinged' ? ' active' : ''}`}
                    onClick={() => state.setWindowType('hinged')}
                  >
                    Hinged
                  </button>
                  <button
                    type="button"
                    className={`door-type-btn${state.windowType === 'sliding' ? ' active' : ''}`}
                    onClick={() => state.setWindowType('sliding')}
                  >
                    Sliding
                  </button>
                </>
              )}
            </div>
          </div>


          {/* --- Tabs UI --- */}
          <div className="sketch-tabs">
            <div className="sketch-tabs-header" style={{ display: 'flex', gap: 8 }}>
              <button
                className={`sketch-tab-btn${state.activeTab === 'dimensions' ? ' active' : ''}`}
                onClick={() => state.setActiveTab('dimensions')}
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
                className={`sketch-tab-btn${state.activeTab === 'appearance' ? ' active' : ''}`}
                onClick={() => state.setActiveTab('appearance')}
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
                className={`sketch-tab-btn${state.activeTab === 'openings' ? ' active' : ''}`}
                onClick={() => state.setActiveTab('openings')}
                type="button"
                title="Configurations"
              >
                <img
                  src="/cogs.svg"
                  alt="Configurations"
                  style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                />
              </button>
              <button
                className={`sketch-tab-btn${state.activeTab === 'panels' ? ' active' : ''}`}
                onClick={() => state.setActiveTab('panels')}
                type="button"
                title="Panels"
              >
                <img
                  src="/grid.svg"
                  alt="Panels"
                  style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                />
              </button>
            </div>
            <div className="sketch-tabs-content" style={{ marginTop: 8 }}>
              {state.activeTab === 'dimensions' && (
                <DimensionsTab
                  width={state.width}
                  height={state.height}
                  unit={state.unit}
                  panels={state.panels}
                  panelWidths={state.panelWidths}
                  setWidth={state.setWidth}
                  setUnit={state.setUnit}
                  handleDimensionChange={state.handleDimensionChange}
                  handlePanelWidthChange={state.handlePanelWidthChange}
                />
              )}

              {state.activeTab === 'appearance' && (
                <AppearanceTab
                  frameColor={state.frameColor}
                  glassType={state.glassType}
                  customGlassTint={state.customGlassTint}
                  setFrameColor={state.setFrameColor}
                  setGlassType={state.setGlassType}
                  setCustomGlassTint={state.setCustomGlassTint}
                />
              )}

              {state.activeTab === 'openings' && (
                <OpeningsTab
                  panels={state.panels}
                  openingPanels={state.openingPanels}
                  openingDirections={state.openingDirections}
                  type={state.type}
                  setOpeningPanels={state.setOpeningPanels}
                  setOpeningDirections={state.setOpeningDirections}
                />
              )}

              {state.activeTab === 'panels' && (
                <PanelsTab
                  panels={state.panels}
                  height={state.height}
                  unit={state.unit}
                  panelWidths={state.panelWidths}
                  panelDivisions={state.panelDivisions}
                  panelDivisionHeights={state.panelDivisionHeights}
                  panelDivisionWidths={state.panelDivisionWidths}
                  openingPanes={state.openingPanes}
                  activeHingeSelector={state.activeHingeSelector}
                  setPanelDivisions={state.setPanelDivisions}
                  setPanelDivisionHeights={state.setPanelDivisionHeights}
                  setPanelDivisionWidths={state.setPanelDivisionWidths}
                  setOpeningPanes={state.setOpeningPanes}
                  setActiveHingeSelector={state.setActiveHingeSelector}
                />
              )}
            </div>
          </div>
        </div>
          </div>

          <div className="sketch-footer">
            <button className="button-secondary" onClick={state.onCancel}>Cancel</button>
            <button className="button-primary" onClick={state.handleSave}>Save Design</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSketch;
