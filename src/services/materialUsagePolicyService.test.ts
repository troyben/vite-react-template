import { describe, expect, it, vi } from 'vitest';
vi.mock('../api', () => ({ default: { get: vi.fn() } }));
import api from '../api';
import { clearUsageQuantity, effectiveUsageProperties, getUsagePolicy, usagePolicyParams, usageSaveError, type UsagePolicy } from './materialUsagePolicyService';
import type { MaterialUsageProperties } from './materialUsageService';
const policy: UsagePolicy = { units: [{ value: 'per_piece', label: 'Per Piece' }],
  operations: [{ value: 'sliding', label: 'Sliding only' }], forcedOperation: 'sliding',
  bases: [{ value: 'sliding_opening', label: 'Each sliding opening', quantityLabel: 'Pieces per opening', help: 'Enter pieces' }] };
const p: MaterialUsageProperties = { applicableTo: 'door', operationType: 'hinged', hardwareType: 'roller',
  usageRule: { enabled: true, basis: 'hinged_opening', quantity: 3, wastagePercent: 5 } };

describe('dynamic usage form policy', () => {
  it('requests only context fields and reads the canonical API policy', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: policy } });
    const params = usagePolicyParams('hardware', 'per_piece', p);
    expect(params).not.toHaveProperty('usageRule');
    expect(await getUsagePolicy(params)).toEqual(policy);
    expect(api.get).toHaveBeenCalledWith('/materials/usage-policy', { params });
  });
  it('replaces incompatible measurement and operation but requires a fresh coefficient', () => {
    const effective = effectiveUsageProperties('hardware', p, policy);
    expect(effective.operationType).toBe('sliding');
    expect(effective.usageRule).toEqual({ enabled: true, basis: 'sliding_opening', quantity: 0, wastagePercent: 5 });
    expect(usageSaveError('per_piece', effective, policy)).toMatch(/quantity/);
    expect(p.usageRule?.quantity).toBe(3);
    effective.usageRule!.quantity = 2;
    expect(effectiveUsageProperties('hardware', effective, policy).usageRule?.quantity).toBe(2);
    expect(usageSaveError('per_piece', effective, policy)).toBeUndefined();
  });
  it('blocks active rules while loading, on API failure, missing subtype and incompatible units', () => {
    expect(usageSaveError('per_piece', p)).toMatch(/Loading/);
    expect(usageSaveError('per_piece', p, undefined, 'Unavailable')).toBe('Unavailable');
    expect(usageSaveError('per_piece', p, { ...policy, requirement: 'Select subtype' })).toBe('Select subtype');
    expect(usageSaveError('per_kg', p, policy)).toMatch(/pricing unit/);
    expect(usageSaveError('per_piece', p, policy)).toMatch(/measurement/);
    expect(usageSaveError('per_piece', {}, undefined, 'Unavailable')).toBeUndefined();
  });
  it('resets quantities for context changes and preserves manual-only material properties', () => {
    expect(clearUsageQuantity(p).usageRule?.quantity).toBe(0);
    expect(effectiveUsageProperties('hardware', {}, policy)).toEqual({});
    expect(clearUsageQuantity({ hardwareType: 'hinge' })).toEqual({ hardwareType: 'hinge' });
  });
});
