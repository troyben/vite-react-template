import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getQuotationById, deleteQuotation, updateQuotation, type Quotation, type QuotationItem } from '../services/quotationService';
import { notify } from '../utils/notifications';
import { exportQuotationToPDF } from '../utils/pdfExport';
import '../styles/QuotationDetail.css';

const QuotationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await getQuotationById(parseInt(id));
        if (response.data.success) {
          // Parse items if they're a string
          const quotationData = response.data.data;
          setQuotation({
            ...quotationData,
            items: typeof quotationData.items === 'string' 
              ? JSON.parse(quotationData.items) 
              : quotationData.items,
            // Ensure status has a default value
            status: quotationData.status || 'draft'
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching quotation:', err);
        setError('Failed to fetch quotation details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !quotation) return;
    
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(parseInt(id));
        navigate('/');
      } catch (err) {
        console.error('Error deleting quotation:', err);
        setError('Failed to delete quotation. Please try again.');
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !quotation) return;
    
    try {
      setLoading(true);
      const response = await updateQuotation(parseInt(id), {
        ...quotation,
        status: newStatus,
        // Ensure items is stringified if needed by the backend
        items: typeof quotation.items === 'string' ? quotation.items : JSON.stringify(quotation.items)
      });
      
      if (response.data.success) {
        setQuotation((prev: any) => prev ? { ...prev, status: newStatus } : null);
        notify.success(`Quotation status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      notify.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!quotation) return;
    try {
      await exportQuotationToPDF(quotation);
      notify.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notify.error('Failed to generate PDF');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'sent': return 'status-sent';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'paid': return 'status-paid';
      default: return '';
    }
  };

  // Add a helper function for safe status formatting
  const formatStatus = (status: string | undefined): string => {
    if (!status) return 'Draft';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Add helper function for formatting amounts
  const formatAmount = (amount: any): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return typeof num === 'number' && !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
  };

  if (loading) return <div>Loading quotation details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quotation) return <div>Quotation not found.</div>;

  const items = Array.isArray(quotation.items) 
    ? quotation.items 
    : [];

  return (
    <div className="quotation-detail-page">
      <div className="page-header">
        <h1 className="page-title">Quotation Details</h1>
        <div className="detail-actions">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary"
            style={{ marginRight: '12px' }}
          >
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
            Download PDF
          </button>
          <select 
            value={quotation?.status || 'draft'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`form-select status-select ${getStatusClass(quotation?.status || 'draft')}`}
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

      <div className="quotation-card refined-quotation-card">
        <div className="client-info-row refined-client-info-row">
          <div className="client-info-block refined-client-info-block">
            <div className="client-info-header">
              <span className="client-title">Client</span>
              <span className={`status-badge refined-status-badge ${getStatusClass(quotation.status)}`}>
                {formatStatus(quotation.status)}
              </span>
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
          <table className="items-table modern-table refined-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: QuotationItem, index: number) => (
                <tr key={index}>
                  <td>{item.item}</td>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td className="text-right">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="refined-total-row">
                <td colSpan={4} className="text-right refined-total-label">Total:</td>
                <td className="text-right refined-total-value">{formatAmount(quotation.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;