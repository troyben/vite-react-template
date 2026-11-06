import api from '../api';
import type { MaterialCategory, MaterialUnit } from './materialService';
import { defaultUsage, type MaterialUsageProperties, type UsageRule } from './materialUsageService';

export interface UsagePolicy {
  units: { value: MaterialUnit; label: string }[];
  operations: { value: 'any' | 'hinged' | 'sliding'; label: string }[];
  forcedOperation?: 'hinged' | 'sliding';
  requirement?: string;
  bases: { value: UsageRule['basis']; label: string; quantityLabel: string; help: string }[];
  note?: string;
}
export function usagePolicyParams(category: MaterialCategory, unit: MaterialUnit, p: MaterialUsageProperties) {
  return { category, unit, applicableTo: p.applicableTo || 'both', operationType: p.operationType || 'any',
    profileType: p.profileType, glassType: p.glassType, hardwareType: p.hardwareType };
}
export async function getUsagePolicy(params: ReturnType<typeof usagePolicyParams>): Promise<UsagePolicy> {
  const response = await api.get('/materials/usage-policy', { params });
  return response.data.data;
}
export function effectiveUsageProperties(category: MaterialCategory, properties: MaterialUsageProperties, policy?: UsagePolicy): MaterialUsageProperties {
  const rule = properties.usageRule ?? defaultUsage(category);
  if (!rule.enabled || !policy) return properties;
  const basis = policy.bases.some(b => b.value === rule.basis) ? rule.basis : policy.bases[0]?.value;
  const changed = basis !== rule.basis || (!!policy.forcedOperation && properties.operationType !== policy.forcedOperation);
  return { ...properties, applicableTo: properties.applicableTo || 'both',
    operationType: policy.forcedOperation || properties.operationType || 'any',
    usageRule: { ...rule, basis: basis ?? rule.basis, quantity: changed ? 0 : rule.quantity } };
}
export function clearUsageQuantity(properties: MaterialUsageProperties): MaterialUsageProperties {
  return properties.usageRule?.enabled ? { ...properties, usageRule: { ...properties.usageRule, quantity: 0 } } : properties;
}
export function usageSaveError(unit: MaterialUnit, p: MaterialUsageProperties, policy?: UsagePolicy, error?: string): string | undefined {
  if (!p.usageRule?.enabled) return;
  if (error) return error;
  if (!policy) return 'Loading compatible usage settings…';
  if (policy.requirement) return policy.requirement;
  if (!policy.units.some(u => u.value === unit)) return 'Choose a compatible pricing unit for this material.';
  if (!policy.bases.some(b => b.value === p.usageRule?.basis)) return 'Choose a compatible usage measurement.';
  if (!(p.usageRule.quantity > 0)) return 'Enter the material quantity for this usage measurement.';
}
