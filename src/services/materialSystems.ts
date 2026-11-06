export const MATERIAL_SYSTEMS = [
  { value: 'patio', label: 'Patio Door', type: 'door' },
  { value: 'galaxy', label: 'Galaxy Doors', type: 'door' },
  { value: 'folding', label: 'Folding Doors', type: 'door' },
  { value: 'window', label: 'Standard Windows', type: 'window' },
] as const;
export type MaterialSystem = typeof MATERIAL_SYSTEMS[number]['value'];

export function materialSystemProduct(value: MaterialSystem | undefined) {
  const system = MATERIAL_SYSTEMS.find(s => s.value === value);
  return system ? { productFamily: system.value, type: system.type, doorType: system.type === 'door' ? 'sliding' as const : undefined } : undefined;
}
