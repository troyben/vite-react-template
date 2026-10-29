import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuotationPreviewModal from '@/components/QuotationPreviewModal';
import QuotationPDFPreview from '@/components/QuotationPDFPreview';
import type { Quotation } from '@/services/quotationService';

interface RevisionPreviewProps { quotation: Quotation; revision: number }
export const RevisionPreview: React.FC<RevisionPreviewProps> = ({ quotation, revision }) => {
  const [open, setOpen] = useState(false);
  return <><Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Eye className="h-4 w-4" />Preview</Button>
    <QuotationPreviewModal open={open} onClose={() => setOpen(false)}><h2 className="mb-3 text-lg font-semibold">Quotation #{quotation.id} · Revision {revision}</h2>
      <div className="max-h-[80vh] overflow-auto"><QuotationPDFPreview clientName={quotation.client_name} clientPhone={quotation.client_phone} clientAddress={quotation.client_address} items={quotation.items}
        totalAmount={Number(quotation.total_amount)} vatPercent={Number(quotation.vat_percent) || 0} transportFee={Number(quotation.transport_fee) || 0} grandTotal={quotation.grand_total}
        quotationId={quotation.id} createdAt={quotation.createdAt || quotation.created_at} /></div>
    </QuotationPreviewModal></>;
};
