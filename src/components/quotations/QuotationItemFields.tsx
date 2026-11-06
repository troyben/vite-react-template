import { Input } from '@/components/ui/input';
import { itemAreaLabel } from '@/services/quotationPresentationService';
import type { QuotationItem } from '@/services/quotationService';
import type { QuotationItemEditing } from './quotationItemEditing';

interface QuotationItemNumberProps { item: QuotationItem; index: number; field: 'quantity' | 'rate' | 'price'; editing?: QuotationItemEditing }
export const QuotationItemNumber: React.FC<QuotationItemNumberProps> = ({ item, index, field, editing }) => (
  <>
    <Input type="number" aria-label={`Item ${index + 1} ${field}`} min={field === 'quantity' ? undefined : 0} step={field === 'quantity' ? '1' : '0.01'} value={item[field] ?? ''}
      onChange={editing ? event => editing.onChange(index, field, field === 'quantity' ? parseInt(event.target.value) : parseFloat(event.target.value)) : undefined}
      readOnly={!editing || field === 'price' && !!(item.rate !== undefined && item.productSketch)}
      disabled={!!editing && field === 'price' && !!(item.rate !== undefined && item.productSketch)}
      placeholder={field === 'rate' ? '—' : undefined} className="h-7 text-xs" required={!!editing && field !== 'rate'} />
    {field === 'rate' && itemAreaLabel(item) && <span className="mt-0.5 block text-[10px] text-muted-foreground">{itemAreaLabel(item)}</span>}
  </>
);
