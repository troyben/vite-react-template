import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import * as clientApi from '@/services/clientService';
import type { Client } from '@/services/clientService';
import { notify } from '@/utils/notifications';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const itemsPerPage = 10;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientApi.getAllClients();
      setClients(response.data.success ? response.data.data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
      notify.error(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const openAddForm = useCallback(() => {
    setEditingClient(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingClient(null);
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;

    if (!name || !address) {
      notify.error('Name and address are required');
      return;
    }

    const clientData = {
      name,
      address,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      company: formData.get('company') as string || undefined,
    };

    try {
      if (editingClient) {
        const response = await clientApi.updateClient(editingClient.id, clientData);
        if (response.data.success) {
          notify.success('Client updated successfully');
        }
      } else {
        const response = await clientApi.createClient(clientData);
        if (response.data.success) {
          notify.success('Client created successfully');
        }
      }
      closeForm();
      fetchClients();
    } catch (err: any) {
      notify.error(err.message || 'Failed to save client');
    }
  }, [editingClient, closeForm, fetchClients]);

  const handleDelete = useCallback(async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await clientApi.deleteClient(clientId);
      if (response.data.success) {
        notify.success('Client deleted successfully');
        fetchClients();
      }
    } catch (err: any) {
      notify.error(err.message || 'Failed to delete client');
    }
  }, [fetchClients]);

  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="actions">
          <button className="btn-icon" title="Edit" onClick={() => openEditForm(info.row.original)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 2.5L17.5 5.5M2.5 17.5V14.5L12.5 4.5L15.5 7.5L5.5 17.5H2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn-icon" title="Delete" onClick={() => handleDelete(info.row.original.id)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5.5H17M7.5 5.5V4C7.5 3.44772 7.94772 3 8.5 3H11.5C12.0523 3 12.5 3.44772 12.5 4V5.5M14.5 5.5V16C14.5 16.5523 14.0523 17 13.5 17H6.5C5.94772 17 5.5 16.5523 5.5 16V5.5H14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ),
    },
  ], [openEditForm, handleDelete]);

  const totalPages = Math.ceil(clients.length / itemsPerPage);

  return {
    clients,
    loading,
    error,
    currentPage,
    totalPages,
    columns,
    isFormOpen,
    editingClient,
    handlePageChange,
    openAddForm,
    closeForm,
    handleFormSubmit,
  };
}
