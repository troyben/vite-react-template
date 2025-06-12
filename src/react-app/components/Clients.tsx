import { useState, useMemo, useEffect } from 'react';
import BaseDataTable from './BaseDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import '../styles/Clients.css';
import * as clientApi from '../services/clientService';
import type { Client } from '../services/clientService';
import { notify } from '../utils/notifications';

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientApi.getAllClients();
      setClients(response.data.success ? response.data.data : []);
    } catch (err: any) {
      if (!clientApi.isAuthError(err)) {
        setError(err.message || 'Failed to fetch clients');
        notify.error(err.message || 'Failed to fetch clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = async (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get form values with proper type checking
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    
    if (!name || !address) {
      notify.error('Name and address are required');
      return;
    }

    const clientData = {
      name,                                          // Required
      address,                                       // Required
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
      setIsFormOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (err: any) {
      notify.error(err.message || 'Failed to save client');
    }
  };

  const handleDelete = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      const response = await clientApi.deleteClient(clientId);
      if (response.data.success) {
        notify.success('Client deleted successfully');
        fetchClients(); // Refresh the list
      }
    } catch (err: any) {
      notify.error(err.message || 'Failed to delete client');
    }
  };

  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'company',
      header: 'Company',
    },
    {
      accessorKey: 'email',
      header: 'Email',
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
          <button className="btn-icon" title="Edit" onClick={() => handleEdit(info.row.original)}>
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
  ], []);

  return (
    <div className="clients-container">
      <div className="page-header">
        <h1>Clients</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingClient(null);
            setIsFormOpen(true);
          }}
        >
          Add New Client
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <BaseDataTable
          columns={columns}
          data={clients} // Pass all clients, let BaseDataTable handle filtering
          globalFilterPlaceholder='Search by name, email, or phone'
          currentPage={currentPage}
          totalPages={Math.ceil(clients.length / itemsPerPage)}
          onPageChange={handlePageChange}
        />
      )}

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <form className="client-form" onSubmit={handleFormSubmit}>
              <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    defaultValue={editingClient?.name}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    name="company"
                    className="form-control"
                    defaultValue={editingClient?.company}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    defaultValue={editingClient?.email}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    defaultValue={editingClient?.phone}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea
                  name="address"
                  className="form-control"
                  defaultValue={editingClient?.address}
                  required
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingClient(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;