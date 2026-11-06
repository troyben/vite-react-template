import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { costingMoney, lineTotal } from '@/services/costingService';
import type { CostingLine } from '@/services/costingTypes';
import type { QuotationItem } from '@/services/quotationService';
import { MaterialAssignment } from './MaterialAssignment';

interface ManualMaterialLinesProps {
  lines: CostingLine[]; items: QuotationItem[]; currency: string;
  onUpdate: (id: string, changes: Partial<CostingLine>) => void; onRemove: (id: string) => void;
}
export const ManualMaterialLines: React.FC<ManualMaterialLinesProps> = ({ lines, items, currency, onUpdate, onRemove }) => (
  <Table className="min-w-[680px] text-xs">
    <TableHeader><TableRow><TableHead>Manually added material</TableHead><TableHead>Applies to</TableHead><TableHead className="w-28">Total quantity</TableHead>
      <TableHead className="w-28">Wastage %</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="w-10"><span className="sr-only">Remove</span></TableHead></TableRow></TableHeader>
    <TableBody>{lines.map(line => <TableRow key={line.id}>
      <TableCell className="whitespace-normal"><strong>{line.name}</strong><p className="text-muted-foreground">{costingMoney(line.unitCost, currency)} / {line.unit} · Captured price</p></TableCell>
      <TableCell><MaterialAssignment value={line.quotationItemId} items={items} label={`Assignment for ${line.name}`}
        onChange={value => onUpdate(line.id, { quotationItemId: value === 'quotation' ? undefined : value })} /></TableCell>
      <TableCell><Input aria-label={`Total quantity for ${line.name} (${line.unit})`} type="number" min="0.001" max="1000000" step="any" value={line.quantity}
        onChange={event => { const quantity = Number(event.target.value); if (Number.isFinite(quantity) && quantity > 0 && quantity <= 1e6) onUpdate(line.id, { quantity }); }} /></TableCell>
      <TableCell><Input aria-label={`Wastage for ${line.name} (%)`} type="number" min="0" max="1000" step="any" value={line.wastagePercent}
        onChange={event => { const wastagePercent = Number(event.target.value); if (Number.isFinite(wastagePercent) && wastagePercent >= 0 && wastagePercent <= 1000) onUpdate(line.id, { wastagePercent }); }} /></TableCell>
      <TableCell className="text-right font-medium">{costingMoney(lineTotal(line), currency)}</TableCell>
      <TableCell><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${line.name}`} onClick={() => onRemove(line.id)}><Trash2 /></Button></TableCell>
    </TableRow>)}</TableBody>
  </Table>
);
