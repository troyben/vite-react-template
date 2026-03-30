import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';

interface ApiResponse<T> {
  success: boolean;
  data: {
    user: T;
  };
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  avatar?: string;
}

export const fetchProfile = async (): Promise<AxiosResponse<ApiResponse<ProfileData>>> => {
  try {
    return await api.get('/auth/me');
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateProfile = async (id: number, updates: Partial<ProfileData>): Promise<AxiosResponse<ApiResponse<ProfileData>>> => {
  try {
    return await api.put(`/users/${id}`, updates);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.post('/auth/change-password', data);
  } catch (error) {
    return handleServiceError(error);
  }
};
