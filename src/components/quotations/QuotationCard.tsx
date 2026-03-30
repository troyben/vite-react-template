import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import type { Quotation } from '@/services/quotationService';
import type { Client } from '@/services/clientService';
import { StatusBadge } from '@/components/quotations/StatusBadge';
import { formatAmount } from '@/utils/quotationHelpers';

interface QuotationCardProps {
  quotation: Quotation;
  client: Client | undefined;
  onDelete: (id: number) => void;
}

export function QuotationCard({ quotation, client, onDelete }: QuotationCardProps) {
  return (
    <div className="quotation-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="client-name preview-client-detail" style={{ fontWeight: 600, fontSize: 18 }}>
          {client?.name || 'Loading...'}
        </div>
        <StatusBadge status={quotation.status} className="ml-auto" />
      </div>
      <div className="client-phone preview-client-detail">
        <Phone className="preview-icon w-4 h-4" />
        {client?.phone || 'Loading...'}
      </div>
      <div className="client-address preview-client-detail">
        <MapPin className="preview-icon w-4 h-4" />
        {client?.address || 'N/A'}
      </div>
      <div className="amount">Total: {formatAmount(quotation.total_amount)}</div>
      <div className="action-buttons">
        <Link to={`/quotations/${quotation.id}`} className="action-btn view-btn">
          View
        </Link>
        <Link to={`/quotations/edit/${quotation.id}`} className="action-btn edit-btn">
          Edit
        </Link>
        <button
          onClick={() => quotation.id && onDelete(quotation.id)}
          className="action-btn delete-btn"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
