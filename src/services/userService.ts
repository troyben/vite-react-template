import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';
import type { PaginationParams, PaginatedResponse } from '@/types/pagination';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: 'admin' | 'user' | 'client';
  clientId?: number | null;
}

export const getAllUsers = async (
  params?: PaginationParams
): Promise<AxiosResponse<ApiResponse<PaginatedResponse<User>>>> => {
  try {
    return await api.get('/users', { params });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getUser = async (id: number): Promise<AxiosResponse<ApiResponse<User>>> => {
  try {
    return await api.get(`/users/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const createUser = async (userData: Omit<User, 'id'> & { password: string }): Promise<AxiosResponse<ApiResponse<User>>> => {
  try {
    return await api.post('/users', userData);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
  try {
    return await api.put(`/users/${id}`, userData);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteUser = async (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.delete(`/users/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const resetUserPassword = async (userId: number, password: string): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.post(`/auth/reset-password/${userId}`, { password });
  } catch (error) {
    return handleServiceError(error);
  }
};
