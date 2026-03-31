import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/hooks/useDashboardData';

interface StatCardProps {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  amount: number;
  count: number;
}

const iconColors: Record<string, string> = {
  'paid-icon': 'text-emerald-600 bg-emerald-50',
  'pending-icon': 'text-amber-600 bg-amber-50',
  'approved-icon': 'text-green-600 bg-green-50',
  'draft-icon': 'text-slate-600 bg-slate-50',
};

export function StatCard({ icon, iconClassName, title, amount, count }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconColors[iconClassName] || ''}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
          <p className="text-xs text-muted-foreground">{count} quotations</p>
        </div>
      </CardContent>
    </Card>
  );
}
