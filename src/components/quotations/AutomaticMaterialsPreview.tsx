import { useAutomaticMaterials } from '@/hooks/useAutomaticMaterials';
import type { QuotationItem } from '@/services/quotationService';
import { costingMoney, costingTotals, lineQuantity, lineTotal } from '@/services/costingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AutomaticMaterialsPreview({ items, quotationId }: { items: QuotationItem[]; quotationId?: string }) {
  const { snapshot, loading, error } = useAutomaticMaterials(items, quotationId);
  return <section className="my-4 space-y-3 rounded-xl border bg-muted/20 p-4" aria-live="polite" aria-busy={loading}>
    <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">Automatic materials & cost</h2><p className="mt-1 text-sm text-muted-foreground">Calculated from your material usage rules and saved with this quotation.</p></div>
      <div className="text-right"><p className="text-xs text-muted-foreground">Internal material cost{snapshot?.warnings.length ? ' · needs review' : ''}</p><strong className="text-xl">{loading ? 'Calculating…' : snapshot ? costingMoney(costingTotals(snapshot).materials, snapshot.currency) : '—'}</strong></div></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {snapshot && <>
      {snapshot.warnings.length > 0 && <details className="rounded-md bg-amber-50 p-3 text-sm text-amber-950"><summary className="cursor-pointer">{snapshot.warnings.length} material checks need review</summary><ul className="mt-2 list-disc space-y-1 pl-5">{snapshot.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
      {snapshot.lines.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">View bill of materials ({snapshot.lines.length} materials)</summary><Table className="mt-2"><TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Quantity incl. wastage</TableHead><TableHead>Unit cost</TableHead><TableHead>Total cost</TableHead></TableRow></TableHeader><TableBody>
        {snapshot.lines.map(line => <TableRow key={line.id}><TableCell>{line.name}</TableCell><TableCell>{lineQuantity(line)} {line.unit}</TableCell><TableCell>{costingMoney(line.unitCost, snapshot.currency)}</TableCell><TableCell>{costingMoney(lineTotal(line), snapshot.currency)}</TableCell></TableRow>)}
      </TableBody></Table></details>}
    </>}
  </section>;
}
