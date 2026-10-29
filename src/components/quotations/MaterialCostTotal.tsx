import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportData } from '@/services/materialCostReportService';

interface MaterialCostTotalProps { report: MaterialCostReportData }
export const MaterialCostTotal: React.FC<MaterialCostTotalProps> = ({ report }) => (
  <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
    <div><h2 className="font-semibold">Total material cost</h2><p className="mt-1 text-xs text-muted-foreground">{report.currency} · Materials only, before labour, markup, VAT and transport.</p></div>
    <strong className="text-xl">{costingMoney(report.total, report.currency)}</strong>
  </footer>
);
