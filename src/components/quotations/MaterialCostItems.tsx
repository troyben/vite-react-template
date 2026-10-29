import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { materialItemCostLabel } from '@/services/materialCostReportService';
import type { MaterialCostReportData } from '@/services/materialCostReportService';
import type { QuotationItem } from '@/services/quotationService';
import { MaterialCostItemDetails } from './MaterialCostItemDetails';
import { ProductMaterialCosts } from './ProductMaterialCosts';
import type { MaterialCostEditing } from './materialCostEditing';

interface MaterialCostItemsProps { report: MaterialCostReportData; items: QuotationItem[]; editing?: MaterialCostEditing }
export const MaterialCostItems: React.FC<MaterialCostItemsProps> = ({ report, items, editing }) => (
  <div className="rounded-lg border">
    <Table className="material-cost-items min-w-[760px] table-fixed">
      <TableHeader><TableRow className="bg-muted/30">
        <TableHead className="h-8 w-9 px-2 text-xs">#</TableHead>
        <TableHead className="h-8 w-[34%] px-2 text-xs">Sketch / item</TableHead>
        <TableHead className="h-8 px-2 text-xs">Materials</TableHead>
        <TableHead className="h-8 w-24 px-2 text-right text-xs">Subtotal</TableHead>
      </TableRow></TableHeader>
      <TableBody>{report.items.map(item => <TableRow key={items[item.index]?.id ?? item.index}>
        <TableCell className="px-2 py-2 align-top text-xs text-muted-foreground">{item.index + 1}</TableCell>
        <TableCell className="px-2 py-2 align-top"><MaterialCostItemDetails item={item} sketch={items[item.index]?.productSketch} /></TableCell>
        <TableCell className="px-2 py-1 align-top whitespace-normal">
          <ProductMaterialCosts item={item} itemId={items[item.index]?.id} lines={item.lines} currency={report.currency} editing={items[item.index]?.id ? editing : undefined} />
        </TableCell>
        <TableCell className="px-2 py-3 text-right align-top text-sm font-semibold">
          <span className={item.status === 'not_configured' || (item.status === 'needs_review' && item.lines.length === 0) ? 'block whitespace-normal text-xs leading-4 text-amber-800 dark:text-amber-300' : undefined}>
            {materialItemCostLabel(item, report.currency)}
          </span>
        </TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </div>
);
