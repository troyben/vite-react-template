import { useState } from 'react';
import type { CreateMaterialData, Material, MaterialCategory, MaterialUnit } from '@/services/materialService';
import type { MaterialUsageProperties } from '@/services/materialUsageService';
import { DEFAULT_UNITS, materialFormData } from '@/services/materialFormService';
import { useMaterialImage } from './useMaterialImage';

export function useMaterialForm(editingMaterial: Material | null, onSubmit: (data: CreateMaterialData) => void) {
  const [category, setCategory] = useState<MaterialCategory>(editingMaterial?.category ?? 'frame_profile');
  const [unit, setUnit] = useState<MaterialUnit>(editingMaterial?.unit ?? 'per_meter');
  const [currency, setCurrency] = useState(editingMaterial?.currency || 'USD');
  const [properties, setProperties] = useState<MaterialUsageProperties>(editingMaterial?.properties ?? {});
  const photo = useMaterialImage(editingMaterial?.image ?? null);
  const changeCategory = (value: MaterialCategory) => {
    setCategory(value); if (!editingMaterial) setUnit(DEFAULT_UNITS[value]); setProperties({});
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photo.processing) onSubmit(materialFormData(new FormData(event.currentTarget), { category, unit, currency, properties, image: photo.image }));
  };
  return { category, unit, currency, properties, photo, changeCategory, setUnit, setCurrency, setProperties, submit };
}
