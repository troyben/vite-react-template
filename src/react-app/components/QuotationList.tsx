import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllQuotations, deleteQuotation, type Quotation } from '../services/quotationService';
import { getAllClients, type Client } from '../services/clientService';
import '../styles/QuotationList.css';
import { ScreenLoader } from './ScreenLoader';

const QuotationList = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quotationsRes, clientsRes] = await Promise.all([
          getAllQuotations(),
          getAllClients()
        ]);
        
        // Access data from the new response format
        setQuotations(quotationsRes.data.success ? quotationsRes.data.data : []);
        
        // Create a map of clientId to client for easy lookup
        const clientMap = (clientsRes.data.success ? clientsRes.data.data : []).reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as Record<number, Client>);
        
        setClients(clientMap);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        const response = await deleteQuotation(id);
        if (response.data.success) {
          setQuotations(quotations.filter(quotation => quotation.id !== id));
        } else {
          setError('Failed to delete quotation. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting quotation:', err);
        setError('Failed to delete quotation. Please try again.');
      }
    }
  };

  // Filter quotations based on search term
  const filteredQuotations = quotations.filter(quotation => {
    const client = clients[quotation.clientId];
    return client?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Add this helper function
  const formatAmount = (amount: any): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return typeof num === 'number' && !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
  };

  // Use same status badge as QuotationDetail
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

  // Add a helper to safely format status
  const formatStatus = (status: string | undefined): string => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="quotations-page">
      <ScreenLoader isLoading={loading} />
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
          <svg 
            className="search-icon" 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M14.2939 12.5786H13.3905L13.0703 12.2699C14.2297 10.9251 14.8669 9.20834 14.8669 7.43342C14.8669 3.32878 11.5381 0 7.43342 0C3.32878 0 0 3.32878 0 7.43342C0 11.5381 3.32878 14.8669 7.43342 14.8669C9.20834 14.8669 10.9251 14.2297 12.2699 13.0703L12.5786 13.3905V14.2939L18.2962 20L20 18.2962L14.2939 12.5786ZM7.43342 12.5786C4.58878 12.5786 2.28818 10.2781 2.28818 7.43342C2.28818 4.58878 4.58878 2.28818 7.43342 2.28818C10.2781 2.28818 12.5786 4.58878 12.5786 7.43342C12.5786 10.2781 10.2781 12.5786 7.43342 12.5786Z" 
              fill="#7E88C3"
            />
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 7L11.8845 4.76892C11.5634 4.1268 10.9344 3.71429 10.2309 3.71429H4.76923C3.79149 3.71429 3 4.50578 3 5.48352V18.5165C3 19.4942 3.79149 20.2857 4.76923 20.2857H19.2308C20.2085 20.2857 21 19.4942 21 18.5165V9.28571C21 8.30797 20.2085 7.51649 19.2308 7.51649L13 7Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 7H13L21 7" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          {searchTerm ? (
            <p>No quotations found matching "<strong>{searchTerm}</strong>"</p>
          ) : (
            <>
              <p>No quotations found</p>
              <p>Create your first quotation to get started</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="quotation-list-container">
            <div className="quotation-list">
              {currentQuotations.map(quotation => (
                <div key={quotation.id} className="quotation-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div className="client-name preview-client-detail" style={{ fontWeight: 600, fontSize: 18 }}>
                      {clients[quotation.clientId]?.name || 'Loading...'}
                    </div>
                    <span
                      className={`status-badge refined-status-badge ${getStatusClass(quotation.status)}`}
                      style={{
                        marginLeft: 'auto',
                        fontSize: 14,
                        fontWeight: 700,
                        padding: '6px 16px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        minWidth: 80,
                        justifyContent: 'center'
                      }}
                    >
                      {quotation.status === 'sent' ? 'Sent' :
                        quotation.status === 'approved' ? 'Approved' :
                        quotation.status === 'draft' ? 'Draft' :
                        quotation.status === 'rejected' ? 'Rejected' :
                        quotation.status === 'paid' ? 'Paid' :
                        formatStatus(quotation.status)}
                    </span>
                  </div>
                  <div className="client-phone preview-client-detail">
                    <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3333 10.6233V12.62C13.3343 12.7967 13.2964 12.9716 13.2223 13.1336C13.1482 13.2956 13.0395 13.4407 12.9034 13.5594C12.7672 13.678 12.6067 13.7677 12.4323 13.8228C12.2579 13.8779 12.0737 13.8973 11.8917 13.88C10.1252 13.6877 8.42769 13.0732 6.94999 12.08C5.57516 11.1723 4.41297 10.0101 3.50533 8.63499C2.50666 7.14962 1.89187 5.44364 1.70133 3.66833C1.68403 3.48695 1.70328 3.30335 1.75798 3.1294C1.81268 2.95546 1.90191 2.79515 2.01991 2.65895C2.13791 2.52274 2.28215 2.4137 2.44341 2.33895C2.60468 2.26419 2.77887 2.22538 2.95499 2.22499H4.95199C5.26472 2.22186 5.56743 2.33192 5.80174 2.53529C6.03605 2.73865 6.18382 3.01957 6.21999 3.32999C6.28626 3.96002 6.43145 4.58122 6.65133 5.17833C6.7366 5.39856 6.75938 5.6383 6.71692 5.87089C6.67446 6.10349 6.56842 6.31859 6.41066 6.48499L5.61533 7.28033C6.45143 8.7056 7.62909 9.88326 9.05433 10.7193L9.84966 9.92399C10.016 9.76623 10.2311 9.66019 10.4637 9.61773C10.6963 9.57527 10.936 9.59805 11.1563 9.68333C11.7534 9.9032 12.3746 10.0484 13.0047 10.1147C13.3184 10.1514 13.6019 10.3017 13.8059 10.54C14.01 10.7784 14.1178 11.0851 14.11 11.4V10.6233H13.3333Z" fill="currentColor"/>
                    </svg>
                    {clients[quotation.clientId]?.phone || 'Loading...'}
                  </div>
                  <div className="client-address preview-client-detail">
                    <svg className="preview-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1.5C6.67392 1.5 5.40215 2.02678 4.46447 2.96447C3.52678 3.90215 3 5.17392 3 6.5C3 9.5 8 14.5 8 14.5C8 14.5 13 9.5 13 6.5C13 5.17392 12.4732 3.90215 11.5355 2.96447C10.5979 2.02678 9.32608 1.5 8 1.5ZM8 8C7.60444 8 7.21776 7.8827 6.88886 7.66294C6.55996 7.44318 6.30362 7.13082 6.15224 6.76537C6.00087 6.39991 5.96126 5.99778 6.03843 5.60982C6.1156 5.22186 6.30608 4.86549 6.58579 4.58579C6.86549 4.30608 7.22186 4.1156 7.60982 4.03843C7.99778 3.96126 8.39991 4.00087 8.76537 4.15224C9.13082 4.30362 9.44318 4.55996 9.66294 4.88886C9.8827 5.21776 10 5.60444 10 6C10 6.53043 9.78929 7.03914 9.41421 7.41421C9.03914 7.78929 8.53043 8 8 8Z" fill="currentColor"/>
                    </svg>
                    {clients[quotation.clientId]?.address || 'N/A'}
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