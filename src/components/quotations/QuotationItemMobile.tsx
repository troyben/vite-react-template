import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/config/currency';
import type { QuotationItem } from '@/services/quotationService';
import type { QuotationItemEditing } from './quotationItemEditing';
import { QuotationItemSketch } from './QuotationItemSketch';
import { QuotationItemNumber } from './QuotationItemFields';

interface QuotationItemMobileProps { item: QuotationItem; index: number; count: number; editing?: QuotationItemEditing }
export const QuotationItemMobile: React.FC<QuotationItemMobileProps> = ({ item, index, count, editing }) => (
  <div className="relative space-y-2 rounded-lg border bg-card p-2">
    <div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
      {editing && <button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => editing.onRemove(index)} disabled={count <= 1} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground disabled:opacity-30"><X className="h-3.5 w-3.5" /></button>}</div>
    <div className="flex gap-2"><div className="w-[100px] shrink-0"><QuotationItemSketch item={item} index={index} editing={editing} compact /></div>
      <div className="min-w-0 flex-1 space-y-1.5"><Input aria-label={`Item ${index + 1} name`} value={item.item} readOnly={!editing} onChange={editing ? event => editing.onChange(index, 'item', event.target.value) : undefined} placeholder="Item name" className="h-7 text-xs" required={!!editing} />
        <Textarea aria-label={`Item ${index + 1} description`} value={item.description ?? ''} readOnly={!editing} onChange={editing ? event => editing.onChange(index, 'description', event.target.value) : undefined} placeholder="Description" className="field-sizing-fixed h-16 min-h-0 resize-y text-xs leading-4" rows={2} /></div>
    </div>
    <div className="grid grid-cols-2 gap-2 @min-[280px]:grid-cols-4">
      {(['quantity', 'rate', 'price'] as const).map(field => <div key={field}><Label className="text-xs capitalize text-muted-foreground">{field === 'quantity' ? 'Qty' : field}</Label><QuotationItemNumber item={item} index={index} field={field} editing={editing} /></div>)}
      <div><Label className="text-xs text-muted-foreground">Total</Label><div className="flex h-8 items-center text-sm font-medium">{formatCurrency(item.total)}</div></div>
    </div>
  </div>
);
