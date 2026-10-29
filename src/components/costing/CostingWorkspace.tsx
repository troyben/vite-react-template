import { PageHeader } from '@/components/PageHeader';
import { ArrowLeft, Download, Save, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCosting } from '@/hooks/useCosting';
import { COSTING_CURRENCIES } from '@/services/costingTypes';
import { downloadQuantities } from '@/services/costingService';
import { CostingMaterials } from './CostingMaterials';
import { CostingSummary } from './CostingSummary';

export function CostingWorkspace({ id }: { id: string }) {
  const state = useCosting(id);
  const { quotation, snapshot, loading, saving, error, saveError, revision, dirty, saved, materials, update, updateLine, generate, save } = state;
  if (loading) return <p className="p-6" role="status">Loading costing…</p>;
  if (error || !quotation) return <div className="space-y-3 p-6"><p role="alert" className="text-destructive">{error || 'Quotation not found.'}</p><Link to={`/quotations/${id}`}>Back to quotation</Link></div>;
  return <form className="space-y-6 p-4 md:p-6" onSubmit={e => { e.preventDefault(); void save(); }}>
    <PageHeader>
      <div className="flex gap-3"><Link aria-label="Back to quotation" to={`/quotations/${id}`} className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}><ArrowLeft className="h-4 w-4" /></Link>
        <div><h1 className="text-2xl font-semibold">Costing & bill of materials</h1><p className="mt-1 text-sm text-muted-foreground">Quotation #{id} · Revision {revision} · {quotation.client_name} · {dirty ? 'Unsaved changes' : saved ? 'Saved estimate' : 'New estimate'}</p></div></div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/quotations/${id}/history`} className={buttonVariants({ variant: 'outline' })}>History</Link>
        <Button type="button" variant="outline" onClick={() => downloadQuantities(snapshot, id)} disabled={snapshot.lines.length === 0 || saving}><Download className="h-4 w-4" />Export quantities</Button>
        <Button type="submit" disabled={saving || (!dirty && saved)}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save costing'}</Button>
      </div>
    </PageHeader>
    {saveError && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{saveError} Your draft is still here. Reload this page to load the latest saved version.</p>}
    <fieldset disabled={saving} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
        <div><p className="font-medium">Materials are calculated automatically when you save a quotation</p><p className="mt-1 text-sm text-muted-foreground">Dimensions and quantities determine usage. Saved material rules and rates stay fixed until you refresh the catalogue.</p></div>
        <div className="flex gap-2"><Select value={snapshot.currency} onValueChange={v => { if (v) update({ currency: v }); }} disabled={snapshot.lines.length > 0 || snapshot.labour > 0 || snapshot.otherCosts > 0}>
          <SelectTrigger aria-label="Costing currency"><SelectValue /></SelectTrigger><SelectContent>{COSTING_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Button type="button" variant="outline" onClick={generate}><WandSparkles className="h-4 w-4" />Refresh from catalogue</Button></div>
      </div>
      {(snapshot.warnings.length > 0 || snapshot.lines.some(l => l.quantity === 0 || l.unitCost === 0)) && <details className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <summary className="cursor-pointer font-medium">Drawing checks & assumptions</summary><p className="mt-2">These checks were recorded when quantities were generated. Review them as you complete the BOQ.</p><ul className="mt-2 list-disc space-y-1 pl-5">
          {snapshot.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
          {snapshot.lines.some(l => l.quantity === 0 || l.unitCost === 0) && <li>Some lines have zero quantities or rates. These do not contribute a full cost.</li>}
        </ul></details>}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <CostingMaterials snapshot={snapshot} materials={materials} onLinesChange={lines => update({ lines })} onLineChange={updateLine} />
        <CostingSummary snapshot={snapshot} onChange={update} />
      </div>
    </fieldset>
  </form>;
}
