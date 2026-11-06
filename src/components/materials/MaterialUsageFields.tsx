import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { MaterialCategory } from '@/services/materialService';
import { defaultUsage, type MaterialUsageProperties } from '@/services/materialUsageService';
import type { UsagePolicy } from '@/services/materialUsagePolicyService';
import { MaterialUsageScopeFields } from './MaterialUsageScopeFields';
import { MaterialUsageQuantityFields } from './MaterialUsageQuantityFields';

export function MaterialUsageFields({ category, properties, onChange, policy, error }: {
  category: MaterialCategory; properties: MaterialUsageProperties; onChange: (properties: MaterialUsageProperties) => void;
  policy?: UsagePolicy; error?: string;
}) {
  const rule = properties.usageRule ?? defaultUsage(category);
  return <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
    <div className="flex items-center justify-between gap-4"><div><Label htmlFor="auto-include">Include automatically in quotations</Label><p className="mt-1 text-xs text-muted-foreground">Use this material by default on every matching door or window.</p></div>
      <Switch id="auto-include" checked={rule.enabled} onCheckedChange={enabled => onChange({ ...properties,
        applicableTo: properties.applicableTo || 'both', operationType: policy?.forcedOperation || properties.operationType || 'any',
        usageRule: { ...rule, enabled, quantity: enabled ? 0 : 1 } })} /></div>
    {rule.enabled ? <>
      {policy && <MaterialUsageScopeFields properties={properties} onChange={onChange} policy={policy} />}
      {policy && !policy.requirement &&
        <MaterialUsageQuantityFields properties={properties} onChange={onChange} policy={policy} />}
      {policy?.note && <p className="text-xs text-muted-foreground">{policy.note}</p>}
      {error && <p role="status" className="text-xs text-amber-800 dark:text-amber-300">{error}</p>}
    </> : <p className="text-xs text-muted-foreground">Automatic usage is off. This material can be added manually to quotation costs.</p>}
  </section>;
}
