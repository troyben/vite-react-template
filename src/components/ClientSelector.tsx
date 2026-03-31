import { useState, useEffect } from 'react';
import { getAllClients, createClient, Client } from '../services/clientService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ClientSelectorProps {
  onSelect: (client: Client) => void;
  selectedClient: Client | null;
  onClose: () => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelect, selectedClient, onClose }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthError = (error: any): boolean => {
    return error?.response?.status === 401 || error?.message?.toLowerCase().includes('unauthorized');
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await getAllClients({ limit: 100 });
        setClients(response.data.success ? response.data.data.items : []);
      } catch (err) {
        if (!isAuthError(err)) {
          console.error('Error fetching clients:', err);
          setError('Failed to fetch clients. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleNewClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newClient.name || !newClient.phone || !newClient.address) {
        throw new Error('Name, phone and address are required');
      }

      const clientData = {
        name: newClient.name,
        address: newClient.address,
        phone: newClient.phone,
        email: newClient.email || undefined,
        company: newClient.company || undefined
      } as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

      const response = await createClient(clientData);
      if (response.data.success) {
        setClients(prev => [...prev, response.data.data]);
        setShowNewClientForm(false);
        setNewClient({ name: '', email: '', phone: '', company: '', address: '' });
      }
    } catch (err) {
      console.error('Error creating client:', err);
      setError(err instanceof Error ? err.message : 'Failed to create client. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-card p-6 text-card-foreground">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-card p-6 text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Select Client</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-4 max-h-64 space-y-1 overflow-y-auto">
          {filteredClients.length > 0 ? filteredClients.map(client => (
            <div
              key={client.id}
              className={`cursor-pointer rounded-md p-3 transition-colors hover:bg-muted ${
                selectedClient?.id === client.id ? 'border border-primary bg-primary/5' : ''
              }`}
              onClick={() => onSelect(client)}
            >
              <h4 className="text-sm font-medium">{client.name}</h4>
              {client.phone && <p className="text-xs text-muted-foreground">Phone: {client.phone}</p>}
            </div>
          )) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No clients found matching "{searchTerm}"
            </div>
          )}
        </div>

        {!showNewClientForm ? (
          <Button variant="outline" className="w-full" onClick={() => setShowNewClientForm(true)}>
            Add New Client
          </Button>
        ) : (
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-sm font-semibold">Add New Client</h3>
            <form onSubmit={handleNewClientSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={newClient.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={newClient.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={newClient.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewClientForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Client</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSelector;
