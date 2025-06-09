import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { type Quotation, type QuotationItem } from '../services/api';
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
        const data = await api.getQuotationById(parseInt(id));
        setQuotation(data);
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
        await api.deleteQuotation(parseInt(id));
        navigate('/');
      } catch (err) {
        console.error('Error deleting quotation:', err);
        setError('Failed to delete quotation. Please try again.');
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'sent': return 'status-sent';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
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
              <span className={`status-badge refined-status-badge ${getStatusClass(quotation.status)}`}>{quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}</span>
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
                  <td>£{item.price.toFixed(2)}</td>
                  <td className="text-right">£{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="refined-total-row">
                <td colSpan={4} className="text-right refined-total-label">Total:</td>
                <td className="text-right refined-total-value">£{quotation.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;