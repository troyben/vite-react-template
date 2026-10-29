import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import type { ProductData } from '@/components/product-editor/types';
import { extractShapeCanvasProps } from '@/utils/templateSketchProps';
import type { MaterialCostReportItem } from '@/services/materialCostReportService';

interface MaterialCostItemDetailsProps { item: MaterialCostReportItem; sketch?: ProductData }
export const MaterialCostItemDetails: React.FC<MaterialCostItemDetailsProps> = ({ item, sketch }) => (
  <div className="flex items-center gap-2.5">
    <div className="h-[80px] w-[112px] shrink-0" role="img" aria-label={`Sketch for ${item.name}`}>
      {sketch ? <ShapeCanvas {...extractShapeCanvasProps(sketch)} svgStyle={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
        : <div className="flex h-full items-center justify-center rounded border border-dashed text-xs text-muted-foreground">No sketch</div>}
    </div>
    <div className="min-w-0 space-y-0.5 whitespace-normal">
      <h2 className="text-sm font-medium leading-4">{item.name}</h2>
      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
      {item.description && <p className="whitespace-pre-line break-words text-[11px] leading-3.5 text-muted-foreground">{item.description}</p>}
    </div>
  </div>
);
