import { Badge } from '@/components/ui/badge';
import { formatStatus, getStatusClass } from '@/utils/quotationHelpers';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`status-badge refined-status-badge ${getStatusClass(status)} ${className}`}
      style={{
        fontSize: 14,
        fontWeight: 700,
        padding: '6px 16px',
        borderRadius: 6,
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 80,
        justifyContent: 'center'
      }}
    >
      {formatStatus(status)}
    </span>
  );
}
