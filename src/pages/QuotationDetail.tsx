import { Link } from 'react-router-dom';
import { useQuotationDetail } from '@/hooks/useQuotationDetail';
import { StatusBadge } from '@/components/quotations/StatusBadge';
import { QuotationItemRow } from '@/components/quotations/QuotationItemRow';
import { formatAmount, type QuotationStatus } from '@/utils/quotationHelpers';
import type { QuotationItem } from '@/services/quotationService';
import '@/styles/QuotationDetail.css';

const QuotationDetail = () => {
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

  if (loading) return <div>Loading quotation details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quotation) return <div>Quotation not found.</div>;

  const items: QuotationItem[] = Array.isArray(quotation.items) ? quotation.items : [];

  return (
    <div className="quotation-detail-page" style={{ maxWidth: '100%', width: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">Quotation Details</h1>
        <div className="detail-actions">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary"
            style={{ marginRight: '12px', position: 'relative' }}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <span className="loader" style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                border: '2.5px solid #ccc',
                borderTop: '2.5px solid #7E88C3',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                marginRight: 8,
                verticalAlign: 'middle'
              }} />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: '8px' }}
              >
                <path d="M14 6H10V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 6L10 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11V14H2V2H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <select
            value={quotation.status || 'draft'}
            onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
            className={`form-select status-select ${quotation.status ? `status-${quotation.status}` : 'status-draft'}`}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e0e7ff',
              marginRight: '12px',
              fontSize: '14px',
              color: '#495057'
            }}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
          <Link to="/" className="btn btn-primary">Back to List</Link>
          <Link to={`/quotations/edit/${id}`} className="btn btn-primary">Edit</Link>
          <button onClick={handleDelete} className="btn btn-secondary btn-danger">Delete</button>
        </div>
      </div>

      <div className="quotation-card refined-quotation-card" style={{ maxWidth: '100%', width: '100%' }}>
        <div className="client-info-row refined-client-info-row">
          <div className="client-info-block refined-client-info-block">
            <div className="client-info-header">
              <span className="client-title">Client</span>
              <StatusBadge status={quotation.status} />
            </div>
            <div className="client-name refined-client-name">{quotation.client_name}</div>
            <div className="client-email refined-client-email">{quotation.client_email}</div>
            {quotation.created_at && (
              <div className="client-date refined-client-date">Created: {new Date(quotation.created_at).toLocaleDateString()}</div>
            )}
          </div>
        </div>

        <div className="items-section refined-items-section">
          <div className="items-header-row refined-items-header-row">
            <h3>Items</h3>
          </div>
          <table className="items-table modern-table refined-items-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item &amp; Description</th>
                <th>Quantity</th>
                <th>Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: QuotationItem, index: number) => (
                <QuotationItemRow key={index} item={item} />
              ))}
            </tbody>
            <tfoot>
              <tr className="refined-total-row">
                <td colSpan={3} className="text-right refined-total-label">Total:</td>
                <td className="text-right refined-total-value">{formatAmount(quotation.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }`}</style>
    </div>
  );
};

export default QuotationDetail;
