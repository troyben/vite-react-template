import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
          <ArrowRight className="w-5 h-5" />
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
