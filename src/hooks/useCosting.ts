import { useEffect, useState } from 'react';
import { getQuotationById, type Quotation } from '@/services/quotationService';
import type { Material } from '@/services/materialService';
import { emptyCosting, previewCosting, loadCosting, loadCostingMaterials, saveCosting } from '@/services/costingService';
import type { CostingLine, CostingSnapshot } from '@/services/costingTypes';
import { notify } from '@/utils/notifications';

export function useCosting(id: string) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [snapshot, setSnapshot] = useState<CostingSnapshot>(emptyCosting());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([getQuotationById(Number(id)), loadCostingMaterials(), loadCosting(id)])
      .then(async ([quote, catalogue, costing]) => {
        if (!active) return;
        const raw = quote.data.data;
        const parsed = { ...raw, items: typeof raw.items === 'string' ? JSON.parse(raw.items) : raw.items };
        setQuotation(parsed); setMaterials(catalogue);
        const generated = costing.snapshot ?? await previewCosting(parsed.items, id);
        if (!active) return;
        setSnapshot(generated); setRevision(costing.revision); setSaved(!!costing.snapshot); setDirty(false); setError('');
      }).catch(() => { if (active) setError('Unable to load costing. Check your access and that the costing database migration has been applied.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const guard = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (dirty && link instanceof HTMLAnchorElement && link.href !== window.location.href &&
          !window.confirm('Leave without saving this costing?')) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener('click', guard, true);
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guard, true); };
  }, [dirty]);
  const update = (change: Partial<CostingSnapshot>) => {
    setSnapshot(current => ({ ...current, ...change })); setDirty(true);
  };
  const updateLine = (lineId: string, change: Partial<CostingLine>) => {
    setSnapshot(current => ({ ...current, lines: current.lines.map(l => l.id === lineId ? { ...l, ...change } : l) }));
    setDirty(true);
  };
  const generate = async () => {
    if (!quotation || (snapshot.lines.length > 0 && !window.confirm('Refresh the BOM using the current material rules and rates? This replaces the saved material quantities, manual additions and rate adjustments.'))) return;
    setSaving(true);
    try { setSnapshot(await previewCosting(quotation.items, undefined, snapshot.currency)); setDirty(true); }
    catch { notify.error('Unable to refresh the automatic materials.'); }
    finally { setSaving(false); }
  };
  const save = async () => {
    setSaving(true);
    try {
      const result = await saveCosting(id, snapshot, revision);
      setSnapshot(result.snapshot); setRevision(result.revision); setSaveError('');
      setDirty(false); setSaved(true); notify.success('Costing saved as a new revision.');
    } catch (error) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setSaveError(message || 'Costing was not saved. Check quantities, rates and your connection.');
    }
    finally { setSaving(false); }
  };
  return { quotation, materials, snapshot, loading, saving, error, saveError, revision, dirty, saved, update, updateLine, generate, save };
}
