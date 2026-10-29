import { useEffect, useState } from 'react';
import type { QuotationItem } from '@/services/quotationService';
import { previewMaterialCostReport, type MaterialCostReportData } from '@/services/materialCostReportService';

export function useMaterialCostReport(items: QuotationItem[], quotationId?: string) {
  const [result, setResult] = useState<{ items: QuotationItem[]; quotationId?: string; report?: MaterialCostReportData; error?: string }>();
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      previewMaterialCostReport(items, quotationId).then(report => {
        if (active) setResult({ items, quotationId, report });
      }).catch(() => {
        if (active) setResult({ items, quotationId, error: 'Material costs could not be calculated. Check the product dimensions and material rules, then try again.' });
      });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [items, quotationId]);
  const current = result?.items === items && result?.quotationId === quotationId ? result : undefined;
  return { report: current?.report, error: current?.error, loading: !current };
}
