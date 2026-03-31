import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatusGroup } from '@/hooks/useDashboardData';

interface StatusSummaryProps {
  totalQuotations: number;
  groups: StatusGroup[];
}

const barColors: Record<string, string> = {
  paid: 'bg-emerald-500',
  approved: 'bg-green-500',
  pending: 'bg-amber-500',
  rejected: 'bg-red-500',
  draft: 'bg-slate-400',
};

export function StatusSummary({ totalQuotations, groups }: StatusSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map(group => {
          const pct = totalQuotations ? (group.quotations.length / totalQuotations) * 100 : 0;
          return (
            <div key={group.cssClass} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{group.label}</span>
                <span className="font-medium">{group.quotations.length}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${barColors[group.cssClass] || 'bg-slate-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
