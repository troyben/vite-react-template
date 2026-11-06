import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import type { Quotation } from '@/services/quotationService';
import { canAccessQuotationCosts, quotationAmount } from '@/services/quotationPresentationService';
import { formatAmount } from '@/utils/quotationHelpers';
import { StaffIdentity } from './StaffIdentity';
import { StatusBadge } from './StatusBadge';
import { QuotationListActions, type QuotationListActionHandlers } from './QuotationListActions';

interface QuotationListColumnsProps extends QuotationListActionHandlers { user: { id: number; role: string } | null }
export function quotationListColumns({ user, ...actions }: QuotationListColumnsProps): ColumnDef<Quotation>[] {
  return [
    { accessorKey: 'id', header: 'Quote ID', cell: ({ row }) => <Link to={`/quotations/${row.original.id}`} className="font-semibold text-primary hover:underline">#{row.original.id}</Link> },
    { accessorKey: 'client_name', header: 'Client name' },
    { accessorKey: 'client_phone', header: 'Phone' },
    ...(user?.role === 'admin' || user?.role === 'user' ? [{ id: 'creator', header: 'Created by', enableSorting: false,
      cell: ({ row }) => <StaffIdentity user={row.original.creator} userId={row.original.createdBy} fallback="Creator unavailable" /> } satisfies ColumnDef<Quotation>] : []),
    { accessorKey: 'total_amount', header: 'Total', cell: ({ row }) => {
      const amount = quotationAmount(row.original);
      return <div className="leading-tight"><div className="font-medium tabular-nums">{formatAmount(amount.headline)}</div>
        {amount.showSubtotal && <div className="text-[10px] tabular-nums text-muted-foreground">Subtotal {formatAmount(amount.subtotal)}</div>}</div>;
    } },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => <QuotationListActions {...actions} id={row.original.id} writable={canAccessQuotationCosts(user, row.original)} /> },
  ];
}
