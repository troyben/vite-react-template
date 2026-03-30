import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllQuotations, deleteQuotation, type Quotation } from '@/services/quotationService';
import { getAllClients, type Client } from '@/services/clientService';

const ITEMS_PER_PAGE = 5;

export function useQuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quotationsRes, clientsRes] = await Promise.all([
          getAllQuotations(),
          getAllClients()
        ]);

        setQuotations(quotationsRes.data.success ? quotationsRes.data.data : []);

        const clientMap = (clientsRes.data.success ? clientsRes.data.data : []).reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as Record<number, Client>);

        setClients(clientMap);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        const response = await deleteQuotation(id);
        if (response.data.success) {
          setQuotations(prev => prev.filter(q => q.id !== id));
        }
      } catch (err) {
        console.error('Error deleting quotation:', err);
      }
    }
  }, []);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation => {
      const client = clients[quotation.clientId];
      return client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [quotations, clients, searchTerm]);

  const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  return {
    loading,
    clients,
    searchTerm,
    currentPage,
    totalPages,
    currentQuotations,
    filteredQuotations,
    handleDelete,
    handleSearch,
    clearSearch,
    setCurrentPage,
  };
}
