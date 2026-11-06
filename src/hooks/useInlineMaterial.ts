import { useState } from 'react';
import type { CostingLine } from '@/services/costingTypes';
import type { Material } from '@/services/materialService';
import { addManualMaterial, catalogueOptions, validManualQuantity } from '@/services/manualMaterialService';

export function useInlineMaterial(materials: Material[], currency: string, itemId?: string, existing?: CostingLine) {
  const [selected, setSelected] = useState(existing ? String(existing.materialId ?? 'captured') : '');
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));
  const [wastage, setWastage] = useState(String(existing?.wastagePercent ?? 0));
  const [unitCost, setUnitCost] = useState(String(existing?.unitCost ?? ''));
  const material = materials.find(row => String(row.id) === selected);
  const captured = existing && selected === String(existing.materialId ?? 'captured');
  const options = catalogueOptions(materials, currency);
  if (existing && !options.some(option => option.value === String(existing.materialId ?? 'captured'))) {
    options.push({ value: String(existing.materialId ?? 'captured'), label: existing.name, description: `Captured material · ${existing.unit}` });
  }
  const select = (id: string) => {
    setSelected(id);
    setUnitCost(String(existing && id === String(existing.materialId ?? 'captured') ? existing.unitCost : materials.find(row => String(row.id) === id)?.costPrice ?? ''));
  };
  const canSave = (!!captured || !!material && (material.currency || 'USD') === currency) && unitCost.trim() !== '' &&
    Number.isFinite(Number(unitCost)) && Number(unitCost) >= 0 && Number(unitCost) <= 1e6 && validManualQuantity(Number(quantity), Number(wastage));
  const build = (): CostingLine | undefined => {
    if (!canSave) return;
    const line = captured ? existing : addManualMaterial(material!, Number(quantity), Number(wastage), itemId);
    return { ...line!, id: existing?.id ?? line!.id, quotationItemId: itemId, quantity: Number(quantity), wastagePercent: Number(wastage), unitCost: Number(unitCost) };
  };
  return { selected, select, quantity, setQuantity, wastage, setWastage, unitCost, setUnitCost, options, canSave, build,
    unit: captured ? existing.unit : material ? { per_meter: 'm', per_sqm: 'm²', per_piece: 'pcs', per_kg: 'kg' }[material.unit] : '' };
}
