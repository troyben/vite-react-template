import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';
import type { PaginationParams, PaginatedResponse } from '@/types/pagination';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number | null;
}

export const getAllClients = async (
  params?: PaginationParams
): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Client>>>> => {
  try {
    return await api.get('/clients', { params });
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
