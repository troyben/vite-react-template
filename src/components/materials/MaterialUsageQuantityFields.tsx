import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UsagePolicy } from '@/services/materialUsagePolicyService';
import type { MaterialUsageProperties, UsageRule } from '@/services/materialUsageService';

export function MaterialUsageQuantityFields({ properties, onChange, policy }: {
  properties: MaterialUsageProperties; onChange: (properties: MaterialUsageProperties) => void; policy: UsagePolicy;
}) {
  const rule = properties.usageRule!;
  const basis = policy.bases.find(b => b.value === rule.basis);
  const updateRule = (change: Partial<UsageRule>) => onChange({ ...properties, usageRule: { ...rule, ...change } });
  return <>
    <div className="space-y-2"><Label htmlFor="usage-basis">Calculate usage for</Label>
      {policy.bases.length === 1 ? <p id="usage-basis" className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{basis?.label}</p>
        : <Select value={rule.basis} onValueChange={value => { if (value && value !== rule.basis) updateRule({ basis: value as UsageRule['basis'], quantity: 0 }); }}>
          <SelectTrigger id="usage-basis" className="w-full"><SelectValue>{basis?.label}</SelectValue></SelectTrigger>
          <SelectContent>{policy.bases.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="usage-quantity">{basis?.quantityLabel || 'Material used'}</Label>
      <Input id="usage-quantity" type="number" min="0.001" max="1000000" step="0.001" required value={rule.quantity || ''}
        placeholder="Enter quantity" onChange={e => updateRule({ quantity: Number(e.target.value) })} /></div>
      <div className="space-y-2"><Label htmlFor="usage-waste">Wastage allowance (%)</Label><Input id="usage-waste" type="number" min="0" max="1000" step="0.1" value={rule.wastagePercent} onChange={e => updateRule({ wastagePercent: Number(e.target.value) })} /></div></div>
    <p className="text-xs text-muted-foreground">{basis?.help} Review and re-enter the quantity after changing the material type, unit, applicability or measurement.</p>
  </>;
}
