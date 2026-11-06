import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportLine } from '@/services/materialCostReportService';

interface MaterialCostTableProps { lines: MaterialCostReportLine[]; currency: string }
export const MaterialCostTable: React.FC<MaterialCostTableProps> = ({ lines, currency }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Usage incl. wastage</TableHead>
      <TableHead className="text-right">Unit cost</TableHead><TableHead className="text-right">Material cost</TableHead></TableRow></TableHeader>
    <TableBody>{lines.map(line => <TableRow key={line.id}>
      <TableCell className="whitespace-normal"><span className="font-medium">{line.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{line.category}</span></TableCell>
      <TableCell>{line.quantity.toLocaleString('en-US', { maximumFractionDigits: 3 })} {line.unit}</TableCell>
      <TableCell className="text-right">{costingMoney(line.unitCost, currency)}</TableCell>
      <TableCell className="text-right font-medium">{costingMoney(line.total, currency)}</TableCell>
    </TableRow>)}</TableBody>
  </Table>
);
