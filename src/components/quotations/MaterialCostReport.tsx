import { costingMoney } from '@/services/costingService';
import type { MaterialCostReportData } from '@/services/materialCostReportService';
import { MaterialCostTable } from './MaterialCostTable';

interface MaterialCostReportProps { report: MaterialCostReportData; title: string }
export const MaterialCostReport: React.FC<MaterialCostReportProps> = ({ report, title }) => (
  <article className="material-cost-report space-y-5">
    <header className="hidden print:block"><h1 className="text-xl font-semibold">Material costs</h1><p>{title}</p><p className="text-sm">Internal material estimate · {report.currency}</p></header>
    <p className="text-xs text-muted-foreground">Each item subtotal includes its full quoted quantity. Usage includes wastage. Shared purchasing quantities are rounded for the whole quotation; their costs and rounding are allocated across items by usage.</p>
    {report.warnings.length > 0 && <section className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <h2 className="font-semibold">Material checks to review</h2><ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
    </section>}
    {report.items.length === 0 && <p className="text-muted-foreground">Add a quotation item to calculate material costs.</p>}
    {report.items.map(item => <section key={item.index} className="overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 p-4">
        <div className="min-w-0 flex-1"><h2 className="font-semibold">Item {item.index + 1} · {item.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Quoted quantity: {item.quantity}</p>
          {item.description && <p className="mt-1 whitespace-pre-line break-words text-xs text-muted-foreground">{item.description}</p>}</div>
        <div className="text-right"><p className="text-xs text-muted-foreground">Item material subtotal</p><strong>{costingMoney(item.total, report.currency)}</strong></div>
      </header>
      {item.lines.length > 0 ? <MaterialCostTable lines={item.lines} currency={report.currency} />
        : <p className="p-4 text-sm text-muted-foreground">No automatic material costs for this item. Review any material checks above.</p>}
    </section>)}
    {report.additional.lines.length > 0 && <section className="overflow-hidden rounded-lg border">
      <header className="flex flex-wrap justify-between gap-3 border-b bg-muted/30 p-4"><div><h2 className="font-semibold">Additional quotation materials</h2>
        <p className="mt-1 text-xs text-muted-foreground">Not assigned to an individual item. Quantities shown are purchasing quantities.</p></div>
        <strong>{costingMoney(report.additional.total, report.currency)}</strong></header>
      <MaterialCostTable lines={report.additional.lines} currency={report.currency} />
    </section>}
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div><h2 className="font-semibold">Total material cost</h2><p className="mt-1 text-xs text-muted-foreground">{report.currency} · Materials only, before labour, markup, VAT and transport.</p></div>
      <strong className="text-2xl">{costingMoney(report.total, report.currency)}</strong>
    </footer>
  </article>
);
