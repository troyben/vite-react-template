import React from 'react';
import { ProductData } from './ProductSketch';

interface SketchPreviewMiniProps {
  data: ProductData;
  size?: 'tiny' | 'small' | 'medium';
  showDimensions?: boolean;
  dimensionStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

const SketchPreviewMini: React.FC<SketchPreviewMiniProps> = ({
  data,
  size = 'medium',
  showDimensions = true
}) => {
  // Panel/pane/door opening styles and logic copied from QuotationForm.tsx
  const dimensions = {
    tiny: { width: 60, height: 40 },
    small: { width: 120, height: 80 },
    medium: { width: 600, height: 340 }
  }[size];

  const panelCount = data.panels || 1;
  const frameColor = data.frameColor || '#C0C0C0';

  // Use panelWidths if available, else equal widths
  const panelWidths =
    data.panelWidths && data.panelWidths.length === panelCount
      ? data.panelWidths
      : Array(panelCount).fill(1);

  // Normalize widths for flex
  const total = panelWidths.reduce((a, b) => a + b, 0);
  const flexes = panelWidths.map((w) => w / total);

  // --- Panel rendering with opening and division logic ---
  const renderMiniPreviewPanel = (sketch: ProductData, panelIndex: number) => {
    const isOpening = sketch.openingPanels?.includes(panelIndex);
    const openingDirection = sketch.openingDirections?.[panelIndex];
    const division = sketch.panelDivisions?.find(d => d.panelIndex === panelIndex);
    const isSliding = sketch.type === 'door' && sketch.doorType === 'sliding';

    const frameColor = sketch.frameColor || '#C0C0C0';
    const glassColor =
      sketch.glassType === 'clear'
        ? 'rgba(200,200,255,0.3)'
        : sketch.glassType === 'frosted'
        ? 'rgba(255,255,255,0.8)'
        : sketch.glassType === 'custom-tint'
        ? `${sketch.customGlassTint || '#AEEEEE'}80`
        : 'rgba(200,200,255,0.3)';
    const divisionBorder =
      frameColor === '#4F4F4F'
        ? '#BDBDBD'
        : frameColor === '#CD7F32'
        ? '#A67C52'
        : 'rgba(0,0,0,0.18)';
    const openingHighlight = isOpening ? 'rgba(124, 93, 250, 0.18)' : glassColor;

    // --- Opening transform and shadow for mini preview ---
    const getTransform = () => {
      if (!isOpening) return 'none';
      if (isSliding) {
        if (openingDirection === 'left') return 'translateX(-50%)';
        if (openingDirection === 'right') return 'translateX(50%)';
        return 'none';
      }
      switch (openingDirection) {
        case 'left':
          return 'perspective(1200px) translateX(-24%) rotateY(-55deg) scaleX(0.97)';
        case 'right':
          return 'perspective(1200px) translateX(24%) rotateY(55deg) scaleX(0.97)';
        case 'top':
          return 'perspective(1200px) translateY(-16%) rotateX(50deg) scaleY(0.97)';
        case 'bottom':
          return 'perspective(1200px) translateY(16%) rotateX(-50deg) scaleY(0.97)';
        default:
          return 'none';
      }
    };
    const getTransformOrigin = () => {
      if (!isOpening) return 'center';
      switch (openingDirection) {
        case 'left': return 'left center';
        case 'right': return 'right center';
        case 'top': return 'center top';
        case 'bottom': return 'center bottom';
        default: return 'center';
      }
    };
    const getBoxShadow = () => {
      if (!isOpening) return 'none';
      return '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
    };

    // --- Division grid ---
    if (division && (division.horizontalCount > 1 || division.verticalCount > 1)) {
      const cells = [];
      for (let row = 0; row < division.horizontalCount; row++) {
        for (let col = 0; col < division.verticalCount; col++) {
          const isPaneOpening =
            sketch.openingPanes?.some(
              (p) =>
                p.panelIndex === panelIndex &&
                p.rowIndex === row &&
                p.colIndex === col
            ) ?? false;
          // Opening pane transform
          let paneTransform = 'none';
          let paneOrigin = 'center';
          let paneShadow = 'none';
          let marginStyle: React.CSSProperties = {};
          if (isPaneOpening) {
            const paneDir = sketch.openingPanes?.find(
              (p) =>
                p.panelIndex === panelIndex &&
                p.rowIndex === row &&
                p.colIndex === col
            )?.openingDirection;
            switch (paneDir) {
              case 'left':
                paneTransform = 'perspective(1200px) translateX(-18%) rotateY(-55deg) scaleX(0.97)';
                paneOrigin = 'left center';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginLeft: '16px' };
                break;
              case 'right':
                paneTransform = 'perspective(1200px) translateX(18%) rotateY(55deg) scaleX(0.97)';
                paneOrigin = 'right center';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginRight: '16px' };
                break;
              case 'top':
                paneTransform = 'perspective(1200px) translateY(-20%) rotateX(50deg) scaleY(0.97)';
                paneOrigin = 'center top';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginTop: '10px' };
                break;
              case 'bottom':
                paneTransform = 'perspective(1200px) translateY(10%) rotateX(-50deg) scaleY(0.97)';
                paneOrigin = 'center bottom';
                paneShadow = '0 16px 40px 0 rgba(124,93,250,0.18), 0 6px 16px 0 rgba(0,0,0,0.13)';
                marginStyle = { marginBottom: '10px' };
                break;
              default:
                break;
            }
          }
          cells.push(
            <div
              key={`cell-${row}-${col}`}
              style={{
                border: `1px solid ${divisionBorder}`,
                background: isPaneOpening
                  ? 'rgba(124, 93, 250, 0.18)'
                  : glassColor,
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                borderRadius: 0,
                transition: 'background 0.2s, transform 0.3s',
                transform: paneTransform,
                transformOrigin: paneOrigin,
                boxShadow: paneShadow,
                ...marginStyle,
              }}
            />
          );
        }
      }
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${division.verticalCount}, 1fr)`,
            gridTemplateRows: `repeat(${division.horizontalCount}, 1fr)`,
            width: '100%',
            height: '100%',
            border: `1.5px solid ${frameColor}`,
            borderRadius: 0,
            background: '#f8fafd',
            overflow: 'hidden',
            minHeight: 60,
            minWidth: 60,
          }}
        >
          {cells}
        </div>
      );
    }

    // --- Single panel ---
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `1.5px solid ${frameColor}`,
          borderRadius: 0,
          background: openingHighlight,
          boxSizing: 'border-box',
          minHeight: 60,
          minWidth: 60,
          transform: getTransform(),
          transformOrigin: getTransformOrigin(),
          transition: 'transform 0.3s, box-shadow 0.3s',
          boxShadow: getBoxShadow(),
          marginLeft: isOpening && openingDirection === 'left' ? '24px' : undefined,
          marginRight: isOpening && openingDirection === 'right' ? '24px' : undefined,
          marginTop: isOpening && openingDirection === 'top' ? '14px' : undefined,
          marginBottom: isOpening && openingDirection === 'bottom' ? '14px' : undefined,
        }}
      />
    );
  };

  // --- Dimension lines for the preview ---
  const renderMiniPreviewDimensionLines = (sketch: ProductData, widthPx: number, heightPx: number) => {
    const { width, height, unit, panels, panelWidths } = sketch;
    const frameWidth = widthPx;
    const frameHeight = heightPx;
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
        {/* Panel widths dimension lines at the top */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `-${offset + 5}px`,
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
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${panel.start}px`,
                  top: "-5px",
                  width: `${panel.width}px`,
                  height: 0,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: `${panel.width}px`,
                    height: 0,
                    borderTop: '1px dashed #BDBDBD',
                    top: 0,
                  }}
                />
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
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: "-20px",
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    color: '#7E88C3',
                    fontWeight: 500,
                    fontSize: 16,
                    padding: '0 8px',
                    borderRadius: 3,
                    border: '1px solid #DFE3FA',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {panelWidths ? panelWidths[i] : Math.round(width / panels)} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom horizontal dimension (width) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${frameHeight + 10}px`,
            transform: `translateX(-50%)`,
            width: `${frameWidth}px`,
            height: '20px',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: 0 }}>
            <div
              style={{
                width: '100%',
                height: 0,
                borderTop: '1px solid #7E88C3',
                position: 'absolute',
                top: 10,
                left: 0,
              }}
            />
            <div
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
            <div
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
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: 16,
                transform: 'translateX(-50%)',
                background: '#fff',
                color: '#7E88C3',
                fontWeight: 600,
                fontSize: 16,
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
          style={{
            position: 'absolute',
            left: `-${offset + 25}px`,
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
            <div
              style={{
                height: '100%',
                width: 0,
                borderLeft: '1px solid #7E88C3',
                position: 'absolute',
                left: 10,
                top: 0,
              }}
            />
            <div
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
            <div
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
            <span
              style={{
                position: 'absolute',
                left: 25,
                top: '50%',
                transform: 'translate(-100%, -50%) rotate(-90deg)',
                background: '#fff',
                color: '#7E88C3',
                fontWeight: 600,
                fontSize: 16,
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
    <div className="sketch-preview-wrapper" style={{ padding: showDimensions ? '20px' : '0', position: 'relative' }}>
      {showDimensions && renderMiniPreviewDimensionLines(data, dimensions.width, dimensions.height)}
      <div
        className="sketch-preview-frame"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: frameColor,
          border: `2px solid ${frameColor}`,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {Array.from({ length: panelCount }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: flexes[i],
              height: '100%',
              minWidth: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'stretch'
            }}
          >
            {renderMiniPreviewPanel(data, i)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SketchPreviewMini;
