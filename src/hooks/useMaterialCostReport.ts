import type { CostingLine, ItemMaterialApproval } from '@/services/costingTypes';
import { useEffect, useState } from 'react';
import type { QuotationItem } from '@/services/quotationService';
import { previewMaterialCostReport, savedMaterialCostReport, type MaterialCostReportData } from '@/services/materialCostReportService';

export function useMaterialCostReport(items: QuotationItem[], quotationId?: string, manualMaterials?: CostingLine[], itemApprovals?: ItemMaterialApproval[], savedOnly = false) {
  const [currency, setCurrency] = useState<string>();
  const [result, setResult] = useState<{ items: QuotationItem[]; savedOnly: boolean; manualMaterials?: CostingLine[]; itemApprovals?: ItemMaterialApproval[]; quotationId?: string; report?: MaterialCostReportData; error?: string }>();
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const request = savedOnly && quotationId ? savedMaterialCostReport(quotationId) : previewMaterialCostReport(items, quotationId, manualMaterials, itemApprovals);
      request.then(report => {
        if (active) { setCurrency(report.currency); setResult({ items, quotationId, savedOnly, manualMaterials, itemApprovals, report }); }
      }).catch(() => {
        if (active) setResult({ items, quotationId, savedOnly, manualMaterials, itemApprovals, error: 'Material costs could not be calculated. Check the product dimensions and material rules, then try again.' });
      });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [items, quotationId, manualMaterials, itemApprovals, savedOnly]);
  const current = result?.savedOnly === savedOnly && result?.items === items && result?.quotationId === quotationId && result?.manualMaterials === manualMaterials && result?.itemApprovals === itemApprovals ? result : undefined;
  return { currency, displayReport: result?.quotationId === quotationId && result?.savedOnly === savedOnly ? result?.report : undefined, report: current?.report, error: current?.error, loading: !current };
}
