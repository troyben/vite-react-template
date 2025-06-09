import { useState, useMemo } from 'react';
import BaseDataTable from './BaseDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import '../styles/Clients.css';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([
    // Sample data - replace with actual data from your backend
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 890',
      company: 'Acme Inc'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 234 567 891',
      company: 'XYZ Corp'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const itemsPerPage = 10;

  // Filter clients based on search term
  const filteredClients = useMemo(() => 
    clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [clients, searchTerm]
  );

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => 
    filteredClients.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredClients, currentPage]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = (clientId: string) => {
    // Add delete confirmation and API call
    setClients(clients.filter(client => client.id !== clientId));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add form submission logic here
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: info => info.getValue(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="actions" style={{ display: 'flex', gap: 8 }}>
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
  ], [clients]);

  // Use pagination and search in the table
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

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      <BaseDataTable
        columns={columns}
        data={paginatedClients}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <form className="client-form" onSubmit={handleFormSubmit}>
              <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={editingClient?.name}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={editingClient?.company}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    defaultValue={editingClient?.email}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    defaultValue={editingClient?.phone}
                    required
                  />
                </div>
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