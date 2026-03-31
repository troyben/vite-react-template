import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import * as clientApi from '@/services/clientService';
import type { Client } from '@/services/clientService';
import { notify } from '@/utils/notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchClients = useCallback(async (page: number, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientApi.getAllClients({ page, limit: 10, search });
      if (response.data.success) {
        setClients(response.data.data.items);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
        setCurrentPage(response.data.data.pagination.page);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
      notify.error(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

  const handlePageChange = useCallback((page: number) => {
    fetchClients(page, searchTerm);
  }, [fetchClients, searchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchClients(1, term);
    }, 300);
  }, [fetchClients]);

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
      fetchClients(currentPage, searchTerm);
    } catch (err: any) {
      notify.error(err.message || 'Failed to save client');
    }
  }, [editingClient, closeForm, fetchClients, currentPage, searchTerm]);

  const handleDelete = useCallback(async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await clientApi.deleteClient(clientId);
      if (response.data.success) {
        notify.success('Client deleted successfully');
        fetchClients(currentPage, searchTerm);
      }
    } catch (err: any) {
      notify.error(err.message || 'Failed to delete client');
    }
  }, [fetchClients, currentPage, searchTerm]);

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
      header: '',
      cell: info => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openEditForm(info.row.original)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">Edit</div>
                  <div className="text-xs text-muted-foreground">Modify client details</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(info.row.original.id)} className="cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">Delete</div>
                  <div className="text-xs text-muted-foreground">Remove this client</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [openEditForm, handleDelete]);

  return {
    clients,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    columns,
    isFormOpen,
    editingClient,
    searchTerm,
    handlePageChange,
    handleSearch,
    openAddForm,
    closeForm,
    handleFormSubmit,
  };
}
