import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clearUsageQuantity, type UsagePolicy } from '@/services/materialUsagePolicyService';
import type { MaterialUsageProperties } from '@/services/materialUsageService';

export function MaterialUsageScopeFields({ properties, onChange, policy }: {
  properties: MaterialUsageProperties; onChange: (properties: MaterialUsageProperties) => void; policy: UsagePolicy;
}) {
  const scope = properties.applicableTo || 'both';
  const operation = policy.forcedOperation || properties.operationType || 'any';
  const scopes = { door: 'Doors', window: 'Windows', both: 'Doors & windows' };
  return <div className="grid gap-3 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="usage-applies">Applies to</Label><Select value={scope} onValueChange={value => {
      if (value && value !== scope) onChange(clearUsageQuantity({ ...properties, applicableTo: value as MaterialUsageProperties['applicableTo'] }));
    }}><SelectTrigger id="usage-applies" className="w-full"><SelectValue>{scopes[scope]}</SelectValue></SelectTrigger>
      <SelectContent>{Object.entries(scopes).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label htmlFor="usage-operation">Product opening type</Label>
      {policy.forcedOperation ? <p id="usage-operation" className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{policy.operations[0]?.label}</p>
        : <Select value={operation} onValueChange={value => {
          if (value && value !== operation) onChange(clearUsageQuantity({ ...properties, operationType: value as MaterialUsageProperties['operationType'] }));
        }}><SelectTrigger id="usage-operation" className="w-full"><SelectValue>{policy.operations.find(o => o.value === operation)?.label}</SelectValue></SelectTrigger>
          <SelectContent>{policy.operations.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}
    </div>
  </div>;
}
