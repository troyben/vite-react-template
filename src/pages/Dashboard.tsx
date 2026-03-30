import { Link } from 'react-router-dom';
import { CircleCheck, Clock, FileText, Plus } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentQuotations } from '@/components/dashboard/RecentQuotations';
import { StatusSummary } from '@/components/dashboard/StatusSummary';
import { ScreenLoader } from '@/components/ScreenLoader';
import '../styles/variables.css';
import '../styles/Dashboard.css';

// --- SVG Icons (preserved from original) ---

const PaidIcon = () => (
  <CircleCheck className="w-5 h-5" />
);

const PendingIcon = () => (
  <Clock className="w-5 h-5" />
);

const ApprovedIcon = () => (
  <CircleCheck className="w-5 h-5" />
);

const DraftIcon = () => (
  <FileText className="w-5 h-5" />
);

const PlusIcon = () => (
  <Plus className="w-4 h-4" style={{ marginRight: '8px' }} />
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
