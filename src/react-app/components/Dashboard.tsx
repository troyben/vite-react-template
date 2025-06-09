import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { type Quotation } from '../services/api';
import '../styles/variables.css';
import '../styles/Dashboard.css';

const statusMap = {
  'draft': 'Draft',
  'sent': 'Pending',
  'approved': 'Paid',
  'rejected': 'Rejected'
};

const Dashboard = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const data = await api.getQuotations();
        setQuotations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quotations:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const getStatusClass = (status: string) => {
    const mappedStatus = statusMap[status as keyof typeof statusMap];
    if (!mappedStatus) return '';
    
    const uiStatus = mappedStatus.toLowerCase();
    switch (uiStatus) {
      case 'pending': return 'status-pending';
      case 'paid': return 'status-paid';
      case 'draft': return 'status-draft';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  // Calculate statistics
  const totalQuotations = quotations.length;
  const paidQuotations = quotations.filter(q => q.status === 'accepted');
  const paidAmount = paidQuotations.reduce((sum, quotation) => sum + quotation.total_amount, 0);
  const pendingQuotations = quotations.filter(q => q.status === 'sent');
  const pendingAmount = pendingQuotations.reduce((sum, quotation) => sum + quotation.total_amount, 0);
  const draftQuotations = quotations.filter(q => q.status === 'draft');

  // Get recent quotations (last 5)
  const recentQuotations = [...quotations]
    .sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    })
    .slice(0, 5);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Welcome to your quotation management system</p>
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
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon total-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0H3C1.3 0 0 1.3 0 3V17C0 18.7 1.3 20 3 20H17C18.7 20 20 18.7 20 17V3C20 1.3 18.7 0 17 0ZM3 2H17C17.6 2 18 2.4 18 3V17C18 17.6 17.6 18 17 18H3C2.4 18 2 17.6 2 17V3C2 2.4 2.4 2 3 2Z" fill="currentColor"/>
              <path d="M5 6H15V8H5V6Z" fill="currentColor"/>
              <path d="M5 10H15V12H5V10Z" fill="currentColor"/>
              <path d="M5 14H11V16H5V14Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Quotations</h3>
            <p className="stat-value">{totalQuotations}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon paid-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="currentColor" fillOpacity="0.2"/>
              <path d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Paid</h3>
            <p className="stat-value">{formatCurrency(paidAmount)}</p>
            <p className="stat-subtext">{paidQuotations.length} quotations</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.5 0 0 4.5 0 10C0 15.5 4.5 20 10 20C15.5 20 20 15.5 20 10C20 4.5 15.5 0 10 0ZM10 18C5.6 18 2 14.4 2 10C2 5.6 5.6 2 10 2C14.4 2 18 5.6 18 10C18 14.4 14.4 18 10 18Z" fill="currentColor" fillOpacity="0.2"/>
              <path d="M10.5 5H9.5V10.2L12.2 12.9L12.9 12.2L10.5 9.8V5Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-value">{formatCurrency(pendingAmount)}</p>
            <p className="stat-subtext">{pendingQuotations.length} quotations</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon draft-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V9L13 3Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 3V9H19" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Drafts</h3>
            <p className="stat-value">{draftQuotations.length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="recent-quotations">
          <h2>Recent Quotations</h2>
          {recentQuotations.length === 0 ? (
            <p>No quotations found.</p>
          ) : (
            <div className="recent-quotations-list">
              {recentQuotations.map(quotation => (
                <Link to={`/quotations/${quotation.id}`} key={quotation.id} className="recent-quotation-item">
                  <div className="quotation-item-left">
                    <div className="quotation-id">
                      <span>#</span>{quotation.id?.toString().padStart(6, '0')}
                    </div>
                    <div className="quotation-client">
                      {quotation.client_name}
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
              <Link to="/quotations" className="view-all-link">
                View all quotations
                <svg width="7" height="10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1l4 4-4 4" stroke="#7C5DFA" strokeWidth="2" fill="none" fillRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        <div className="status-summary">
          <h2>Status Summary</h2>
          <div className="status-chart">
            <div className="chart-bar">
              <div 
                className="chart-fill paid" 
                style={{width: `${totalQuotations ? (paidQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Paid</span>
              <span className="chart-value" data-percent={`${Math.round(totalQuotations ? (paidQuotations.length / totalQuotations) * 100 : 0)}%`}>
                {paidQuotations.length}
              </span>
            </div>
            
            <div className="chart-bar">
              <div 
                className="chart-fill pending" 
                style={{width: `${totalQuotations ? (pendingQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Pending</span>
              <span className="chart-value" data-percent={`${Math.round(totalQuotations ? (pendingQuotations.length / totalQuotations) * 100 : 0)}%`}>
                {pendingQuotations.length}
              </span>
            </div>
            
            <div className="chart-bar">
              <div 
                className="chart-fill draft" 
                style={{width: `${totalQuotations ? (draftQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Draft</span>
              <span className="chart-value" data-percent={`${Math.round(totalQuotations ? (draftQuotations.length / totalQuotations) * 100 : 0)}%`}>
                {draftQuotations.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 