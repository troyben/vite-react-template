import { FileText, Layers, LockKeyhole } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { archivedQuotation, revisionDate, revisionReason, type RevisionDetail } from '@/services/quotationHistoryService';
import { StaffIdentity } from './StaffIdentity';
import { QuotationItemsCard } from './QuotationItemsCard';
import { QuotationTotals } from './QuotationTotals';
import { StatusBadge } from './StatusBadge';
import { ArchivedMaterialCosts } from './ArchivedMaterialCosts';
import { RevisionPreview } from './RevisionPreview';

interface RevisionSnapshotProps { detail: RevisionDetail }
export const RevisionSnapshot: React.FC<RevisionSnapshotProps> = ({ detail }) => {
  const quotation = archivedQuotation(detail);
  return <section className="min-w-0 space-y-3" aria-label={`Revision ${detail.revision}`}>
    <div className="rounded-xl border bg-card p-3 sm:p-4"><div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Revision {detail.revision}</h2><StatusBadge status={quotation.status} />
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><LockKeyhole className="h-3 w-3" />Read only</span></div>
        <p className="mt-1 text-xs text-muted-foreground">{revisionReason(detail.reason)} · {revisionDate(detail.createdAt)}</p></div>
      <RevisionPreview quotation={quotation} revision={detail.revision} />
    </div><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3"><span className="text-xs text-muted-foreground">{detail.reason === 'created' ? 'Created by' : 'Saved by'}</span>
      <StaffIdentity user={detail.actor} userId={detail.actorId} fallback={detail.actorId == null ? 'System / baseline' : undefined} /></div></div>
    <Tabs defaultValue="quotation" className="flex-col gap-3"><div className="max-w-full overflow-x-auto"><TabsList aria-label="Revision content" className="h-9 shrink-0"><TabsTrigger value="quotation"><FileText />Quotation</TabsTrigger><TabsTrigger value="costs"><Layers />Materials & costs</TabsTrigger></TabsList></div>
      <TabsContent value="quotation" className="min-w-0 space-y-3"><QuotationItemsCard items={quotation.items} client={{ name: quotation.client_name, phone: quotation.client_phone, address: quotation.client_address }} />
        <QuotationTotals subtotal={Number(quotation.total_amount) || 0} vatPercent={Number(quotation.vat_percent) || 0} transportFee={Number(quotation.transport_fee) || 0} />
        {quotation.notes && <div className="rounded-xl border p-3"><h3 className="mb-1 text-xs font-semibold text-muted-foreground">Quotation notes</h3><p className="whitespace-pre-wrap text-sm">{quotation.notes}</p></div>}
      </TabsContent>
      <TabsContent value="costs"><ArchivedMaterialCosts costing={detail.snapshot.costing} originalCostingText={detail.snapshot.originalCostingText} /></TabsContent>
    </Tabs>
  </section>;
};
