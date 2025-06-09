import { mockQuotations } from '../data/mockData';
import type { ProductData } from '../components/ProductSketch';

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface QuotationItem {
  item: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  productSketch?: ProductData & {
    sketchSvg?: string;
    openingPanels?: number[];
    panelDivisions?: Array<{
      panelIndex: number;
      horizontalCount: number;
      verticalCount: number;
    }>;
    openingPanes?: Array<{
      panelIndex: number;
      rowIndex: number;
      colIndex: number;
    }>;
  };
}

export interface Quotation {
  id?: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  items: QuotationItem[];
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

// Mock data for clients
const mockClients: Client[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'ABC Corp'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    company: 'XYZ Ltd'
  }
];

const api = {
  // Quotation endpoints
  getQuotations: async (): Promise<Quotation[]> => {
    // In a real app, this would be: return fetch(`${API_URL}/quotations`).then(res => res.json());
    return Promise.resolve(mockQuotations);
  },

  getQuotationById: async (id: number): Promise<Quotation> => {
    // In a real app, this would be: return fetch(`${API_URL}/quotations/${id}`).then(res => res.json());
    const quotation = mockQuotations.find(q => q.id === id);
    if (!quotation) throw new Error('Quotation not found');
    return Promise.resolve(quotation);
  },

  createQuotation: async (quotation: Quotation): Promise<Quotation> => {
    // In a real app, this would be:
    // return fetch(`${API_URL}/quotations`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(quotation)
    // }).then(res => res.json());
    const newQuotation = {
      ...quotation,
      id: Math.max(...mockQuotations.map(q => q.id || 0)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockQuotations.push(newQuotation);
    return Promise.resolve(newQuotation);
  },

  updateQuotation: async (id: number, quotation: Partial<Quotation>): Promise<Quotation> => {
    // In a real app, this would be:
    // return fetch(`${API_URL}/quotations/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(quotation)
    // }).then(res => res.json());
    const index = mockQuotations.findIndex(q => q.id === id);
    if (index === -1) throw new Error('Quotation not found');
    const updatedQuotation = {
      ...mockQuotations[index],
      ...quotation,
      updated_at: new Date().toISOString()
    };
    mockQuotations[index] = updatedQuotation;
    return Promise.resolve(updatedQuotation);
  },

  deleteQuotation: async (id: number): Promise<void> => {
    // In a real app, this would be:
    // return fetch(`${API_URL}/quotations/${id}`, { method: 'DELETE' }).then(res => res.json());
    const index = mockQuotations.findIndex(q => q.id === id);
    if (index === -1) throw new Error('Quotation not found');
    mockQuotations.splice(index, 1);
    return Promise.resolve();
  },

  // Client endpoints
  getClients: async (): Promise<Client[]> => {
    // In a real app, this would be: return fetch(`${API_URL}/clients`).then(res => res.json());
    return Promise.resolve(mockClients);
  },

  getClientById: async (id: number): Promise<Client> => {
    // In a real app, this would be: return fetch(`${API_URL}/clients/${id}`).then(res => res.json());
    const client = mockClients.find(c => c.id === id);
    if (!client) throw new Error('Client not found');
    return Promise.resolve(client);
  },

  createClient: async (client: Client): Promise<Client> => {
    // In a real app, this would be:
    // return fetch(`${API_URL}/clients`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(client)
    // }).then(res => res.json());
    const newClient = {
      ...client,
      id: Math.max(...mockClients.map(c => c.id)) + 1
    };
    mockClients.push(newClient);
    return Promise.resolve(newClient);
  },

  updateClient: async (id: number, client: Partial<Client>): Promise<Client> => {
    // In a real app, this would be:
    // return fetch(`${API_URL}/clients/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(client)
    // }).then(res => res.json());
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');
    const updatedClient = {
      ...mockClients[index],
      ...client
    };
    mockClients[index] = updatedClient;
    return Promise.resolve(updatedClient);
  },

  deleteClient: async (id: number): Promise<void> => {
    // In a real app, this would be:
    // return fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' }).then(res => res.json());
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');
    mockClients.splice(index, 1);
    return Promise.resolve();
  }
};

export default api; 