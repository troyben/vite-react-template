import type { StatusGroup } from '@/hooks/useDashboardData';

interface StatusSummaryProps {
  totalQuotations: number;
  groups: StatusGroup[];
}

export function StatusSummary({ totalQuotations, groups }: StatusSummaryProps) {
  return (
    <div className="status-summary">
      <h2>Status Summary</h2>
      <div className="status-chart">
        {groups.map(group => (
          <div className="chart-bar" key={group.cssClass}>
            <div
              className={`chart-fill ${group.cssClass}`}
              style={{ width: `${totalQuotations ? (group.quotations.length / totalQuotations) * 100 : 0}%` }}
            ></div>
            <span className="chart-label">{group.label}</span>
            <span className="chart-value">{group.quotations.length}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
