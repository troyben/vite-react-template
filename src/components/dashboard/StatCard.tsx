import type { ReactNode } from 'react';
import { formatCurrency } from '@/hooks/useDashboardData';

interface StatCardProps {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  amount: number;
  count: number;
}

export function StatCard({ icon, iconClassName, title, amount, count }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClassName}`}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{formatCurrency(amount)}</p>
        <p className="stat-subtext">{count} quotations</p>
      </div>
    </div>
  );
}
