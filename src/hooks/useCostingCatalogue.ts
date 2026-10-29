import { useEffect, useState } from 'react';
import { loadCostingMaterials } from '@/services/costingService';
import type { Material } from '@/services/materialService';

export function useCostingCatalogue(enabled: boolean) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadCostingMaterials().then(data => { if (active) setMaterials(data); })
      .catch(() => { if (active) setError('Materials could not be loaded.'); });
    return () => { active = false; };
  }, [enabled, attempt]);
  return { materials, error, retry: () => { setError(''); setAttempt(value => value + 1); } };
}
