import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportLine } from '@/services/materialCostReportService';

interface MaterialCostTableProps { lines: MaterialCostReportLine[]; currency: string; onEdit?: (id: string) => void; onRemove?: (id: string) => void }
export const MaterialCostTable: React.FC<MaterialCostTableProps> = ({ lines, currency, onEdit, onRemove }) => (
  <Table className="table-fixed text-xs">
    <TableHeader><TableRow className="even:bg-transparent hover:bg-transparent"><TableHead className="h-7 w-[40%] px-1.5 text-xs">Material</TableHead><TableHead className="h-7 px-1.5 text-xs">Usage</TableHead>
      <TableHead className="h-7 px-1.5 text-right text-xs">Unit cost</TableHead><TableHead className="h-7 px-1.5 text-right text-xs">Cost</TableHead></TableRow></TableHeader>
    <TableBody>{lines.map(line => <TableRow key={line.id} className="even:bg-transparent hover:bg-transparent">
      <TableCell className="px-1.5 py-1.5 whitespace-normal"><span title={line.category}>{line.name}</span>{line.manual && <span className="ml-1 text-[10px] text-muted-foreground">· Manual</span>}
        {line.manual && (onEdit || onRemove) && <span className="ml-1 inline-flex gap-0.5 align-middle print:hidden">
          {onEdit && <Button type="button" variant="ghost" size="icon-xs" aria-label={`Edit ${line.name}`} onClick={() => onEdit(line.id)}><Pencil className="size-3" /></Button>}
          {onRemove && <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${line.name}`} onClick={() => onRemove(line.id)}><Trash2 className="size-3" /></Button>}
        </span>}</TableCell>
      <TableCell className="px-1.5 py-1.5">{line.quantity.toLocaleString('en-US', { maximumFractionDigits: 3 })} {line.unit}</TableCell>
      <TableCell className="px-1.5 py-1.5 text-right">{costingMoney(line.unitCost, currency)}</TableCell>
      <TableCell className="px-1.5 py-1.5 text-right font-medium">{costingMoney(line.total, currency)}</TableCell>
    </TableRow>)}</TableBody>
  </Table>
);
