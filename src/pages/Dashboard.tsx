import { Link } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentQuotations } from '@/components/dashboard/RecentQuotations';
import { StatusSummary } from '@/components/dashboard/StatusSummary';
import { ScreenLoader } from '@/components/ScreenLoader';
import '../styles/variables.css';
import '../styles/Dashboard.css';

// --- SVG Icons (preserved from original) ---

const PaidIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0C4.5 0 0 4.5 0 10C0 15.5 4.5 20 10 20C15.5 20 20 15.5 20 10C20 4.5 15.5 0 10 0ZM10 18C5.6 18 2 14.4 2 10C2 5.6 5.6 2 10 2C14.4 2 18 5.6 18 10C18 14.4 14.4 18 10 18Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M10.5 5H9.5V10.2L12.2 12.9L12.9 12.2L10.5 9.8V5Z" fill="currentColor"/>
  </svg>
);

const ApprovedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DraftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V9L13 3Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13 3V9H19" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
    <path d="M8 1V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const Dashboard = () => {
  const data = useDashboardData();

  if (data.loading) return <ScreenLoader isLoading={true} />;
  if (data.error) return <div className="error">{data.error}</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Welcome to your quotation management system</p>
        </div>
        <div className="header-actions">
          <Link to="/quotations/new" className="btn btn-primary">
            <PlusIcon />
            Create New Quotation
          </Link>
        </div>
      </header>

      <div className="dashboard-stats">
        <StatCard icon={<PaidIcon />} iconClassName="paid-icon" title="Paid" amount={data.paid.amount} count={data.paid.quotations.length} />
        <StatCard icon={<PendingIcon />} iconClassName="pending-icon" title="Pending" amount={data.pending.amount} count={data.pending.quotations.length} />
        <StatCard icon={<ApprovedIcon />} iconClassName="approved-icon" title="Approved" amount={data.approved.amount} count={data.approved.quotations.length} />
        <StatCard icon={<DraftIcon />} iconClassName="draft-icon" title="Drafts" amount={data.draft.amount} count={data.draft.quotations.length} />
      </div>

      <div className="dashboard-sections">
        <RecentQuotations quotations={data.recentQuotations} clients={data.clients} />
        <StatusSummary
          totalQuotations={data.totalQuotations}
          groups={[data.paid, data.approved, data.pending, data.rejected, data.draft]}
        />
      </div>
    </div>
  );
};

export default Dashboard;
