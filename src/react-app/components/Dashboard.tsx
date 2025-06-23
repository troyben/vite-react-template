import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllQuotations, type Quotation } from '../services/quotationService';
import { getAllClients, type Client } from '../services/clientService';
import '../styles/variables.css';
import '../styles/Dashboard.css';
import { ScreenLoader } from './ScreenLoader';

const statusMap = {
  'draft': 'Draft',
  'sent': 'Pending',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'paid': 'Paid'
};

const Dashboard = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quotationsRes, clientsRes] = await Promise.all([
          getAllQuotations(),
          getAllClients()
        ]);
        
        // Correctly access the nested data property
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

  const formatCurrency = (amount: any): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return typeof num === 'number' && !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
  };

  // Calculate statistics with amounts
  const totalQuotations = quotations.length;
  
  const calculateAmount = (quotations: Quotation[]) => {
    return quotations.reduce((sum, quotation) => {
      const amount = typeof quotation.total_amount === 'string' 
        ? parseFloat(quotation.total_amount) 
        : Number(quotation.total_amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const paidQuotations = quotations.filter(q => q.status === 'paid');
  const paidAmount = calculateAmount(paidQuotations);

  const pendingQuotations = quotations.filter(q => q.status === 'sent');
  const pendingAmount = calculateAmount(pendingQuotations);

  const approvedQuotations = quotations.filter(q => q.status === 'approved');
  const approvedAmount = calculateAmount(approvedQuotations);

  const draftQuotations = quotations.filter(q => q.status === 'draft');
  const draftAmount = calculateAmount(draftQuotations);

  const rejectedQuotations = quotations.filter(q => q.status === 'rejected');

  // Get recent quotations (last 5)
  const recentQuotations = [...quotations]
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  if (loading) return <ScreenLoader isLoading={true} />;
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
          <div className="stat-icon approved-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="currentColor" fillOpacity="0.2"/>
              <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Approved</h3>
            <p className="stat-value">{formatCurrency(approvedAmount)}</p>
            <p className="stat-subtext">{approvedQuotations.length} quotations</p>
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
            <p className="stat-value">{formatCurrency(draftAmount)}</p>
            <p className="stat-subtext">{draftQuotations.length} quotations</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
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
          {recentQuotations.length === 0 ? (
            <p>No quotations found.</p>
          ) : (
            <div className="recent-quotations-list">
              {recentQuotations.map(quotation => (
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

        <div className="status-summary">
          <h2>Status Summary</h2>
          <div className="status-chart">
            <div className="chart-bar">
              <div 
                className="chart-fill paid" 
                style={{width: `${totalQuotations ? (paidQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Paid</span>
              <span className="chart-value">{paidQuotations.length}</span>
            </div>
            
            <div className="chart-bar">
              <div 
                className="chart-fill approved" 
                style={{width: `${totalQuotations ? (approvedQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Approved</span>
              <span className="chart-value">{approvedQuotations.length}</span>
            </div>
            
            <div className="chart-bar">
              <div 
                className="chart-fill pending" 
                style={{width: `${totalQuotations ? (pendingQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Pending</span>
              <span className="chart-value">{pendingQuotations.length}</span>
            </div>

            <div className="chart-bar">
              <div 
                className="chart-fill rejected" 
                style={{width: `${totalQuotations ? (rejectedQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Rejected</span>
              <span className="chart-value">{rejectedQuotations.length}</span>
            </div>
            
            <div className="chart-bar">
              <div 
                className="chart-fill draft" 
                style={{width: `${totalQuotations ? (draftQuotations.length / totalQuotations) * 100 : 0}%`}}
              ></div>
              <span className="chart-label">Draft</span>
              <span className="chart-value">{draftQuotations.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;