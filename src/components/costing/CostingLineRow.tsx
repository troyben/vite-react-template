import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { captureMaterial, costingMoney, lineQuantity, lineTotal } from '@/services/costingService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Material } from '@/services/materialService';
import { COSTING_CATEGORIES, COSTING_UNITS } from '@/services/costingTypes';
import type { CostingLine } from '@/services/costingTypes';

export function CostingLineRow({ line, currency, materials, onChange, onRemove }: {
  line: CostingLine; currency: string; materials: Material[]; onChange: (change: Partial<CostingLine>) => void; onRemove: () => void;
}) {
  const options = materials.filter(m => (m.currency || 'USD') === currency && COSTING_CATEGORIES[m.category] === line.category && COSTING_UNITS[m.unit] === line.unit);
  return <TableRow>
    <TableCell className="min-w-52">
      <Select value={line.materialId === null ? 'manual' : String(line.materialId)} onValueChange={value => {
        const material = options.find(m => String(m.id) === value);
        onChange(material ? { materialSnapshot: captureMaterial(material), materialId: material.id, name: material.name, unitCost: material.costPrice } : { materialId: null, materialSnapshot: undefined });
      }}><SelectTrigger className="w-full" aria-label={`Choose material for ${line.name}`}><SelectValue>{line.materialId === null ? 'Choose material or enter manually' : line.name}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="manual">Enter manually</SelectItem>{options.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
      </Select>
      {line.materialId === null && <Input className="mt-1" aria-label={`Material name: ${line.name}`} value={line.name} required maxLength={255} onChange={e => onChange({ name: e.target.value })} />}
      <span className="mt-1 block text-xs text-muted-foreground">{line.category}{line.materialId === null ? ' · select a material or enter a rate' : ''}</span>
    </TableCell>
    <TableCell><Input className="w-24 text-right" aria-label={`Net quantity: ${line.name}`} type="number" min="0" max="1000000"
      step="0.001" value={line.quantity} onChange={e => onChange({ quantity: Number(e.target.value) })} /></TableCell>
    <TableCell>{line.unit}</TableCell>
    <TableCell><Input className="w-20 text-right" aria-label={`Wastage percent: ${line.name}`} type="number" min="0" max="1000" step="0.1"
      value={line.wastagePercent} onChange={e => onChange({ wastagePercent: Number(e.target.value) })} /></TableCell>
    <TableCell className="text-right tabular-nums">{lineQuantity(line)} {line.unit}</TableCell>
    <TableCell><Input className="w-28 text-right" aria-label={`Unit cost: ${line.name}`} type="number" min="0" max="1000000" step="0.01"
      value={line.unitCost} onChange={e => onChange({ unitCost: Number(e.target.value) })} /></TableCell>
    <TableCell className="text-right font-medium tabular-nums">{costingMoney(lineTotal(line), currency)}</TableCell>
    <TableCell><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${line.name}`} onClick={onRemove}><Trash2 className="h-4 w-4" /></Button></TableCell>
  </TableRow>;
}
