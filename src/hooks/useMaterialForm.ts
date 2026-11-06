import { useState } from 'react';
import type { CreateMaterialData, Material, MaterialCategory, MaterialUnit } from '@/services/materialService';
import type { MaterialUsageProperties } from '@/services/materialUsageService';
import { DEFAULT_UNITS, materialFormData } from '@/services/materialFormService';
import { clearUsageQuantity, effectiveUsageProperties, usageSaveError } from '@/services/materialUsagePolicyService';
import { useMaterialUsagePolicy } from './useMaterialUsagePolicy';
import { useMaterialImage } from './useMaterialImage';

export function useMaterialForm(editingMaterial: Material | null, onSubmit: (data: CreateMaterialData) => void) {
  const [category, setCategory] = useState<MaterialCategory>(editingMaterial?.category ?? 'frame_profile');
  const [unit, setUnit] = useState<MaterialUnit>(editingMaterial?.unit ?? 'per_meter');
  const [currency, setCurrency] = useState(editingMaterial?.currency || 'USD');
  const [properties, setProperties] = useState<MaterialUsageProperties>(editingMaterial?.properties ?? {});
  const policyResult = useMaterialUsagePolicy(category, unit, properties);
  const effectiveProperties = effectiveUsageProperties(category, properties, policyResult.policy);
  const usageError = usageSaveError(unit, effectiveProperties, policyResult.policy, policyResult.error);
  const photo = useMaterialImage(editingMaterial?.image ?? null);
  const changeCategory = (value: MaterialCategory) => {
    setCategory(value); setUnit(DEFAULT_UNITS[value]); setProperties({});
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photo.processing && !usageError) onSubmit(materialFormData(new FormData(event.currentTarget), { category, unit, currency, properties: effectiveProperties.usageRule?.enabled ? effectiveProperties : { ...properties, usageRule: undefined }, image: photo.image }));
  };
  const changeUnit = (value: MaterialUnit) => { setUnit(value); setProperties(clearUsageQuantity(effectiveProperties)); };
  const changeCategoryProperties = (values: MaterialUsageProperties) => {
    const subtypeChanged = ['profileType', 'glassType', 'hardwareType'].some(key => values[key] !== effectiveProperties[key]);
    setProperties(subtypeChanged ? clearUsageQuantity(values) : values);
  };
  return { category, unit, currency, properties: effectiveProperties, photo, changeCategory, changeUnit, setCurrency,
    setProperties, changeCategoryProperties, submit, policy: policyResult.policy, policyError: policyResult.error, usageError };
}
