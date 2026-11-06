import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MATERIAL_SYSTEMS, type MaterialSystem } from '@/services/materialSystems';
import type { MaterialUsageProperties } from '@/services/materialUsageService';
import { clearUsageQuantity } from '@/services/materialUsagePolicyService';

export function MaterialSystemFields({ properties, onChange }: {
  properties: MaterialUsageProperties; onChange: (properties: MaterialUsageProperties) => void;
}) {
  return <section className="space-y-4 rounded-lg border p-4">
    <div className="space-y-2"><Label htmlFor="material-system">Material system</Label>
      <Select value={properties.productFamily || 'any'} onValueChange={value => {
        if (!value) return;
        const family = value === 'any' ? undefined : value as MaterialSystem;
        onChange(clearUsageQuantity({ ...properties, productFamily: family,
          applicableTo: family ? (family === 'window' ? 'window' : 'door') : properties.applicableTo }));
      }}><SelectTrigger id="material-system" className="w-full"><SelectValue>{MATERIAL_SYSTEMS.find(s => s.value === properties.productFamily)?.label || 'Any system'}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="any">Any system</SelectItem>{MATERIAL_SYSTEMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-2"><Label htmlFor="stock-length">Stock length (metres, optional)</Label>
      <Input id="stock-length" type="number" min="0.001" max="100" step="0.001" value={properties.stockLength ?? ''}
        onChange={e => onChange({ ...properties, stockLength: e.target.value === '' ? undefined : Number(e.target.value) })} />
      <p className="text-xs text-muted-foreground">Reference length only. Costs use consumed metres plus wastage; full-bar purchases and offcuts need a cutting list.</p>
    </div>
    <div className="flex items-center justify-between gap-3"><div><Label htmlFor="provisional-usage">Provisional usage allowances</Label>
      <p className="mt-1 text-xs text-muted-foreground">Keep enabled until you have checked these quantities. Quotations will ask for costing review.</p></div>
      <Switch id="provisional-usage" checked={properties.provisional === true} onCheckedChange={provisional => onChange({ ...properties, provisional })} />
    </div>
  </section>;
}
