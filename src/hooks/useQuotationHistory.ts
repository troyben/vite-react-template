import { useEffect, useState } from 'react';
import { loadQuotationHistory, loadQuotationRevision, type HistoryPage, type RevisionDetail } from '@/services/quotationHistoryService';

export function useQuotationHistory(id: string) {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<RevisionDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  useEffect(() => {
    let active = true;
    loadQuotationHistory(id, page).then(data => {
      if (!active) return;
      setHistory(data); setSelected(data.items[0]?.revision ?? null); setError('');
    }).catch(() => { if (active) setError('Unable to load history. Only the quotation owner or an administrator can view it.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, page]);
  useEffect(() => {
    if (selected === null) return;
    let active = true;
    loadQuotationRevision(id, selected).then(data => { if (active) { setDetail(data); setError(''); } })
      .catch(() => { if (active) setError('Unable to load this revision.'); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [id, selected]);
  const select = (revision: number) => { if (revision === selected) return; setDetail(null); setDetailLoading(true); setSelected(revision); };
  const changePage = (next: number) => { setLoading(true); setDetail(null); setPage(next); };
  return { history, detail, error, loading, detailLoading, selected, select, changePage, page };
}
