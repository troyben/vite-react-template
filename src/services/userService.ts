import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';

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
}

export const getAllUsers = async (): Promise<AxiosResponse<ApiResponse<User[]>>> => {
  try {
    return await api.get('/users');
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

export const resetUserPassword = async (userId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.post(`/auth/reset-password/${userId}`);
  } catch (error) {
    return handleServiceError(error);
  }
};
