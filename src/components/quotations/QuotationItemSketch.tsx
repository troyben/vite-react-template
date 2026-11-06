import { Image, LayoutTemplate } from 'lucide-react';
import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import { extractShapeCanvasProps } from '@/utils/templateSketchProps';
import type { QuotationItem } from '@/services/quotationService';
import type { QuotationItemEditing } from './quotationItemEditing';

interface QuotationItemSketchProps { item: QuotationItem; index: number; editing?: QuotationItemEditing; compact?: boolean }
export const QuotationItemSketch: React.FC<QuotationItemSketchProps> = ({ item, index, editing, compact }) => {
  const sketch = item.productSketch;
  return sketch ? <div className="flex flex-col gap-0.5">
    <div className={`${compact ? 'w-[100px] h-[70px]' : 'w-[144px] h-[80px]'} ${editing ? 'cursor-pointer' : ''}`}
      onClick={editing ? () => editing.onSketch(index) : undefined} role={editing ? 'button' : undefined} tabIndex={editing ? 0 : undefined}
      aria-label={`${editing ? 'Edit sketch' : 'Sketch'} for item ${index + 1}`}
      onKeyDown={editing ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); editing.onSketch(index); } } : undefined}>
      <ShapeCanvas {...extractShapeCanvasProps(sketch)} svgStyle={{ width: '100%', height: '100%' }} />
    </div>
    {compact && <div className="text-xs text-muted-foreground"><p>{sketch.width} × {sketch.height} {sketch.unit}</p><p>{sketch.panels}P · {sketch.openingPanels?.length || 0} opening</p></div>}
    {editing && <div className="flex flex-wrap justify-center gap-1 text-[10px] leading-3.5">
      <button type="button" className="text-primary hover:underline" onClick={() => editing.onSketch(index)}>Edit</button><span>·</span>
      <button type="button" className="text-destructive hover:underline" onClick={() => editing.onRemoveSketch(index)}>Remove</button><span>·</span>
      <button type="button" className="text-primary hover:underline" onClick={() => editing.onSaveTemplate(sketch)}>Save Template</button>
    </div>}
  </div> : editing ? <div className={`flex gap-1 ${compact ? 'flex-col' : ''}`}>
    <button type="button" onClick={() => editing.onSketch(index)} className="flex items-center gap-1 rounded border border-dashed px-1.5 py-1 text-[10px] text-muted-foreground hover:text-primary"><Image className="h-3 w-3" />Sketch</button>
    <button type="button" onClick={() => editing.onTemplate(index)} className="flex items-center gap-1 rounded border border-dashed px-1.5 py-1 text-[10px] text-muted-foreground hover:text-primary"><LayoutTemplate className="h-3 w-3" />Template</button>
  </div> : <span className="text-xs text-muted-foreground">No sketch</span>;
};
