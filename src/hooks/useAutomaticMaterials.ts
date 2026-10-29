import { useEffect, useState } from 'react';
import type { QuotationItem } from '@/services/quotationService';
import type { CostingSnapshot } from '@/services/costingTypes';
import { previewCosting } from '@/services/costingService';
export function useAutomaticMaterials(items: QuotationItem[], quotationId?: string) {
  const [snapshot, setSnapshot] = useState<CostingSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      previewCosting(items, quotationId).then(result => { if (active) { setSnapshot(result); setError(''); } })
        .catch(() => { if (active) { setSnapshot(null); setError('Material costs could not be calculated. Check the product dimensions and material rules.'); } })
        .finally(() => { if (active) setLoading(false); });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [items, quotationId]);
  return { snapshot, loading, error };
}
