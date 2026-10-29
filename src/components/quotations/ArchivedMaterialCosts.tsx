import type { ArchivedCosting } from '@/services/quotationHistoryService';
import { costingMoney } from '@/services/costingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ArchivedMaterialCostsProps { costing: ArchivedCosting | null; originalCostingText?: string }
export const ArchivedMaterialCosts: React.FC<ArchivedMaterialCostsProps> = ({ costing, originalCostingText }) => {
  if (!costing) return <p className="rounded-xl border p-5 text-sm text-muted-foreground">{originalCostingText ? 'This older estimate could not be displayed. Its original data is preserved.' : 'No material costs were saved with this revision.'}</p>;
  const money = (value: number) => costingMoney(value, costing.currency);
  return <div className="space-y-3">
    <div className="overflow-hidden rounded-xl border bg-card"><div className="border-b px-3 py-2"><h3 className="text-sm font-semibold">Saved materials · {costing.currency}</h3><p className="text-xs text-muted-foreground">Quantities and prices captured in this revision.</p></div>
      <Table><TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Usage</TableHead><TableHead>Wastage</TableHead><TableHead>Buy</TableHead><TableHead className="text-right">Unit cost</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
        <TableBody>{costing.lines.map(line => <TableRow key={line.id}><TableCell className="font-medium">{line.name}</TableCell><TableCell>{line.quantity} {line.unit}</TableCell><TableCell>{line.wastagePercent}%</TableCell><TableCell>{line.quantityToBuy ?? '—'} {line.unit}</TableCell><TableCell className="text-right">{money(line.unitCost)}</TableCell><TableCell className="text-right font-medium">{line.lineTotal === undefined ? '—' : money(line.lineTotal)}</TableCell></TableRow>)}
          {!costing.lines.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No materials in this saved estimate.</TableCell></TableRow>}</TableBody></Table>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Materials', money(costing.totalMaterialCost ?? 0)], ['Labour', money(costing.labour)], ['Other costs', money(costing.otherCosts)], ['Markup', `${costing.markupPercent}%`],
    ].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>)}</div>
    {costing.totals && <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3"><span className="text-sm font-medium">Saved suggested price</span><strong className="text-xl tabular-nums">{money(costing.totals.suggestedPrice)}</strong></div>}
    {costing.notes && <div className="rounded-xl border p-3"><h3 className="mb-1 text-xs font-semibold text-muted-foreground">Costing notes</h3><p className="whitespace-pre-wrap text-sm">{costing.notes}</p></div>}
    {costing.warnings.length > 0 && <details className="rounded-xl border p-3 text-sm"><summary className="cursor-pointer font-medium">Saved checks & assumptions ({costing.warnings.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{costing.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
    <details className="rounded-xl border p-3 text-sm"><summary className="cursor-pointer font-medium">Material specifications & usage rules</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">{JSON.stringify({ catalogue: costing.catalogue ?? [], materials: costing.lines.map(line => ({ name: line.name, specification: line.materialSnapshot ?? null })) }, null, 2)}</pre></details>
  </div>;
};
