import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Loader2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/quotations/StatusBadge';
import { QuotationItemsCard } from '@/components/quotations/QuotationItemsCard';
import { QuotationTotals } from '@/components/quotations/QuotationTotals';
import { MaterialCostAction } from '@/components/quotations/MaterialCostAction';
import QuotationPreviewModal from '@/components/QuotationPreviewModal';
import QuotationPDFPreview from '@/components/QuotationPDFPreview';
import { useQuotationDetail } from '@/hooks/useQuotationDetail';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessQuotationCosts } from '@/services/quotationPresentationService';

const QuotationDetail = () => {
  const { user } = useAuth();
  const { id, quotation, loading, error, pdfLoading, handleExportPDF } = useQuotationDetail();
  const [preview, setPreview] = useState(false);
  if (loading) return <div className="p-6 text-muted-foreground">Loading quotation details...</div>;
  if (error) return <div className="p-6 text-destructive" role="alert">{error}</div>;
  if (!quotation) return <div className="p-6 text-muted-foreground">Quotation not found.</div>;
  const canManage = canAccessQuotationCosts(user, quotation);
  return <div className="space-y-3 p-3 md:p-4">
    <PageHeader><div className="flex flex-wrap items-center gap-3">
      <Link to="/quotations" aria-label="Back to quotations" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}><ArrowLeft className="h-4 w-4" /></Link>
      <h1 className="text-2xl font-semibold">Quotation #{quotation.id}</h1><StatusBadge status={quotation.status} />
    </div><div className="flex flex-wrap items-center gap-2">
      {canManage && <MaterialCostAction items={quotation.items} quotationId={String(quotation.id)} clientName={quotation.client_name} savedOnly />}
      <Button type="button" variant="outline" size="sm" onClick={() => setPreview(true)}><Eye className="h-4 w-4" />Preview</Button>
      <Button type="button" variant="outline" size="sm" onClick={handleExportPDF} disabled={pdfLoading}>{pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{pdfLoading ? 'Generating...' : 'PDF'}</Button>
      {canManage && <><Link to={`/quotations/${id}/history`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>History</Link>
        <Link to={`/quotations/edit/${id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}><Pencil className="h-4 w-4" />Edit</Link></>}
    </div></PageHeader>
    <QuotationItemsCard items={quotation.items} client={{ name: quotation.client_name, phone: quotation.client_phone, address: quotation.client_address }} />
    <QuotationTotals subtotal={Number(quotation.total_amount) || 0} vatPercent={Number(quotation.vat_percent) || 0} transportFee={Number(quotation.transport_fee) || 0} />
    <QuotationPreviewModal open={preview} onClose={() => setPreview(false)}><div className="mb-4 px-2"><h2 className="text-lg font-semibold">Quotation Preview</h2></div>
      <div className="max-h-[80vh] overflow-auto"><QuotationPDFPreview clientName={quotation.client_name} clientPhone={quotation.client_phone} clientAddress={quotation.client_address}
        items={quotation.items} totalAmount={Number(quotation.total_amount) || 0} vatPercent={Number(quotation.vat_percent) || 0} transportFee={Number(quotation.transport_fee) || 0}
        grandTotal={Number(quotation.grand_total) || undefined} quotationId={quotation.id} createdAt={quotation.createdAt || quotation.created_at} /></div>
    </QuotationPreviewModal>
  </div>;
};
export default QuotationDetail;
