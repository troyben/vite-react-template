import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuotations, deleteQuotation, type Quotation } from '@/services/quotationService';
import { notify } from '@/utils/notifications';

export function useQuotationList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchQuotations = useCallback(async (page: number, search?: string) => {
    try {
      setLoading(true);
      const response = await getAllQuotations({ page, limit: 10, search });
      if (response.data.success) {
        setQuotations(response.data.data.items);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
        setCurrentPage(response.data.data.pagination.page);
      }
    } catch (err) {
      notify.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations(1);
  }, [fetchQuotations]);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        const response = await deleteQuotation(id);
        if (response.data.success) {
          notify.success('Quotation deleted successfully');
          fetchQuotations(currentPage, searchTerm);
        }
      } catch (err) {
        notify.error('Failed to delete quotation');
      }
    }
  }, [fetchQuotations, currentPage, searchTerm]);

  const handlePageChange = useCallback((page: number) => {
    fetchQuotations(page, searchTerm);
  }, [fetchQuotations, searchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQuotations(1, term);
    }, 300);
  }, [fetchQuotations]);

  const getStatusVariant = useCallback((status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary' as const;
      case 'sent':
        return 'default' as const;
      case 'approved':
      case 'accepted':
      case 'paid':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  }, []);

  const getStatusClassName = useCallback((status: string) => {
    switch (status) {
      case 'approved':
      case 'accepted':
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-100/80';
      default:
        return '';
    }
  }, []);

  return {
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
  };
}
