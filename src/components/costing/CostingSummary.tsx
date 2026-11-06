import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { costingMoney, costingTotals } from '@/services/costingService';
import type { CostingSnapshot } from '@/services/costingTypes';

export function CostingSummary({ snapshot, onChange }: { snapshot: CostingSnapshot; onChange: (change: Partial<CostingSnapshot>) => void }) {
  const totals = costingTotals(snapshot);
  const incomplete = snapshot.lines.length === 0 || snapshot.warnings.length > 0 || snapshot.lines.some(l => l.quantity === 0 || l.unitCost === 0);
  const money = (n: number) => costingMoney(n, snapshot.currency);
  return <aside className="space-y-5 rounded-xl border bg-card p-5">
    <div><h2 className="font-semibold">Cost & selling price</h2><p className="mt-1 text-sm text-muted-foreground">Internal estimate · {snapshot.currency}</p></div>
    <div className="flex justify-between text-sm"><span>Materials incl. wastage</span><strong>{money(totals.materials)}</strong></div>
    {([{ key: 'labour', label: 'Labour & installation' }, { key: 'otherCosts', label: 'Transport & other costs' }, { key: 'markupPercent', label: 'Markup on cost (%)' }] as const).map(field =>
      <div key={field.key} className="space-y-2"><Label htmlFor={field.key}>{field.label}</Label><Input id={field.key} type="number" min="0"
        max={field.key === 'markupPercent' ? '1000' : '1000000000'} step="0.01" value={snapshot[field.key]} onChange={e => onChange({ [field.key]: Number(e.target.value) })} /></div>)}
    {incomplete && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-950">Review the material checks and any zero quantities or rates before using this total.</p>}
    <div className="space-y-3 border-t pt-4 text-sm">
      <div className="flex justify-between"><span>Total job cost</span><strong>{money(totals.cost)}</strong></div>
      <div className="flex justify-between"><span>Markup amount</span><span>{money(totals.markup)}</span></div>
      <div className="flex justify-between gap-2 text-base font-semibold"><span>{incomplete ? 'Partial estimate' : 'Suggested price'}</span><span>{money(totals.sellingPrice)}</span></div>
      <p className="text-xs text-muted-foreground">Before tax. Enter the agreed selling price in your quotation. Saving costing does not change quotation prices.</p>
    </div>
    <div className="space-y-2"><Label htmlFor="costing-notes">Costing notes</Label><Textarea id="costing-notes" value={snapshot.notes} maxLength={10000} placeholder="Allowances, supplier prices, exclusions…" onChange={e => onChange({ notes: e.target.value })} /></div>
  </aside>;
}
