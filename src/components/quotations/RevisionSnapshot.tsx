import type { RevisionDetail } from '@/services/quotationHistoryService';
import { revisionReason } from '@/services/quotationHistoryService';
import { costingMoney } from '@/services/costingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QuotationPDFPreview from '@/components/QuotationPDFPreview';

export function RevisionSnapshot({ detail }: { detail: RevisionDetail }) {
  const { quotation, costing, originalCostingText } = detail.snapshot;
  const frozenQuote = { ...quotation, items: typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items };
  const money = (n: number) => costingMoney(n, costing?.currency || 'USD');
  return <section className="min-w-0 space-y-4" aria-label={`Revision ${detail.revision}`}>
    <div><h2 className="text-lg font-semibold">Revision {detail.revision} · {revisionReason(detail.reason)}</h2>
      <p className="text-sm text-muted-foreground">{new Date(detail.createdAt).toLocaleString()} · {detail.actorId ? `Staff #${detail.actorId}` : 'Migration baseline'} · Read only</p></div>
    {costing ? <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Saved materials and costs ({costing.currency})</h3>
      <Table><TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Usage</TableHead><TableHead>Wastage</TableHead><TableHead>Buy</TableHead><TableHead>Unit cost</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
        <TableBody>{costing.lines.map(line => <TableRow key={line.id}><TableCell>{line.name}</TableCell><TableCell>{line.quantity} {line.unit}</TableCell><TableCell>{line.wastagePercent}%</TableCell><TableCell>{line.quantityToBuy ?? '—'} {line.unit}</TableCell><TableCell>{money(line.unitCost)}</TableCell><TableCell>{line.lineTotal === undefined ? '—' : money(line.lineTotal)}</TableCell></TableRow>)}</TableBody></Table>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>Materials: <strong>{money(costing.totalMaterialCost ?? 0)}</strong></span><span>Labour: {money(costing.labour)}</span><span>Other: {money(costing.otherCosts)}</span><span>Markup: {costing.markupPercent}%</span>
        {costing.totals && <span>Suggested price: <strong>{money(costing.totals.suggestedPrice)}</strong></span>}</div>
      {costing.notes && <p className="whitespace-pre-wrap text-sm">{costing.notes}</p>}
      {costing.warnings.length > 0 && <details className="text-sm"><summary>Saved checks and assumptions</summary><ul className="list-disc pl-5">{costing.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
      <details className="text-sm"><summary>Captured material specifications and usage rules</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({ catalogue: costing.catalogue ?? [], materials: costing.lines.map(line => ({ name: line.name, specification: line.materialSnapshot ?? null })) }, null, 2)}</pre></details>
    </div> : <p className="text-sm text-muted-foreground">{originalCostingText ? 'The original costing could not be parsed. Its original text is preserved in this revision.' : 'No internal costing was saved with this revision.'}</p>}
    <div className="overflow-x-auto"><QuotationPDFPreview clientName={frozenQuote.client_name} clientPhone={frozenQuote.client_phone}
      clientAddress={frozenQuote.client_address} items={frozenQuote.items} totalAmount={Number(frozenQuote.total_amount)}
      vatPercent={Number(frozenQuote.vat_percent) || 0} transportFee={Number(frozenQuote.transport_fee) || 0}
      grandTotal={frozenQuote.grand_total} quotationId={frozenQuote.id} createdAt={frozenQuote.createdAt || frozenQuote.created_at} /></div>
  </section>;
}
