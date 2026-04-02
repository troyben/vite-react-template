import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuotationDetail } from '@/hooks/useQuotationDetail';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/quotations/StatusBadge';
import QuotationPDFPreview from '@/components/QuotationPDFPreview';
import { Button, buttonVariants } from '@/components/ui/button';
import { Download, Pencil, Trash2, Loader2, ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuotationStatus } from '@/utils/quotationHelpers';
import type { QuotationItem } from '@/services/quotationService';

const STATUS_OPTIONS: { value: QuotationStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
];

const ZOOM_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5];
const DEFAULT_ZOOM_INDEX = 5; // 1 = 100%

const QuotationDetail = () => {
  const { user } = useAuth();
  const {
    id,
    quotation,
    loading,
    error,
    pdfLoading,
    handleDelete,
    handleStatusChange,
    handleExportPDF,
  } = useQuotationDetail();

  const canWrite = (() => {
    if (!user || !quotation) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'client') return false;
    if (quotation.createdBy === null) return false;
    return quotation.createdBy === user.id;
  })();

  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_STEPS[zoomIndex];

  const zoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));
  const zoomReset = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

  if (loading) return <div className="p-6 text-muted-foreground">Loading quotation details...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!quotation) return <div className="p-6 text-muted-foreground">Quotation not found.</div>;

  const items: QuotationItem[] = Array.isArray(quotation.items) ? quotation.items : [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/quotations" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold">Quotation #{quotation.id}</h1>
          <StatusBadge status={quotation.status} />
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Select
              value={quotation.status || 'draft'}
              onValueChange={(val) => handleStatusChange(val as QuotationStatus)}
            >
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            {pdfLoading ? 'Generating...' : 'PDF'}
          </Button>
          {canWrite && (
            <>
              <Link to={`/quotations/edit/${id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Link>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Zoom Controls ── */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon-xs" onClick={zoomOut} disabled={zoomIndex === 0}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <button
          onClick={zoomReset}
          className="text-xs text-muted-foreground hover:text-foreground tabular-nums min-w-[3rem] text-center cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button variant="outline" size="icon-xs" onClick={zoomIn} disabled={zoomIndex === ZOOM_STEPS.length - 1}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        {zoomIndex !== DEFAULT_ZOOM_INDEX && (
          <Button variant="ghost" size="icon-xs" onClick={zoomReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* ── Quotation Document ── */}
      <div className="overflow-auto">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%` }}
        >
          <QuotationPDFPreview
            clientName={quotation.client_name}
            clientPhone={quotation.client_phone}
            clientAddress={quotation.client_address}
            items={items}
            totalAmount={quotation.total_amount}
            quotationId={quotation.id}
            createdAt={quotation.createdAt || quotation.created_at}
          />
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;
