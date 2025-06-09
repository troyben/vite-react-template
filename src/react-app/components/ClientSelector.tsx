import { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/ClientSelector.css';

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

interface ClientSelectorProps {
  onSelect: (client: Client) => void;
  selectedClient: Client | null;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelect, selectedClient }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await api.getClients();
        setClients(data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to fetch clients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleNewClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdClient = await api.createClient(newClient as Client);
      setClients([...clients, createdClient]);
      setShowNewClientForm(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        company: ''
      });
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="modal-overlay"><div className="client-selector">Loading clients...</div></div>;
  if (error) return <div className="modal-overlay"><div className="client-selector error">{error}</div></div>;

  return (
    <div className="modal-overlay">
      <div className="client-selector">
        <div className="client-selector-header">
          <h2>Select Client</h2>
        </div>

        <div className="client-search">
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="client-list">
          {filteredClients.length > 0 ? filteredClients.map(client => (
            <div
              key={client.id}
              className={`client-item ${selectedClient?.id === client.id ? 'selected' : ''}`}
              onClick={() => onSelect(client)}
            >
              <h4>{client.name}</h4>
              {client.company && <p><strong>Company:</strong> {client.company}</p>}
              <p><strong>Email:</strong> {client.email}</p>
              {client.phone && <p><strong>Phone:</strong> {client.phone}</p>}
            </div>
          )) : (
            <div className="no-results">No clients found matching "{searchTerm}"</div>
          )}
        </div>

        {!showNewClientForm ? (
        <button
          className="btn-secondary"
          onClick={() => setShowNewClientForm(true)}
        >
          Add New Client
        </button>
      ) : (
        <div className="new-client-form">
          <h3>Add New Client</h3>
          <form onSubmit={handleNewClientSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={newClient.company}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNewClientForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Client
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </div>
  );
};

export default ClientSelector;