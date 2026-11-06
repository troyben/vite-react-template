import { useEffect, useState } from 'react';
import { loadCostingMaterials } from '@/services/costingService';
import { addManualMaterial, catalogueOptions, validManualQuantity } from '@/services/manualMaterialService';
import type { CostingLine } from '@/services/costingTypes';
import type { Material } from '@/services/materialService';

export function useManualMaterialEditor(lines: CostingLine[], onChange: (lines: CostingLine[]) => void, currency?: string) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState('');
  const [assignment, setAssignment] = useState('quotation');
  const [quantity, setQuantity] = useState('1');
  const [wastage, setWastage] = useState('0');
  useEffect(() => {
    let active = true;
    loadCostingMaterials().then(data => { if (active) setMaterials(data); })
      .catch(() => { if (active) setError('Materials could not be loaded.'); });
    return () => { active = false; };
  }, [attempt]);
  const material = materials.find(row => String(row.id) === selected);
  const canAdd = !!currency && !!material && (material.currency || 'USD') === currency && validManualQuantity(Number(quantity), Number(wastage));
  const add = () => {
    if (!canAdd || !material) return;
    onChange([...lines, addManualMaterial(material, Number(quantity), Number(wastage), assignment === 'quotation' ? undefined : assignment)]);
    setSelected(''); setQuantity('1'); setWastage('0');
  };
  const update = (id: string, changes: Partial<CostingLine>) => onChange(lines.map(line => line.id === id ? { ...line, ...changes } : line));
  return { expanded, setExpanded, error, retry: () => { setError(''); setAttempt(value => value + 1); },
    options: catalogueOptions(materials, currency || 'USD'), material, selected, setSelected, assignment, setAssignment,
    quantity, setQuantity, wastage, setWastage, canAdd, add, update,
    remove: (id: string) => onChange(lines.filter(line => line.id !== id)) };
}
