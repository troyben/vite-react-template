import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportData } from '@/services/materialCostReportService';
import type { QuotationItem } from '@/services/quotationService';
import { MaterialCostItemDetails } from './MaterialCostItemDetails';
import { MaterialCostTable } from './MaterialCostTable';

interface MaterialCostItemsProps { report: MaterialCostReportData; items: QuotationItem[] }
export const MaterialCostItems: React.FC<MaterialCostItemsProps> = ({ report, items }) => (
  <div className="rounded-lg border">
    <Table className="material-cost-items min-w-[760px] table-fixed">
      <TableHeader><TableRow className="bg-muted/30">
        <TableHead className="h-8 w-9 px-2 text-xs">#</TableHead>
        <TableHead className="h-8 w-[34%] px-2 text-xs">Sketch / item</TableHead>
        <TableHead className="h-8 px-2 text-xs">Materials</TableHead>
        <TableHead className="h-8 w-24 px-2 text-right text-xs">Subtotal</TableHead>
      </TableRow></TableHeader>
      <TableBody>{report.items.map(item => <TableRow key={item.index}>
        <TableCell className="px-2 py-2 align-top text-xs text-muted-foreground">{item.index + 1}</TableCell>
        <TableCell className="px-2 py-2 align-top"><MaterialCostItemDetails item={item} sketch={items[item.index]?.productSketch} /></TableCell>
        <TableCell className="px-2 py-1 align-top whitespace-normal">
          {item.lines.length > 0 ? <MaterialCostTable lines={item.lines} currency={report.currency} />
            : <p className="py-2 text-xs text-muted-foreground">No automatic material costs. Review any material checks above.</p>}
        </TableCell>
        <TableCell className="px-2 py-3 text-right align-top text-sm font-semibold">{costingMoney(item.total, report.currency)}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </div>
);
