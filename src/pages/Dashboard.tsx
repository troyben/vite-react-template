import { Link } from 'react-router-dom';
import { CircleCheck, Clock, FileText, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentQuotations } from '@/components/dashboard/RecentQuotations';
import { StatusSummary } from '@/components/dashboard/StatusSummary';
import { ScreenLoader } from '@/components/ScreenLoader';

const Dashboard = () => {
  const data = useDashboardData();

  if (data.loading) return <ScreenLoader isLoading={true} />;
  if (data.error) return <div className="p-6 text-destructive">{data.error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your quotation management system</p>
        </div>
        <Link to="/quotations/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New Quotation
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CircleCheck className="h-5 w-5" />} iconClassName="paid-icon" title="Paid" amount={data.paid.amount} count={data.paid.quotations.length} />
        <StatCard icon={<Clock className="h-5 w-5" />} iconClassName="pending-icon" title="Pending" amount={data.pending.amount} count={data.pending.quotations.length} />
        <StatCard icon={<CircleCheck className="h-5 w-5" />} iconClassName="approved-icon" title="Approved" amount={data.approved.amount} count={data.approved.quotations.length} />
        <StatCard icon={<FileText className="h-5 w-5" />} iconClassName="draft-icon" title="Drafts" amount={data.draft.amount} count={data.draft.quotations.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentQuotations quotations={data.recentQuotations} clients={data.clients} />
        </div>
        <StatusSummary
          totalQuotations={data.totalQuotations}
          groups={[data.paid, data.approved, data.pending, data.rejected, data.draft]}
        />
      </div>
    </div>
  );
};

export default Dashboard;
