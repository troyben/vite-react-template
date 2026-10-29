import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuotationItem } from '@/services/quotationService';

interface MaterialAssignmentProps { value?: string; items: QuotationItem[]; label: string; onChange: (value: string) => void }
export const MaterialAssignment: React.FC<MaterialAssignmentProps> = ({ value = 'quotation', items, label, onChange }) => (
  <Select value={value} onValueChange={v => { if (v) onChange(v); }}>
    <SelectTrigger aria-label={label} className="w-full"><SelectValue>{value === 'quotation' ? 'Whole quotation' : items.some(item => item.id === value) ? `${items.findIndex(item => item.id === value) + 1} · ${items.find(item => item.id === value)?.item || 'Unnamed item'}` : 'Original item missing — reassign'}</SelectValue></SelectTrigger>
    <SelectContent>
      <SelectItem value="quotation">Whole quotation</SelectItem>
      {value !== 'quotation' && !items.some(item => item.id === value) && <SelectItem value={value}>Original item missing — reassign</SelectItem>}
      {items.map((item, index) => item.id && <SelectItem key={item.id} value={item.id}>{index + 1} · {item.item || 'Unnamed item'}</SelectItem>)}
    </SelectContent>
  </Select>
);
