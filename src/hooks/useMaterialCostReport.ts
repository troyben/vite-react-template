import type { CostingLine } from '@/services/costingTypes';
import { useEffect, useState } from 'react';
import type { QuotationItem } from '@/services/quotationService';
import { previewMaterialCostReport, type MaterialCostReportData } from '@/services/materialCostReportService';

export function useMaterialCostReport(items: QuotationItem[], quotationId?: string, manualMaterials?: CostingLine[]) {
  const [currency, setCurrency] = useState<string>();
  const [result, setResult] = useState<{ items: QuotationItem[]; manualMaterials?: CostingLine[]; quotationId?: string; report?: MaterialCostReportData; error?: string }>();
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      previewMaterialCostReport(items, quotationId, manualMaterials).then(report => {
        if (active) { setCurrency(report.currency); setResult({ items, quotationId, manualMaterials, report }); }
      }).catch(() => {
        if (active) setResult({ items, quotationId, manualMaterials, error: 'Material costs could not be calculated. Check the product dimensions and material rules, then try again.' });
      });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [items, quotationId, manualMaterials]);
  const current = result?.items === items && result?.quotationId === quotationId && result?.manualMaterials === manualMaterials ? result : undefined;
  return { currency, report: current?.report, error: current?.error, loading: !current };
}
