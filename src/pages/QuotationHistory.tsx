import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { RevisionSnapshot } from '@/components/quotations/RevisionSnapshot';
import { useQuotationHistory } from '@/hooks/useQuotationHistory';
import { revisionReason } from '@/services/quotationHistoryService';

function History({ id }: { id: string }) {
  const state = useQuotationHistory(id);
  const { history, detail, error, loading, detailLoading, selected, select, changePage, page } = state;
  return <div className="space-y-6 p-4 md:p-6">
    <PageHeader><div><h1 className="text-2xl font-semibold">Quotation #{id} history</h1><p className="text-sm text-muted-foreground">Saved copies preserve the quotation, material rules, quantities and prices at that time.</p></div>
      <Link to={history?.deleted ? '/quotations' : `/quotations/${id}`} className={buttonVariants({ variant: 'outline' })}><ArrowLeft className="h-4 w-4" />{history?.deleted ? 'Quotations' : 'Back to quotation'}</Link></PageHeader>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {loading ? <p role="status">Loading history…</p> : history && <>
      <p className="text-sm text-muted-foreground">{history.total} saved revisions. Earlier changes overwritten before history was enabled cannot be recovered.{history.deleted && ' The live quotation has been deleted; these saved revisions remain available.'}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Quotation revisions" className="space-y-2">{history.items.map(row => <Button key={row.id} variant={selected === row.revision ? 'secondary' : 'outline'} className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => select(row.revision)} aria-current={selected === row.revision ? 'true' : undefined}>
          <span><strong>Revision {row.revision}</strong><br />{revisionReason(row.reason)}<br /><span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span></span></Button>)}
          <div className="flex items-center justify-between gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => changePage(page - 1)}>Newer</Button><Button variant="outline" size="sm" disabled={page >= history.totalPages} onClick={() => changePage(page + 1)}>Older</Button></div></nav>
        {detailLoading ? <p role="status">Loading revision…</p> : detail && <RevisionSnapshot detail={detail} />}
      </div>
    </>}
  </div>;
}
export default function QuotationHistory() {
  const { id } = useParams();
  return id ? <History key={id} id={id} /> : null;
}
