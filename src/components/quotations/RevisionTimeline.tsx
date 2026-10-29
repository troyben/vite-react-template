import { Check, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StaffIdentity } from './StaffIdentity';
import { revisionDate, revisionReason, type HistoryPage } from '@/services/quotationHistoryService';

interface RevisionTimelineProps { history: HistoryPage; selected: number | null; page: number; onSelect: (revision: number) => void; onPage: (page: number) => void }
export const RevisionTimeline: React.FC<RevisionTimelineProps> = ({ history, selected, page, onSelect, onPage }) => (
  <aside className="min-w-0 space-y-3 lg:sticky lg:top-24">
    <div className="rounded-xl border bg-card p-3"><p className="mb-2 text-xs text-muted-foreground">Quotation created by</p>
      <StaffIdentity user={history.creator} userId={history.creatorId} fallback="Creator unavailable" /></div>
    <nav aria-label="Quotation revisions" className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2.5 text-sm font-semibold"><History className="h-4 w-4 text-muted-foreground" />Revisions<span className="ml-auto text-xs font-normal text-muted-foreground">{history.total} saved</span></div>
      <div className="max-h-[45vh] overflow-y-auto lg:max-h-[calc(100dvh-20rem)]">{history.items.map(row => <button type="button" key={row.id} onClick={() => onSelect(row.revision)} aria-current={selected === row.revision ? 'true' : undefined}
        className={`block w-full space-y-1.5 border-b border-l-2 px-3 py-3 text-left transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${selected === row.revision ? 'border-l-primary bg-primary/5' : 'border-l-transparent hover:bg-muted/50'}`}>
        <div className="flex items-center justify-between gap-2"><strong className="text-sm">Revision {row.revision}</strong>{selected === row.revision && <Check className="h-3.5 w-3.5 text-primary" />}</div>
        <p className="text-xs text-muted-foreground">{revisionReason(row.reason)} · {revisionDate(row.createdAt)}</p>
        <StaffIdentity user={row.actor} userId={row.actorId} fallback={row.actorId == null ? 'System / baseline' : undefined} />
      </button>)}</div>
      {history.totalPages > 1 && <div className="flex items-center justify-between border-t p-2"><Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" />Newer</Button>
        <span className="text-xs text-muted-foreground">{page} / {history.totalPages}</span><Button variant="ghost" size="sm" disabled={page >= history.totalPages} onClick={() => onPage(page + 1)}>Older<ChevronRight className="h-3.5 w-3.5" /></Button></div>}
    </nav>
    <p className="px-1 text-xs leading-relaxed text-muted-foreground">History contains saved copies only. Changes made before history was enabled are unavailable.</p>
  </aside>
);
