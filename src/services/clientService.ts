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

export const createClient = async (
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AxiosResponse<ApiResponse<Client>>> => {
  try {
    return await api.post('/clients', client);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateClient = async (
  id: number, 
  client: Partial<Client>
): Promise<AxiosResponse<ApiResponse<Client>>> => {
  try {
    return await api.put(`/clients/${id}`, client);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteClient = async (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.delete(`/clients/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};
