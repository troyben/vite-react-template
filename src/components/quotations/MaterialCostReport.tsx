import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportData } from '@/services/materialCostReportService';
import type { QuotationItem } from '@/services/quotationService';
import { MaterialCostTotal } from './MaterialCostTotal';
import { MaterialCostItems } from './MaterialCostItems';
import { MaterialCostTable } from './MaterialCostTable';

interface MaterialCostReportProps { report: MaterialCostReportData; title: string; items: QuotationItem[]; showTotal?: boolean }
export const MaterialCostReport: React.FC<MaterialCostReportProps> = ({ report, title, items, showTotal = true }) => (
  <article className="material-cost-report space-y-3">
    <header className="hidden print:block"><h1 className="text-xl font-semibold">Material costs</h1><p>{title}</p><p className="text-sm">Internal material estimate · {report.currency}</p></header>
    <p className="text-xs text-muted-foreground">Usage includes wastage and the full quoted quantity. Purchasing quantities are rounded once per quotation, with shared costs allocated across items.</p>
    {report.warnings.length > 0 && <section className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <h2 className="font-semibold">Material checks to review</h2><ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
    </section>}
    {report.items.length === 0 && <p className="text-muted-foreground">Add a quotation item to calculate material costs.</p>}
    {report.items.length > 0 && <MaterialCostItems report={report} items={items} />}
    {report.additional.lines.length > 0 && <section className="overflow-hidden rounded-lg border">
      <header className="flex flex-wrap justify-between gap-3 border-b bg-muted/30 p-2"><div><h2 className="font-semibold">Additional quotation materials</h2>
        <p className="mt-1 text-xs text-muted-foreground">Not assigned to an individual item. Quantities shown are purchasing quantities.</p></div>
        <strong>{costingMoney(report.additional.total, report.currency)}</strong></header>
      <MaterialCostTable lines={report.additional.lines} currency={report.currency} />
    </section>}
    {showTotal && <MaterialCostTotal report={report} />}
  </article>
);
