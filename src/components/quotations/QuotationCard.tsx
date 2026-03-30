import { Link } from 'react-router-dom';
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
        <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.3333 10.6233V12.62C13.3343 12.7967 13.2964 12.9716 13.2223 13.1336C13.1482 13.2956 13.0395 13.4407 12.9034 13.5594C12.7672 13.678 12.6067 13.7677 12.4323 13.8228C12.2579 13.8779 12.0737 13.8973 11.8917 13.88C10.1252 13.6877 8.42769 13.0732 6.94999 12.08C5.57516 11.1723 4.41297 10.0101 3.50533 8.63499C2.50666 7.14962 1.89187 5.44364 1.70133 3.66833C1.68403 3.48695 1.70328 3.30335 1.75798 3.1294C1.81268 2.95546 1.90191 2.79515 2.01991 2.65895C2.13791 2.52274 2.28215 2.4137 2.44341 2.33895C2.60468 2.26419 2.77887 2.22538 2.95499 2.22499H4.95199C5.26472 2.22186 5.56743 2.33192 5.80174 2.53529C6.03605 2.73865 6.18382 3.01957 6.21999 3.32999C6.28626 3.96002 6.43145 4.58122 6.65133 5.17833C6.7366 5.39856 6.75938 5.6383 6.71692 5.87089C6.67446 6.10349 6.56842 6.31859 6.41066 6.48499L5.61533 7.28033C6.45143 8.7056 7.62909 9.88326 9.05433 10.7193L9.84966 9.92399C10.016 9.76623 10.2311 9.66019 10.4637 9.61773C10.6963 9.57527 10.936 9.59805 11.1563 9.68333C11.7534 9.9032 12.3746 10.0484 13.0047 10.1147C13.3184 10.1514 13.6019 10.3017 13.8059 10.54C14.01 10.7784 14.1178 11.0851 14.11 11.4V10.6233H13.3333Z" fill="currentColor"/>
        </svg>
        {client?.phone || 'Loading...'}
      </div>
      <div className="client-address preview-client-detail">
        <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1.5C6.67392 1.5 5.40215 2.02678 4.46447 2.96447C3.52678 3.90215 3 5.17392 3 6.5C3 9.5 8 14.5 8 14.5C8 14.5 13 9.5 13 6.5C13 5.17392 12.4732 3.90215 11.5355 2.96447C10.5979 2.02678 9.32608 1.5 8 1.5ZM8 8C7.60444 8 7.21776 7.8827 6.88886 7.66294C6.55996 7.44318 6.30362 7.13082 6.15224 6.76537C6.00087 6.39991 5.96126 5.99778 6.03843 5.60982C6.1156 5.22186 6.30608 4.86549 6.58579 4.58579C6.86549 4.30608 7.22186 4.1156 7.60982 4.03843C7.99778 3.96126 8.39991 4.00087 8.76537 4.15224C9.13082 4.30362 9.44318 4.55996 9.66294 4.88886C9.8827 5.21776 10 5.60444 10 6C10 6.53043 9.78929 7.03914 9.41421 7.41421C9.03914 7.78929 8.53043 8 8 8Z" fill="currentColor"/>
        </svg>
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
