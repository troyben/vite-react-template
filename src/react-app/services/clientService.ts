import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface Client {
  id: number;
  name: string;      // Required
  email?: string;    // Optional
  phone?: string;    // Optional
  company?: string;  // Optional
  address: string;   // Required
  createdAt?: string;
  updatedAt?: string;
}

// Add helper function to check if error is auth-related
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401;
};

export const getAllClients = async (): Promise<AxiosResponse<ApiResponse<Client[]>>> => {
  try {
    return await api.get('/clients');
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getClientById = async (id: number): Promise<AxiosResponse<ApiResponse<Client>>> => {
  try {
    return await api.get(`/clients/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const createClient = (
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AxiosResponse<ApiResponse<Client>>> => {
  return api.post('/clients', client);
};

export const updateClient = (
  id: number, 
  client: Partial<Client>
): Promise<AxiosResponse<ApiResponse<Client>>> => {
  return api.put(`/clients/${id}`, client);
};

export const deleteClient = (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
  return api.delete(`/clients/${id}`);
};
