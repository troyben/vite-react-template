import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportLine } from '@/services/materialCostReportService';

interface MaterialCostTableProps { lines: MaterialCostReportLine[]; currency: string }
export const MaterialCostTable: React.FC<MaterialCostTableProps> = ({ lines, currency }) => (
  <Table className="table-fixed text-xs">
    <TableHeader><TableRow><TableHead className="h-7 w-[40%] px-1.5 text-xs">Material</TableHead><TableHead className="h-7 px-1.5 text-xs">Usage</TableHead>
      <TableHead className="h-7 px-1.5 text-right text-xs">Unit cost</TableHead><TableHead className="h-7 px-1.5 text-right text-xs">Cost</TableHead></TableRow></TableHeader>
    <TableBody>{lines.map(line => <TableRow key={line.id}>
      <TableCell className="px-1.5 py-1.5 whitespace-normal"><span title={line.category}>{line.name}</span></TableCell>
      <TableCell className="px-1.5 py-1.5">{line.quantity.toLocaleString('en-US', { maximumFractionDigits: 3 })} {line.unit}</TableCell>
      <TableCell className="px-1.5 py-1.5 text-right">{costingMoney(line.unitCost, currency)}</TableCell>
      <TableCell className="px-1.5 py-1.5 text-right font-medium">{costingMoney(line.total, currency)}</TableCell>
    </TableRow>)}</TableBody>
  </Table>
);
