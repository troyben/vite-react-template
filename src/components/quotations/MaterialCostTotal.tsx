import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportData } from '@/services/materialCostReportService';

interface MaterialCostTotalProps { report: MaterialCostReportData }
export const MaterialCostTotal: React.FC<MaterialCostTotalProps> = ({ report }) => (
  <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
    <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Total material cost</h2>
      {report.incomplete && <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">Incomplete</span>}
    </div>
      {report.incomplete && <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Missing configuration or material checks remain. This is not the full material cost.</p>}
      <p className="mt-1 text-xs text-muted-foreground">{report.currency} · Selected materials only, before labour, markup, VAT and transport.</p>
    </div>
    <div className="text-right">{report.incomplete && <p className="text-xs text-muted-foreground">Calculated so far</p>}
      <strong className="text-xl">{costingMoney(report.total, report.currency)}</strong>
    </div>
  </footer>
);
