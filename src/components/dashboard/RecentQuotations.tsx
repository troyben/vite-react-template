import { Link } from 'react-router-dom';
import type { Quotation } from '@/services/quotationService';
import type { Client } from '@/services/clientService';
import { formatCurrency, getStatusClass, statusMap } from '@/hooks/useDashboardData';

interface RecentQuotationsProps {
  quotations: Quotation[];
  clients: Record<number, Client>;
}

export function RecentQuotations({ quotations, clients }: RecentQuotationsProps) {
  return (
    <div className="recent-quotations">
      <div className="section-header">
        <h2>Recent Quotations</h2>
        <Link to="/quotations" className="view-all-button">
          View All Quotations
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.16666 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10.8333 5L15.8333 10L10.8333 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
      {quotations.length === 0 ? (
        <p>No quotations found.</p>
      ) : (
        <div className="recent-quotations-list">
          {quotations.map(quotation => (
            <Link to={`/quotations/${quotation.id}`} key={quotation.id} className="recent-quotation-item">
              <div className="quotation-item-left">
                <div className="quotation-id">
                  <span>#</span>{quotation.id.toString().padStart(6, '0')}
                </div>
                <div className="quotation-client">
                  {clients[quotation.clientId]?.name || 'Loading...'}
                </div>
              </div>

              <div className="quotation-item-right">
                <div className="quotation-amount">
                  {formatCurrency(quotation.total_amount)}
                </div>
                <div className={`quotation-status ${getStatusClass(quotation.status)}`}>
                  <div className="status-circle"></div>
                  {statusMap[quotation.status as keyof typeof statusMap]}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
