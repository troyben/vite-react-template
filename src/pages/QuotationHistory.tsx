import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, History as HistoryIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import { RevisionSnapshot } from '@/components/quotations/RevisionSnapshot';
import { RevisionTimeline } from '@/components/quotations/RevisionTimeline';
import { useQuotationHistory } from '@/hooks/useQuotationHistory';

const History: React.FC<{ id: string }> = ({ id }) => {
  const { history, detail, error, loading, detailLoading, selected, select, changePage, page } = useQuotationHistory(id);
  return <div className="space-y-4 p-3 md:p-4">
    <PageHeader><div><h1 className="flex items-center gap-2 text-2xl font-semibold"><HistoryIcon className="h-5 w-5 text-muted-foreground" />Quotation #{id} history</h1><p className="text-xs text-muted-foreground">Choose a revision to see the quotation and costs saved at that time.</p></div>
      <Link to={history?.deleted ? '/quotations' : `/quotations/${id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}><ArrowLeft className="h-4 w-4" />{history?.deleted ? 'Quotations' : 'Back to quotation'}</Link></PageHeader>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {history?.deleted && <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">This quotation was deleted. Its saved revisions remain available below.</p>}
    {loading ? <p role="status">Loading history…</p> : history && <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <RevisionTimeline history={history} selected={selected} page={page} onSelect={select} onPage={changePage} />
      {detailLoading || selected !== null && !detail && !error ? <p role="status" className="p-4 text-sm text-muted-foreground">Loading revision…</p>
        : detail ? <RevisionSnapshot key={detail.revision} detail={detail} /> : !history.items.length && <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">No saved revisions yet.</div>}
    </div>}
  </div>;
};
const QuotationHistory = () => { const { id } = useParams(); return id ? <History key={id} id={id} /> : null; };
export default QuotationHistory;
