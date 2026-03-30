import type { QuotationItem } from '@/services/quotationService';
import MiniSketchPreview from '@/components/MiniSketchPreview';

interface QuotationItemRowProps {
  item: QuotationItem;
}

function SketchDetails({ sketchData }: { sketchData: any }) {
  const openingCount = sketchData.openingPanels?.length || 0;
  const dividedPanelsCount = sketchData.panelDivisions?.length || 0;
  const openingPanesCount = sketchData.openingPanes?.length || 0;

  return (
    <div className="sketch-details-grid">
      <div className="sketch-details-main">
        <div className="sketch-type">
          {sketchData.type === 'door' ? `${sketchData.doorType} Door` : 'Window'}
        </div>
        <div className="sketch-dimensions">
          {sketchData.width} &times; {sketchData.height} {sketchData.unit}
        </div>
      </div>
      <div className="sketch-details-specs">
        <div className="spec-item">
          <span className="spec-label">Panels:</span>
          <span className="spec-value">{sketchData.panels} total ({openingCount} opening)</span>
        </div>
        {dividedPanelsCount > 0 && (
          <div className="spec-item">
            <span className="spec-label">Divided Panels:</span>
            <span className="spec-value">{dividedPanelsCount} panels with divisions</span>
          </div>
        )}
        {openingPanesCount > 0 && (
          <div className="spec-item">
            <span className="spec-label">Opening Panes:</span>
            <span className="spec-value">{openingPanesCount} panes</span>
          </div>
        )}
        <div className="spec-item">
          <span className="spec-label">Frame:</span>
          <span className="spec-value">
            {sketchData.frameColor === '#C0C0C0' ? 'Natural/Silver' :
             sketchData.frameColor === '#4F4F4F' ? 'Charcoal Grey' :
             sketchData.frameColor === '#CD7F32' ? 'Bronze' : 'Custom'}
          </span>
        </div>
        <div className="spec-item">
          <span className="spec-label">Glass:</span>
          <span className="spec-value">{sketchData.glassType}</span>
        </div>
      </div>
    </div>
  );
}

export function QuotationItemRow({ item }: QuotationItemRowProps) {
  const sketchData = item.productSketch;

  return (
    <tr>
      <td>
        <div>{item.item}</div>
        <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>{item.description}</div>
        <br />
        {sketchData && (
          <div className="preview-sketch">
            <div className="sketch-preview-container">
              <div className="sketch-preview-specs">
                <SketchDetails sketchData={sketchData} />
              </div>
              <MiniSketchPreview sketch={sketchData} widthPx={320} heightPx={160} />
            </div>
          </div>
        )}
      </td>
      <td>{item.quantity}</td>
      <td>${item.price.toFixed(2)}</td>
      <td className="text-right">${item.total.toFixed(2)}</td>
    </tr>
  );
}
