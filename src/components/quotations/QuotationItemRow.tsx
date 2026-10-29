import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/config/currency';
import type { QuotationItem } from '@/services/quotationService';
import type { QuotationItemEditing } from './quotationItemEditing';
import { QuotationItemSketch } from './QuotationItemSketch';
import { QuotationItemNumber } from './QuotationItemFields';

interface QuotationItemRowProps { item: QuotationItem; index: number; count: number; editing?: QuotationItemEditing }
export const QuotationItemRow: React.FC<QuotationItemRowProps> = ({ item, index, count, editing }) => (
  <TableRow className="align-top">
    <TableCell className="py-1.5 text-xs font-medium text-muted-foreground">{index + 1}</TableCell>
    <TableCell className="py-1.5"><QuotationItemSketch item={item} index={index} editing={editing} /></TableCell>
    <TableCell className="py-1.5"><Input aria-label={`Item ${index + 1} name`} value={item.item} readOnly={!editing} onChange={editing ? event => editing.onChange(index, 'item', event.target.value) : undefined} placeholder="Item name" className="h-7 text-xs" required={!!editing} /></TableCell>
    <TableCell className="py-1.5"><Textarea aria-label={`Item ${index + 1} description`} value={item.description ?? ''} readOnly={!editing} onChange={editing ? event => editing.onChange(index, 'description', event.target.value) : undefined}
      placeholder="Add description..." className="field-sizing-fixed h-20 min-h-0 resize-y px-2 py-1 text-xs leading-4" rows={4} /></TableCell>
    {(['quantity', 'rate', 'price'] as const).map(field => <TableCell key={field} className="py-1.5"><QuotationItemNumber item={item} index={index} field={field} editing={editing} /></TableCell>)}
    <TableCell className="py-1.5 text-right text-sm font-medium">{formatCurrency(item.total)}</TableCell>
    {editing && <TableCell className="py-1.5"><button type="button" aria-label={`Remove item ${index + 1}`} disabled={count <= 1} onClick={() => editing.onRemove(index)}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"><X className="h-3.5 w-3.5" /></button></TableCell>}
  </TableRow>
);
