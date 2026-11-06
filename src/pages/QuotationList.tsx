import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useQuotationList } from '@/hooks/useQuotationList';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenLoader } from '@/components/ScreenLoader';
import BaseDataTable from '@/components/BaseDataTable';
import { buttonVariants } from '@/components/ui/button';
import { quotationListColumns } from '@/components/quotations/quotationListColumns';

const QuotationList = () => {
  const { user } = useAuth();
  const { loading, quotations, searchTerm, currentPage, totalPages, totalItems, handleDelete, handleSearch, handlePageChange, navigate, deletingId } = useQuotationList();
  const columns = useMemo(() => quotationListColumns({ user, onView: id => navigate(`/quotations/${id}`), onEdit: id => navigate(`/quotations/edit/${id}`), onDelete: handleDelete, deletingId }), [user, navigate, handleDelete, deletingId]);
  return <div className="space-y-4 p-3 md:p-4">
    <ScreenLoader isLoading={loading} />
    <PageHeader><h1 className="text-2xl font-semibold">Quotations</h1>
      {user?.role !== 'client' && <Link to="/quotations/new" className={buttonVariants()}><Plus className="h-4 w-4" />New Quotation</Link>}
    </PageHeader>
    <BaseDataTable columns={columns} data={quotations} searchPlaceholder="Search by client name or status" searchValue={searchTerm} onSearch={handleSearch}
      currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={handlePageChange}
      onRowClick={quotation => navigate(`/quotations/${quotation.id}`)} getRowLabel={quotation => `Open quotation #${quotation.id}`} />
  </div>;
};
export default QuotationList;
