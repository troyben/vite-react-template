import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  draft: { variant: 'secondary', className: '' },
  sent: { variant: 'outline', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  pending: { variant: 'outline', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  approved: { variant: 'outline', className: 'border-green-200 bg-green-50 text-green-700' },
  accepted: { variant: 'outline', className: 'border-green-200 bg-green-50 text-green-700' },
  rejected: { variant: 'destructive', className: '' },
  paid: { variant: 'outline', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const config = statusConfig[status] || { variant: 'secondary' as const, className: '' };
  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
