import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuotationList } from '@/hooks/useQuotationList';
import { useAuth } from '@/contexts/AuthContext';
import type { Quotation } from '@/services/quotationService';
import { formatAmount } from '@/utils/quotationHelpers';
import { ScreenLoader } from '@/components/ScreenLoader';
import BaseDataTable from '@/components/BaseDataTable';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const QuotationList = () => {
  const { user } = useAuth();
  const {
    loading,
    quotations,
    searchTerm,
    currentPage,
    totalPages,
    totalItems,
    handleDelete,
    handleSearch,
    handlePageChange,
    navigate,
    getStatusVariant,
    getStatusClassName,
  } = useQuotationList();

  const canWrite = (row: Quotation) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'client') return false;
    if (row.createdBy === null) return false;
    return row.createdBy === user.id;
  };

  const columns = useMemo<ColumnDef<Quotation, any>[]>(() => [
    {
      accessorKey: 'client_name',
      header: 'Client Name',
    },
    {
      accessorKey: 'client_phone',
      header: 'Phone',
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ getValue }) => formatAmount(getValue()),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <Badge
            variant={getStatusVariant(status)}
            className={getStatusClassName(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const writable = canWrite(row.original);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/quotations/${row.original.id}`)} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-sm">View</div>
                    <div className="text-xs text-muted-foreground">View quotation details</div>
                  </div>
                </DropdownMenuItem>
                {writable && (
                  <DropdownMenuItem onClick={() => navigate(`/quotations/edit/${row.original.id}`)} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    <div>
                      <div className="text-sm">Edit</div>
                      <div className="text-xs text-muted-foreground">Modify this quotation</div>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              {writable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => handleDelete(row.original.id)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <div>
                        <div className="text-sm">Delete</div>
                        <div className="text-xs text-muted-foreground">Remove this quotation</div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [user, navigate, handleDelete, getStatusVariant, getStatusClassName]);

  return (
    <div className="p-6 space-y-6">
      <ScreenLoader isLoading={loading} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quotations</h1>
        {user?.role !== 'client' && (
          <Link to="/quotations/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            New Quotation
          </Link>
        )}
      </div>
      <BaseDataTable
        columns={columns}
        data={quotations}
        searchPlaceholder="Search by client name or status"
        searchValue={searchTerm}
        onSearch={handleSearch}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default QuotationList;
