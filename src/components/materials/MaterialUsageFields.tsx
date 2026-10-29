import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaterialCategory, MaterialUnit } from '@/services/materialService';
import { defaultUsage, USAGE_OPTIONS, usageUnit, type UsageRule, type MaterialUsageProperties } from '@/services/materialUsageService';

export function MaterialUsageFields({ category, unit, properties, onChange }: {
  category: MaterialCategory; unit: MaterialUnit; properties: MaterialUsageProperties; onChange: (properties: MaterialUsageProperties) => void;
}) {
  const rule: UsageRule = properties.usageRule ?? defaultUsage(category);
  const updateRule = (change: Partial<UsageRule>) => onChange({ ...properties, applicableTo: properties.applicableTo || 'both', usageRule: { ...rule, ...change } });
  return <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
    <div className="flex items-center justify-between gap-4"><div><Label htmlFor="auto-include">Include automatically in quotations</Label><p className="mt-1 text-xs text-muted-foreground">Use this material by default on every matching door or window.</p></div>
      <Switch id="auto-include" checked={rule.enabled} onCheckedChange={enabled => updateRule({ enabled })} /></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="usage-applies">Applies to</Label><Select value={properties.applicableTo || 'both'} onValueChange={value => { if (value) onChange({ ...properties, applicableTo: value as MaterialUsageProperties['applicableTo'] }); }}>
        <SelectTrigger id="usage-applies" className="w-full"><SelectValue>{{ door: 'Doors', window: 'Windows', both: 'Doors & windows' }[properties.applicableTo || 'both']}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="door">Doors</SelectItem><SelectItem value="window">Windows</SelectItem><SelectItem value="both">Doors & windows</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="usage-operation">Opening type</Label><Select value={properties.operationType || 'any'} onValueChange={value => { if (value) onChange({ ...properties, operationType: value as MaterialUsageProperties['operationType'] }); }}>
        <SelectTrigger id="usage-operation" className="w-full"><SelectValue>{{ any: 'Any', hinged: 'Hinged only', sliding: 'Sliding only' }[properties.operationType || 'any']}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="hinged">Hinged only</SelectItem><SelectItem value="sliding">Sliding only</SelectItem></SelectContent></Select></div>
    </div>
    {rule.enabled && <>
      <div className="space-y-2"><Label htmlFor="usage-basis">Calculate usage for</Label><Select value={rule.basis} onValueChange={basis => { if (basis) updateRule({ basis: basis as UsageRule['basis'] }); }}>
        <SelectTrigger id="usage-basis" className="w-full"><SelectValue>{USAGE_OPTIONS.find(o => o.value === rule.basis)?.label}</SelectValue></SelectTrigger>
        <SelectContent>{USAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="usage-quantity">Material used ({usageUnit(unit)})</Label><Input id="usage-quantity" type="number" min="0.001" max="1000000" step="0.001" required value={rule.quantity} onChange={e => updateRule({ quantity: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label htmlFor="usage-waste">Wastage allowance (%)</Label><Input id="usage-waste" type="number" min="0" max="1000" step="0.1" value={rule.wastagePercent} onChange={e => updateRule({ wastagePercent: Number(e.target.value) })} /></div></div>
      <p className="text-xs text-muted-foreground">Example: glass uses 1 m² for each m² of product area. A 3 m × 3 m window uses 9 m² before wastage. A hinge rule of 3 pieces per door uses 6 pieces for 2 doors.</p>
    </>}
  </section>;
}
