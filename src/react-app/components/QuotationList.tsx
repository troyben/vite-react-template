import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { type Quotation } from '../services/api';
import '../styles/QuotationList.css';

const QuotationList = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const data = await api.getQuotations();
        setQuotations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quotations:', err);
        setError('Failed to fetch quotations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await api.deleteQuotation(id);
        setQuotations(quotations.filter(quotation => quotation.id !== id));
      } catch (err) {
        console.error('Error deleting quotation:', err);
        setError('Failed to delete quotation. Please try again.');
      }
    }
  };

  // Filter quotations based on search term
  const filteredQuotations = quotations.filter(quotation => 
    quotation.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#FF8F00';
      case 'accepted': return '#33D69F';
      case 'draft': return '#373B53';
      default: return '#7E88C3';
    }
  };

  if (loading) return <div>Loading quotations...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="quotations-page">
      <div className="header">
        <div className="header-left">
          <h1>Quotations</h1>
        </div>
        <div className="header-actions">
          <Link to="/quotations/new" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M8 1V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create New Quotation
          </Link>
        </div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.435 10.063h-.723l-.256-.247a5.92 5.92 0 001.437-3.87 5.946 5.946 0 10-5.947 5.947 5.92 5.92 0 003.87-1.437l.247.256v.723L14.637 16 16 14.637l-4.565-4.574zm-5.489 0A4.111 4.111 0 011.83 5.946 4.111 4.111 0 015.946 1.83a4.111 4.111 0 014.117 4.116 4.111 4.111 0 01-4.117 4.117z" fill="#7E88C3" fillRule="nonzero" />
          </svg>
          <input
            type="text"
            placeholder="Search by client name"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredQuotations.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <p>No quotations found matching "{searchTerm}".</p>
          ) : (
            <p>No quotations found. Create your first quotation to get started.</p>
          )}
        </div>
      ) : (
        <>
          <div className="quotation-list-container">
            <div className="quotation-list">
              {currentQuotations.map(quotation => (
                <div key={quotation.id} className="quotation-card">
                  <div className="client-name">{quotation.client_name}</div>
                  <div className="status" style={{ color: getStatusColor(quotation.status) }}>
                    {quotation.status === 'sent' ? 'Sent' :
                     quotation.status === 'accepted' ? 'Accepted' :
                     quotation.status === 'draft' ? 'Draft' :
                     quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </div>
                  <div className="client-email">{quotation.client_email}</div>
                  <div className="amount">Total: £{quotation.total_amount.toFixed(2)}</div>
                  
                  <div className="action-buttons">
                    <Link to={`/quotations/${quotation.id}`} className="action-btn view-btn">
                      View
                    </Link>
                    <Link to={`/quotations/edit/${quotation.id}`} className="action-btn edit-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={() => quotation.id && handleDelete(quotation.id)}
                      className="action-btn delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button prev"
                >
                  &lt; Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button next"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuotationList; 